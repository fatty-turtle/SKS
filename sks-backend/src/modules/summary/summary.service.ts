import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { SummaryRepository } from '../../database/repositories/summary.repository';
import { ChunkRepository } from '../../database/repositories/chunks.repository';
import { Summary } from 'src/database/entities/summary.entity';
import { UserDocument } from 'src/database/entities/user-document.entity';
import { PromptsService } from '../prompts/prompts.service';
import { RunPromptDto } from '../prompts/dtos/run.dto';
import { DocumentRepository } from '../../database/repositories/document.repository';
import { UserDocumentRepository } from '../../database/repositories/user-document.repository';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { OpenAIService } from '../../common/llm/openai.service';

@Injectable()
export class SummaryService {
  private readonly logger = new Logger(SummaryService.name);

  constructor(
    private readonly summaryRepository: SummaryRepository,
    private readonly chunkRepository: ChunkRepository,
    private readonly promptsService: PromptsService,
    private readonly documentRepository: DocumentRepository,
    private readonly userDocumentRepository: UserDocumentRepository,
    private readonly dataSource: DataSource,
    private readonly openAIService: OpenAIService,
  ) {}

  async getSummary(documentId: string, userId: string) {
    const summary = await this.summaryRepository.findByDocumentAndUser(
      documentId,
      userId,
    );
    if (!summary) {
      throw new NotFoundException(
        `Summary for document ${documentId} not found`,
      );
    }
    return summary;
  }

