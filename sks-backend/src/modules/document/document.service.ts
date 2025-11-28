import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { DocumentDto, MetadataDto } from './dtos/document.dto';
import { Document } from 'src/database/entities/document.entity';
import { Chunk } from 'src/database/entities/chunks.entity';
import { Summary } from 'src/database/entities/summary.entity';
import { UserDocument } from 'src/database/entities/user-document.entity';
import { DocumentRepository } from 'src/database/repositories/document.repository';
import { ChunkRepository } from 'src/database/repositories/chunks.repository';
import { UserDocumentRepository } from 'src/database/repositories/user-document.repository';
import { FolderRepository } from 'src/database/repositories/folder.repository';
import { PromptsService } from 'src/modules/prompts/prompts.service';
import { SummaryService } from 'src/modules/summary/summary.service';
import { OpenAIService } from 'src/common/llm/openai.service';

import { DataSource, Not, IsNull } from 'typeorm';

import * as crypto from 'crypto';
import pdfParse = require('pdf-parse');
import * as mammoth from 'mammoth';
import * as Tesseract from 'tesseract.js';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);
  private processedFiles = new Set<string>();

  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly chunkRepository: ChunkRepository,
    private readonly userDocumentRepository: UserDocumentRepository,
    private readonly folderRepository: FolderRepository,
    private readonly dataSource: DataSource,
    private readonly openAIService: OpenAIService,
    private readonly promptsService: PromptsService,
    private readonly summaryService: SummaryService,
  ) { }

  /**
   * Generate document to db
   */
  async createDocument(
    dto: DocumentDto,
    contentHash?: string,
  ): Promise<any> {
    return this.dataSource.transaction(async (manager) => {
      // Generate embedding for metadata
      const metadataText = this.metadataToText(dto.metadata || {});
      let metadataVector: number[] | null = null;
      try {
        metadataVector = await this.openAIService.createEmbedding(metadataText);
      } catch (error) {
        if (
          error.message?.includes('429') ||
          error.message?.includes('quota')
        ) {
          this.logger.warn(
            `OpenAI quota exceeded for document creation: ${error.message}. Proceeding without embedding.`,
          );
          metadataVector = null;
        } else {
          throw error;
        }
      }

      // First, save the document without chunks
      const document = manager.create(Document, {
        title: dto.title,
        metadata: dto.metadata || {},
        docDate: dto.docDate,
        extraAttributes: dto.extraAttributes,
        fileRef: dto.fileRef,
        fileSize: dto.fileSize,
        contentHash:
          contentHash ||
          (await this.generateContentHash(
            Buffer.from(dto.chunks?.join(' ') || ''),
          )),
        status: 'processed',
      });

      const savedDocument = await manager.save(Document, document);

      // Set the metadata vector on the saved document
      (savedDocument as any).metadataVector = metadataVector;
      await manager.save(Document, savedDocument);

      // Then create and save chunks with the document ID
      const chunks: Chunk[] = (dto.chunks || []).map((chunkText, idx) =>
        manager.create(Chunk, {
          documents: [savedDocument],
          chunkIndex: idx,
          chunkText: chunkText,
          tokenCount: chunkText.split(/\s+/).length,
        }),
      );

      const savedChunks = await manager.save(Chunk, chunks);

      // Now update the document with the chunks relationship
      savedDocument.chunks = savedChunks;
      await manager.save(Document, savedDocument);

      // Return a plain object without metadataVector
      return {
        id: savedDocument.id,
        title: savedDocument.title,
        metadata: savedDocument.metadata,
        docDate: savedDocument.docDate,
        extraAttributes: savedDocument.extraAttributes,
        fileRef: savedDocument.fileRef,
        contentHash: savedDocument.contentHash,
        status: savedDocument.status,
        createdAt: savedDocument.createdAt,
        updatedAt: savedDocument.updatedAt,
        chunks: savedDocument.chunks,
      };
    });
  }

  /**
   * Handle document duplication logic
   */
  private async handleDocumentDuplication(
    contentHash: string,
    ownerId: string,
    fileRef: string,
  ): Promise<Document | null> {
    const existingDoc = await this.documentRepository.findOne({
      where: { contentHash },
      relations: ['chunks'],
    });

    if (!existingDoc) {
      return null; // No duplicate, proceed to create new
    }

    // Check if same user
    const userDoc = await this.documentRepository.findByContentHashAndUser(
      contentHash,
      ownerId,
    );
    if (userDoc) {
      // Full duplicate from current user
      throw new BadRequestException('Duplicate file upload');
    } else {
      // Partial duplicate (same content, different name/type) or from another user
      // Assign existing chunks to the current user
      await this.userDocumentRepository.create({
        user: { id: ownerId },
        document: { id: existingDoc.id },
        summary: undefined,
        isFavorite: false,
      });

      return existingDoc;
    }
  }

  /**
   * Extract text from file based on mimetype
   */
  private async extractTextFromFile(
    file: Express.Multer.File,
    filePath: string,
  ): Promise<string> {
    let text = '';

    switch (file.mimetype) {
      case 'application/pdf':
        const pdfData = await new pdfParse.PDFParse(
          new Uint8Array(file.buffer),
        );
        const val = await pdfData.getText();
        text = val.text;
        if (!text.trim()) {
          const ocrResult = await Tesseract.recognize(file.buffer, 'eng');
          text = ocrResult.data.text;
        }
        break;

      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        const docxData = await mammoth.extractRawText({ buffer: file.buffer });
        text = docxData.value;
        break;

      case 'text/plain':
        text = file.buffer.toString('utf-8');
        break;

      case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      case 'application/vnd.ms-powerpoint':
        const { getTextExtractor } = await import('office-text-extractor');
        const textExtractor = getTextExtractor();
        text = await textExtractor.extractText({
          input: filePath,
          type: 'file',
        });
        break;

      default:
        throw new BadRequestException(
          `Unsupported file type: ${file.mimetype}`,
        );
    }

    // Sanitize text by removing null bytes to prevent UTF-8 encoding errors
    text = text.replace(/\x00/g, '');

    if (!text.trim()) {
      throw new BadRequestException('Unable to extract text from file');
    }

    return text;
  }

  /**
   * Upload file -> extract text, attributes and chunks -> createDocument()
   */
  async uploadDocument(
    file: Express.Multer.File,
    dto: DocumentDto,
    ownerId: string,
  ) {
    try {
      // Validate file
      if (!file || !file.buffer || file.buffer.length === 0) {
        throw new BadRequestException('File not retrieved or empty');
      }

      if (!dto.title || dto.title.trim().length === 0) {
        throw new BadRequestException('Document title is required');
      }

      // Generate content hash
      const contentHash = await this.generateContentHash(file.buffer);

      // Handle duplication
      const duplicateDoc = await this.handleDocumentDuplication(
        contentHash,
        ownerId,
        file.originalname,
      );
      if (duplicateDoc) {
        return {
          id: duplicateDoc.id,
          ownerId,
          title: duplicateDoc.title,
          fileName: duplicateDoc.fileRef,
          totalChunks: duplicateDoc.chunks.length,
        };
      }

      // ----- NO DUPLICATE DETECTED: proceed to create new document ---

      // Generate unique filename and save file to server
      const uniqueName = `${crypto.randomUUID()}-${file.originalname}`;
      const filePath = path.join('uploads', uniqueName);

      // Ensure the uploads directory exists
      if (!fs.existsSync('uploads')) {
        fs.mkdirSync('uploads', { recursive: true });
      }

      fs.writeFileSync(filePath, file.buffer);

      // Extract text from file
      const text = await this.extractTextFromFile(file, filePath);

      // Extract attributes using LLM
      const extractedAttributes = await this.extractDocumentAttributes(text);

      // Chunk the text
      const chunks = this.chunkText(text, 1000);

      // Merge extracted attributes with provided dto
      const documentDto: DocumentDto = {
        title: dto.title || file.originalname,
        metadata: { ...extractedAttributes.metadata, ...dto.metadata },
        docDate: dto.docDate || extractedAttributes.docDate,
        extraAttributes: {
          ...extractedAttributes.extraAttributes,
          ...dto.extraAttributes,
        },
        fileRef: filePath, // Store the full path
        fileSize: file.size,
        chunks,
      };

      // Create document with extracted attributes
      const createdDoc = await this.createDocument(
        documentDto,
        contentHash,
      );

      // Determine folderId: if provided, validate it; else use root folder
      let folderId: string | undefined = dto.folderId;
      if (folderId) {
        const folder = await this.folderRepository.findOne({
          where: { id: folderId, ownerId: ownerId },
        });
        if (!folder) {
          throw new BadRequestException('Folder not found or not owned by user');
        }
      } else {
        // Find root folder for the user
        const rootFolder = await this.folderRepository.findOne({
          where: { ownerId: ownerId, parentId: IsNull() },
        });
        if (rootFolder) {
          folderId = rootFolder.id;
        }
      }

      // Create UserDocument relation
      await this.userDocumentRepository.create({
        user: { id: ownerId },
        document: { id: createdDoc.id },
        folder: folderId ? { id: folderId } : undefined,
        summary: undefined,
        documentName: dto.title || file.originalname,
        isFavorite: false,
      });

      return {
        id: createdDoc.id,
        ownerId,
        title: createdDoc.title,
        fileName: createdDoc.fileRef,
        totalChunks: createdDoc.chunks.length,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Upload document failed: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        'Document upload failed due to server error',
      );
    }
  }

  //Helper: chunk text
  private chunkText(text: string, maxLength: number): string[] {
    const result: string[] = [];
    let current = '';
    const words = text.split(/\s+/);

    for (const word of words) {
      if ((current + ' ' + word).length > maxLength) {
        result.push(current.trim());
        current = word;
      } else {
        current += ' ' + word;
      }
    }

    if (current) result.push(current.trim());
    return result;
  }

  // Helper: generate content hash
  private async generateContentHash(buffer: Buffer): Promise<string> {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Extract document attributes using LLM prompt
   */
  private async extractDocumentAttributes(text: string): Promise<{
    metadata: MetadataDto;
    docDate?: Date;
    extraAttributes?: Record<string, any>;
  }> {
    try {
      const result = await this.promptsService.run(
        'document-attribute-extraction',
        {
          vars: { text },
        },
      );

      // Strip markdown code block if present
      let jsonText = result.text.trim();
      const codeBlockMatch = jsonText.match(
        /```(?:json)?\s*(\{[\s\S]*?\})\s*```/,
      );
      if (codeBlockMatch) {
        jsonText = codeBlockMatch[1];
      }

      // Parse the JSON
      const parsed = JSON.parse(jsonText);

      return {
        metadata: {
          topic: parsed.topic,
          field: parsed.field,
          keywords: parsed.keywords || [],
          methodology: parsed.methodology,
        },
        docDate: parsed.docDate ? new Date(parsed.docDate) : undefined,
        extraAttributes: parsed.extraAttributes || {},
      };
    } catch (error) {
      this.logger.warn(
        `Failed to extract attributes via LLM: ${error.message}. Using defaults.`,
      );
      // Fallback to defaults
      return {
        metadata: {},
        docDate: undefined,
        extraAttributes: {},
      };
    }
  }

  // Helper: convert metadata object to text for embedding
  private metadataToText(metadata: Record<string, any>): string {
    const parts: string[] = [];
    if (metadata.topic) parts.push(`Topic: ${metadata.topic}`);
    if (metadata.field) parts.push(`Field: ${metadata.field}`);
    if (metadata.keywords && Array.isArray(metadata.keywords)) {
      parts.push(`Keywords: ${metadata.keywords.join(', ')}`);
    }
    if (metadata.methodology)
      parts.push(`Methodology: ${metadata.methodology}`);
    // Add other keys if present
    for (const [key, value] of Object.entries(metadata)) {
      if (!['topic', 'field', 'keywords', 'methodology'].includes(key)) {
        parts.push(`${key}: ${value}`);
      }
    }
    return parts.join('. ');
  }

  async deleteDocument(
    ownerId: string,
    documentId: string,
  ): Promise<{ message: string }> {
    return this.dataSource.transaction(async (manager) => {
      const documentRepo = manager.getRepository(Document);
      const chunkRepo = manager.getRepository(Chunk);
      const summaryRepo = manager.getRepository(Summary);
      const userDocumentRepo = manager.getRepository(UserDocument);

      // Check if document exists and user has access via userDocument, get summaryId and fileRef
      const userDocument = await userDocumentRepo
        .createQueryBuilder('userDocument')
        .leftJoin('userDocument.document', 'document')
        .leftJoin('userDocument.user', 'user')
        .leftJoin('userDocument.summary', 'summary')
        .select('userDocument.id')
        .addSelect('summary.id', 'summaryId')
        .addSelect('document.file_ref', 'fileRef')
        .where('document.id = :id AND user.id = :ownerId', {
          id: documentId,
          ownerId,
        })
        .getRawOne();

      if (!userDocument) {
        throw new NotFoundException('Document not found or not owned by user');
      }

      const summaryId = userDocument.summaryId;
      const fileRef = userDocument.fileRef;

      // Get chunks separately
      const chunks = await chunkRepo.find({
        where: { documents: { id: documentId } },
        select: ['id'],
      });
      const chunkIds = chunks.map((c) => c.id);

      // Remove only the UserDocument entry for this user and document
      await userDocumentRepo.delete({
        user: { id: ownerId },
        document: { id: documentId },
      });

      // Check if there are any remaining UserDocument entries for this document
      const remainingUserDocs = await userDocumentRepo.count({
        where: { document: { id: documentId } },
      });

      if (remainingUserDocs > 0) {
        // Document is still associated with other users, just remove from this user's library
        return { message: 'Document removed from your library' };
      }

      // No other users have this document, proceed with full deletion

      // Check chunks relation before deleting the document: delete only if no other documents reference them
      const chunksToDelete: string[] = [];
      for (const chunkId of chunkIds) {
        const relatedDocs = await chunkRepo
          .createQueryBuilder('chunk')
          .leftJoin('chunk.documents', 'document')
          .where('chunk.id = :chunkId', { chunkId })
          .getCount();

        if (relatedDocs === 1) {
          // Only this document references the chunk
          chunksToDelete.push(chunkId);
        }
      }

      // Delete document using delete query to avoid loading relations
      await documentRepo.delete({ id: documentId });

      // Delete the chunks that were only referenced by this document
      for (const chunkId of chunksToDelete) {
        await chunkRepo.delete({ id: chunkId });
      }

      // Check summary relation: delete only if no other userDocuments reference it
      if (summaryId) {
        const relatedUserDocs = await userDocumentRepo.count({
          where: { summary: { id: summaryId } },
        });

        if (relatedUserDocs === 0) {
          await summaryRepo.delete({ id: summaryId });
        }
      }

      // Delete the file from filesystem if it exists
      if (fileRef && fs.existsSync(fileRef)) {
        fs.unlinkSync(fileRef);
      }

      return { message: 'Document removed successfully' };
    });
  }

  async toggleFavorite(userId: string, documentId: string) {
    try {
      return await this.userDocumentRepository.toggleFavorite(
        userId,
        documentId,
      );
    } catch (error) {
      this.logger.error(
        `Failed to toggle favorite for user ${userId} and document ${documentId}: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Unable to toggle favorite');
    }
  }

  async getFavorites(userId: string) {
    try {
      const favorites = await this.userDocumentRepository.getFavorites(userId);
      // Exclude metadataVector from each document
      const documents = favorites.map((userDoc) => {
        const { metadataVector, ...docWithoutVector } = userDoc.document;
        return {
          ...docWithoutVector,
          title: userDoc.documentName,
          isFavorite: userDoc.isFavorite,
        };
      });
      return documents;
    } catch (error) {
      this.logger.error(
        `Failed to get favorites for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Unable to retrieve favorites');
    }
  }

  // /**
  //  * Get a single document by ID for the user, returning basic info without file data
  //  */
  // async getDocument(documentId: string, ownerId: string) {
  //   try {
  //     const document = await this.documentRepository.findByIdAndOwner(
  //       documentId,
  //       ownerId,
  //     );

  //     if (!document) {
  //       throw new NotFoundException('Document not found or not owned by user');
  //     }

  //     // Extract name from fileRef (unique server-stored name)
  //     const name = path.basename(document.fileRef);
  //     const mimetype = this.getMimeType(document.fileRef);

  //     return {
  //       message: 'Document retrieved successfully',
  //       document: {
  //         title: document.title,
  //         name,
  //         documentId: document.id,
  //         ownerId: document.ownerId,
  //         ref: document.fileRef,
  //         mimetype,
  //       },
  //     };
  //   } catch (error) {
  //     if (
  //       error instanceof NotFoundException ||
  //       error instanceof BadRequestException
  //     ) {
  //       throw error;
  //     }
  //     this.logger.error(
  //       `Failed to retrieve document ${documentId} for owner ${ownerId}: ${error.message}`,
  //       error.stack,
  //     );
  //     throw new BadRequestException(
  //       'Unable to retrieve document due to server connection issue',
  //     );
  //   }
  // }

  // Helper: get mimetype from file path
  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.pdf':
        return 'application/pdf';
      case '.docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case '.txt':
        return 'text/plain';
      case '.pptx':
        return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      case '.ppt':
        return 'application/vnd.ms-powerpoint';
      default:
        return 'application/octet-stream';
    }
  }

  // Helper: format file size from bytes to human readable format
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get all documents belonging to a specific user with pagination
   */
  async getDocuments(ownerId: string, page: number = 1, limit: number = 5) {
    try {
      const offset = (page - 1) * limit;

      const queryBuilder = this.dataSource
        .createQueryBuilder(UserDocument, 'userDocument')
        .leftJoin('userDocument.document', 'document')
        .leftJoin('userDocument.user', 'user')
        .select([
          'userDocument.id',
          'userDocument.isFavorite',
          'userDocument.documentName',
          'document.id',
          'document.metadata',
          'document.docDate',
          'document.extraAttributes',
          'document.fileRef',
          'document.fileSize',
          'document.contentHash',
          'document.status',
          'document.createdAt',
          'document.updatedAt',
        ])
        .where('user.id = :ownerId', { ownerId })
        .orderBy('document.createdAt', 'DESC')
        .skip(offset)
        .take(limit);

      const [userDocuments, total] = await queryBuilder.getManyAndCount();

      const totalPages = Math.ceil(total / limit);

      // Map to documents, excluding metadataVector
      const documents = userDocuments.map((userDoc) => {
        const { metadataVector, ...docWithoutVector } = userDoc.document;
        return {
          ...docWithoutVector,
          title: userDoc.documentName,
          isFavorite: userDoc.isFavorite,
          formattedFileSize: this.formatFileSize(docWithoutVector.fileSize || 0),
        };
      });

      return {
        total,
        currentPage: page,
        totalPages,
        documents,
      };
    } catch (error) {
      this.logger.error(
        `Failed to retrieve documents for owner ${ownerId}: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        'Unable to retrieve documents due to server connection issue',
      );
    }
  }

  /**
   * Get the file path for a document to serve the file
   */
  async getDocumentFilePath(
    documentId: string,
    ownerId: string,
  ): Promise<string> {
    try {
      const document = await this.documentRepository.findByIdAndOwner(
        documentId,
        ownerId,
      );

      if (!document) {
        throw new NotFoundException('Document not found or not owned by user');
      }

      if (!fs.existsSync(document.fileRef)) {
        throw new BadRequestException('Document file not found on server');
      }

      return document.fileRef;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Failed to retrieve file path for document ${documentId} for owner ${ownerId}: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        'Unable to retrieve document file due to server connection issue',
      );
    }
  }

  /**
   * Search documents by title and metadata similarity using vector search
   */
  async searchDocuments(query: string, ownerId: string, limit: number = 10) {
    try {
      // First, perform title-based search using ILIKE for substring matching
      const titleDocuments = await this.dataSource
        .getRepository(Document)
        .createQueryBuilder('document')
        .leftJoin('document.userDocuments', 'userDocument')
        .leftJoin('userDocument.user', 'user')
        .select([
          'document.id',
          'document.title',
          'document.metadata',
          'document.docDate',
          'document.fileRef',
          'document.status',
          'document.createdAt',
          'document.updatedAt',
          'userDocument.isFavorite',
        ])
        .where('user.id = :ownerId', { ownerId })
        .andWhere('document.title ILIKE :query', { query: `%${query}%` })
        .orderBy('document.createdAt', 'DESC')
        .limit(limit ?? 10)
        .getMany();

      // Check if query is empty or whitespace-only, skip vector search if so
      if (!query || query.trim().length === 0) {
        return {
          relatedTitleDocuments: titleDocuments,
          relatedContentDocuments: [],
        };
      }

      // Generate embedding for the search query for vector search
      let queryVector: number[] | null = null;
      try {
        queryVector = await this.openAIService.createEmbedding(query);
      } catch (error) {
        const errorMessage =
          error?.message || error?.toString() || 'Unknown error';
        if (errorMessage.includes('429') || errorMessage.includes('quota')) {
          this.logger.warn(
            `OpenAI quota exceeded for search query: ${errorMessage}. Returning title results only.`,
          );
          return {
            relatedTitleDocuments: titleDocuments,
            relatedContentDocuments: [],
          };
        } else {
          throw error;
        }
      }

      // Perform vector similarity search using pgvector, excluding documents already in titleDocuments
      const titleIds = titleDocuments.map(doc => doc.id);
      const vectorQueryBuilder = this.dataSource
        .getRepository(Document)
        .createQueryBuilder('document')
        .leftJoin('document.userDocuments', 'userDocument')
        .leftJoin('userDocument.user', 'user')
        .select([
          'document.id',
          'document.title',
          'document.metadata',
          'document.docDate',
          'document.fileRef',
          'document.status',
          'document.createdAt',
          'document.updatedAt',
          'userDocument.isFavorite',
        ])
        .where('user.id = :ownerId', { ownerId })
        .andWhere('document.metadata_vector IS NOT NULL');

      if (titleIds.length > 0) {
        vectorQueryBuilder.andWhere('document.id NOT IN (:...titleIds)', { titleIds });
      }

      const vectorDocuments = await vectorQueryBuilder
        .orderBy('document.metadata_vector <=> :queryVector', 'ASC')
        .setParameters({ queryVector: `[${queryVector.join(',')}]` })
        .limit(limit ?? 10)
        .getMany();

      return {
        relatedTitleDocuments: titleDocuments,
        relatedContentDocuments: vectorDocuments,
      };
    } catch (error) {
      this.logger.error(
        `Failed to search documents for owner ${ownerId}: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Unable to search documents');
    }
  }

  /**
   * Get related documents based on vector similarity, excluding the current document
   */
  async getRelatedDocuments(
    documentId: string,
    ownerId: string,
    limit: number = 10,
  ) {
    try {
      // Get the current document to use its metadata vector
      const currentDocument = await this.dataSource
        .getRepository(Document)
        .findOne({
          where: { id: documentId },
          select: ['metadataVector'],
        });

      if (!currentDocument) {
        throw new NotFoundException('Document not found or not owned by user');
      }

      if (!currentDocument.metadataVector) {
        this.logger.warn(
          `Document ${documentId} has no metadata vector. Returning empty results.`,
        );
        return {
          total: 0,
          documents: [],
        };
      }

      // Perform vector similarity search using pgvector, excluding the current document
      const documents = await this.dataSource
        .getRepository(Document)
        .createQueryBuilder('document')
        .leftJoin('document.userDocuments', 'userDocument')
        .leftJoin('userDocument.user', 'user')
        .select([
          'document.id',
          'document.title',
          'document.metadata',
          'document.docDate',
          'document.fileRef',
          'document.status',
          'document.createdAt',
          'document.updatedAt',
        ])
        .where('user.id = :ownerId', { ownerId })
        .andWhere('document.id != :documentId', { documentId })
        .andWhere('document.metadata_vector IS NOT NULL')
        .orderBy('document.metadata_vector <=> :queryVector', 'ASC')
        .setParameters({
          queryVector: `[${currentDocument.metadataVector.join(',')}]`,
        })
        .limit(limit)
        .getMany();

      return {
        total: documents.length,
        documents,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to get related documents for document ${documentId} and owner ${ownerId}: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Unable to get related documents');
    }
  }

  /**
   * Update document name for a user document
   */
  async updateDocumentName(
    userId: string,
    documentId: string,
    newDocumentName: string,
  ): Promise<{ message: string }> {
    try {
      const userDocument = await this.userDocumentRepository.findOne({
        where: {
          user: { id: userId },
          document: { id: documentId },
        },
        relations: ['document']
      });

      if (!userDocument) {
        throw new NotFoundException('Document not found or not owned by user');
      }

      const document = userDocument.document;
      if (!document) {
        throw new NotFoundException('Document not found or not owned by user');
      }

      await this.userDocumentRepository.update(userDocument.id, {
        documentName: newDocumentName,
      });

      return { message: 'Document name updated successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to update document name for user ${userId} and document ${documentId}: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Unable to update document name');
    }
  }
}