  async createSummary(documentId: string, ownerId: string): Promise<Summary> {
    // Check if document exists
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
    });
    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found`);
    }

    // Check if user has access to the document via UserDocument
    const userDocument = await this.userDocumentRepository.findOne({
      where: { user: { id: ownerId }, document: { id: documentId } },
      relations: ['user', 'document', 'summary'],
    });
    if (!userDocument) {
      throw new BadRequestException(
        `User ${ownerId} does not have access to document ${documentId}`,
      );
    }

    // Check if summary already exists
    if (userDocument.summary) {
      throw new BadRequestException(
        `Summary already exists for document ${documentId}. Use refresh instead.`,
      );
    }

    // Retrieve chunks for the document
    const chunks = await this.chunkRepository.findByDocument(documentId);
    if (chunks.length === 0) {
      throw new BadRequestException(
        `No chunks found for document ${documentId}`,
      );
    }

    // Concatenate chunk texts
    const fullText = chunks
      .sort((a, b) => a.chunkIndex - b.chunkIndex)
      .map((chunk) => chunk.chunkText)
      .join(' ');

    // Generate summary using PromptsService
    const summaryText = await this.generateSummaryWithPrompt(fullText, ownerId);

    // Save the new summary
    const summary = await this.summaryRepository.create({
      summaryText,
      createdBy: ownerId,
      summaryModel: 'gpt-4o-mini',
    });

    // Update UserDocument to link the summary
    userDocument.summary = summary;
    await this.userDocumentRepository.update(userDocument.id, userDocument);

    // this.logger.log(
    //   `Summary created for document ${documentId} by user ${ownerId}`,
    // );
    return summary;
  }

  async refreshSummary(documentId: string, ownerId: string): Promise<Summary> {
    // Check if document exists
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
    });
    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found`);
    }

    // Check if user has access to the document via UserDocument
    const userDocument = await this.userDocumentRepository.findOne({
      where: { user: { id: ownerId }, document: { id: documentId } },
      relations: ['user', 'document', 'summary'],
    });
    if (!userDocument) {
      throw new BadRequestException(
        `User ${ownerId} does not have access to document ${documentId}`,
      );
    }

    // Check if summary exists
    if (!userDocument.summary) {
      throw new BadRequestException(
        `No existing summary found for document ${documentId}. Use create instead.`,
      );
    }

    // Retrieve chunks for the document
    const chunks = await this.chunkRepository.findByDocument(documentId);
    if (chunks.length === 0) {
      throw new BadRequestException(
        `No chunks found for document ${documentId}`,
      );
    }

    // Concatenate chunk texts
    const fullText = chunks
      .sort((a, b) => a.chunkIndex - b.chunkIndex)
      .map((chunk) => chunk.chunkText)
      .join(' ');

    // Generate new summary using PromptsService
    const newSummaryText = await this.generateSummaryWithPrompt(
      fullText,
      ownerId,
    );

    // Update the existing summary
    const updatedSummary = await this.summaryRepository.update(
      userDocument.summary.id,
      {
        summaryText: newSummaryText,
        summaryModel: 'gpt-4o-mini',
      },
    );

    if (!updatedSummary) {
      throw new BadRequestException(
        `Failed to update summary for document ${documentId}`,
      );
    }

    this.logger.log(
      `Summary refreshed for document ${documentId} by user ${ownerId}`,
    );
    return updatedSummary;
  }

  async deleteSummary(documentId: string, userId: string) {
    // Check if user has access to the document via UserDocument
    const userDocument = await this.userDocumentRepository.findOne({
      where: { user: { id: userId }, document: { id: documentId } },
      relations: ['summary'],
    });
    if (!userDocument) {
      throw new BadRequestException(
        `User ${userId} does not have access to document ${documentId}`,
      );
    }

    // Check if summary exists for this user-document pair
    if (!userDocument.summary) {
      throw new NotFoundException(
        `No summary found for document ${documentId} and user ${userId}`,
      );
    }

    // Get the summary ID before nullifying
    const summaryId = userDocument.summary.id;

    // Remove the summary relation from the UserDocument
    await this.userDocumentRepository.update(userDocument.id, {
      summary: null as any,
    });

    // Delete the summary from the summary table
    await this.summaryRepository.delete(summaryId);
    return {
      message: `Summary of document ${documentId} created by user ${userId} removed successfully`,
    };
  }

  async generateDiagram(documentId: string, userId: string): Promise<string[]> {
    // Check if user has access to the document via UserDocument
    const userDocument = await this.userDocumentRepository.findOne({
      where: { user: { id: userId }, document: { id: documentId } },
      relations: ['user', 'document', 'summary'],
    });
    if (!userDocument) {
      throw new BadRequestException(
        `User ${userId} does not have access to document ${documentId}`,
      );
    }

    // Check if summary exists
    if (!userDocument.summary) {
      throw new BadRequestException(
        `No summary found for document ${documentId}. Create a summary first.`,
      );
    }

    let diagramLines: string[];

    // Check if diagram already exists
    if (userDocument.summary.diagram) {
      diagramLines = userDocument.summary.diagram;
    } else {
      // Generate diagram using the summary.to.diagram prompt
      const diagramCode = await this.generateDiagramWithPrompt(
        userDocument.summary.summaryText,
        userId,
      );

      // Format the diagram code: remove empty lines but preserve indentation, return as array
      diagramLines = diagramCode.split('\n').filter(line => line.trim().length > 0);

      // Save the diagram to the summary
      await this.summaryRepository.update(userDocument.summary.id, {
        diagram: diagramLines,
      });
    }

    return diagramLines;
  }

  private async generateSummaryWithPrompt(
    text: string,
    userId: string,
  ): Promise<string> {
    // Use the general summary prompt
    const promptKey = 'doc.summarize.general';
    const dto: RunPromptDto = {
      vars: { text },
      versionId: undefined, // Use active version
    };
    const result = await this.promptsService.run(promptKey, dto, userId);
    return result.text;
  }

  private async generateDiagramWithPrompt(
    summaryText: string,
    userId: string,
  ): Promise<string> {
    // Use the summary to diagram prompt
    const promptKey = 'summary.to.diagram';
    const dto: RunPromptDto = {
      vars: { text: summaryText },
      versionId: undefined, // Use active version
    };
    const result = await this.promptsService.run(promptKey, dto, userId);
    return result.text;
  }
}
