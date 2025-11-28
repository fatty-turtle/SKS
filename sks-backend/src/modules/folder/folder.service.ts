import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { CreateFolderDto } from './dtos/create-folder.dto';
import { UpdateFolderDto } from './dtos/update-folder.dto';
import { MoveFolderDto } from './dtos/move-folder.dto';
import { DeleteFolderDto, DeleteFolderOption } from './dtos/delete-folder.dto';
import { Folder } from 'src/database/entities/folder.entity';
import { FolderRepository } from 'src/database/repositories/folder.repository';
import { DocumentRepository } from 'src/database/repositories/document.repository';
import { UserDocumentRepository } from 'src/database/repositories/user-document.repository';
import { Document } from 'src/database/entities/document.entity';

@Injectable()
export class FolderService {
  private readonly logger = new Logger(FolderService.name);

  constructor(
    private readonly folderRepository: FolderRepository,
    private readonly documentRepository: DocumentRepository,
    private readonly userDocumentRepository: UserDocumentRepository,
  ) {}

  /**
   * Get all folders belonging to a specific user in a tree structure
   */
  async getFolders(ownerId: string) {
    const allFolders = await this.folderRepository.findByOwner(ownerId);

    // Create a map for quick lookup
    const folderMap = new Map<string, Folder>();
    allFolders.forEach((folder) => folderMap.set(folder.id, folder));

    // Find root folders (no parent)
    const rootFolders = allFolders.filter((folder) => !folder.parentId);

    // Build tree for each root
    const folderTrees = rootFolders.map((root) =>
      this.buildFolderTree(root, folderMap),
    );

    return {
      total: folderTrees.length,
      folders: folderTrees,
    };
  }

  /**
   * Get root folders (no parent) for a user
   */
  async getRootFolders(ownerId: string) {
    const folders = await this.folderRepository.findRootFolders(ownerId);
    return {
      total: folders.length,
      folders,
    };
  }

  /**
   * Get folder with full tree structure
   */
  async getFolderTree(folderId: string, ownerId: string) {
    const folder = await this.folderRepository.findWithTree(folderId);
    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    // Check if user owns this folder via users relation
    const userFolder = await this.folderRepository
      .getRepository()
      .createQueryBuilder('folder')
      .leftJoin('folder.users', 'user')
      .where('folder.id = :folderId AND user.id = :ownerId', {
        folderId,
        ownerId,
      })
      .getOne();

    if (!userFolder) {
      throw new NotFoundException('Folder not found');
    }

    return folder;
  }

  /**
   * Get folder by ID
   */
  async getFolderById(folderId: string, ownerId: string): Promise<Folder> {
    // Check if folder exists and user owns it via users relation
    const folder = await this.folderRepository
      .getRepository()
      .createQueryBuilder('folder')
      .leftJoin('folder.users', 'user')
      .where('folder.id = :folderId AND user.id = :ownerId', {
        folderId,
        ownerId,
      })
      .getOne();

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    return folder;
  }

  /**
   * Create a new folder
   */
  async createFolder(dto: CreateFolderDto, ownerId: string): Promise<Folder> {
    let parentId = dto.parentId;

    if (!parentId) {
      const rootFolders = await this.folderRepository.findRootFolders(ownerId);
      if (rootFolders.length === 0) {
        throw new BadRequestException('No root folder found for user');
      }
      parentId = rootFolders[0].id;
    } else {
      // Check if parent folder exists and user owns it via users relation
      const parentFolder = await this.folderRepository
        .getRepository()
        .createQueryBuilder('folder')
        .leftJoin('folder.users', 'user')
        .where('folder.id = :parentId AND user.id = :ownerId', {
          parentId,
          ownerId,
        })
        .getOne();

      if (!parentFolder) {
        throw new BadRequestException('Invalid parent folder');
      }
    }

    // Check if a folder with the same name already exists in the same parent folder for this user
    const existingFolder = await this.folderRepository.findOne({
      where: { name: dto.name, ownerId, parentId },
    });

    if (existingFolder) {
      throw new BadRequestException('A folder with this name already exists in this location');
    }

    const folder = await this.folderRepository.create({
      ownerId,
      name: dto.name,
      parentId,
      users: [{ id: ownerId }],
    });

    return folder;
  }

  /**
   * Update folder
   */
  async updateFolder(dto: UpdateFolderDto, ownerId: string): Promise<Folder> {
    // Check if folder exists and user owns it via users relation
    const folder = await this.folderRepository
      .getRepository()
      .createQueryBuilder('folder')
      .leftJoin('folder.users', 'user')
      .where('folder.id = :folderId AND user.id = :ownerId', {
        folderId: dto.folderId,
        ownerId,
      })
      .getOne();

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    // Validate parent folder if provided
    if (dto.parentId) {
      const parentFolder = await this.folderRepository
        .getRepository()
        .createQueryBuilder('folder')
        .leftJoin('folder.users', 'user')
        .where('folder.id = :parentId AND user.id = :ownerId', {
          parentId: dto.parentId,
          ownerId,
        })
        .getOne();

      if (!parentFolder) {
        throw new BadRequestException('Invalid parent folder');
      }

      // Prevent circular reference
      if (dto.parentId === dto.folderId) {
        throw new BadRequestException('Cannot set folder as its own parent');
      }
    }

    const updatedFolder = await this.folderRepository.update(dto.folderId, {
      name: dto.name,
      parentId: dto.parentId,
    });

    if (!updatedFolder) {
      throw new NotFoundException('Folder not found');
    }

    return updatedFolder;
  }

  /**
   * Move folder to new parent
   */
  async moveFolder(dto: MoveFolderDto, ownerId: string): Promise<Folder> {
    // Check if folder exists and user owns it via users relation
    const folder = await this.folderRepository
      .getRepository()
      .createQueryBuilder('folder')
      .leftJoin('folder.users', 'user')
      .where('folder.id = :folderId AND user.id = :ownerId', {
        folderId: dto.folderId,
        ownerId,
      })
      .getOne();

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    // Prevent moving root folder
    if (!folder.parentId) {
      throw new BadRequestException('Cannot move root folder');
    }

    // Validate new parent folder if provided
    if (dto.newParentId) {
      const newParentFolder = await this.folderRepository
        .getRepository()
        .createQueryBuilder('folder')
        .leftJoin('folder.users', 'user')
        .where('folder.id = :newParentId AND user.id = :ownerId', {
          newParentId: dto.newParentId,
          ownerId,
        })
        .getOne();

      if (!newParentFolder) {
        throw new BadRequestException('Invalid parent folder');
      }

      // Prevent circular reference
      if (dto.newParentId === dto.folderId) {
        throw new BadRequestException('Cannot move folder into itself');
      }

      // Check if newParentId is a descendant of the folder being moved
      const isDescendant = await this.isInSubtree(dto.folderId, dto.newParentId);
      if (isDescendant) {
        throw new BadRequestException('Cannot move folder into one of its descendants');
      }
    }

    const updatedFolder = await this.folderRepository.update(dto.folderId, {
      parentId: dto.newParentId || undefined,
    });

    if (!updatedFolder) {
      throw new NotFoundException('Folder not found');
    }

    return updatedFolder;
  }

  /**
   * Delete folder
   */
  async deleteFolder(
    ownerId: string,
    dto: DeleteFolderDto,
  ): Promise<{ message: string }> {
    // Check if folder exists and user owns it via users relation
    const folder = await this.folderRepository
      .getRepository()
      .createQueryBuilder('folder')
      .leftJoin('folder.users', 'user')
      .leftJoinAndSelect('folder.children', 'children')
      .where('folder.id = :folderId AND user.id = :ownerId', {
        folderId: dto.folderId,
        ownerId,
      })
      .getOne();

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    if (!folder.parentId) {
      throw new BadRequestException('Cannot delete root folder');
    }

    if (dto.option === DeleteFolderOption.DELETE_WITH_DOCS) {
      const allDocuments = await this.getAllDocumentsInFolder(
        dto.folderId,
        ownerId,
      );
      for (const doc of allDocuments) {
        await this.documentRepository.delete(doc.id);
      }

      // Delete the folder and all its children
      await this.deleteFolderRecursively(dto.folderId);
    } else {
      const documentsInFolder = await this.getDocumentsInFolder(
        dto.folderId,
        ownerId,
      );
      if (documentsInFolder.length > 0) {
        const parentId = folder.parentId;
        for (const doc of documentsInFolder) {
          await this.userDocumentRepository
            .getRepository()
            .update(
              { document: { id: doc.id }, user: { id: ownerId } },
              { folder: { id: parentId } },
            );
        }
      }

      // Move children to parent folder
      if (folder.children.length > 0) {
        const parentId = folder.parentId;
        for (const child of folder.children) {
          await this.folderRepository.update(child.id, { parentId });
        }
      }

      // Delete the folder
      const deleted = await this.folderRepository.delete(dto.folderId);
      if (!deleted) {
        throw new NotFoundException('Folder not found');
      }
    }

    return { message: 'Folder deleted successfully' };
  }

  /**
   * Helper: Get documents directly in a folder that the user owns
   */
  private async getDocumentsInFolder(
    folderId: string,
    ownerId: string,
  ): Promise<Document[]> {
    // Query documents owned by the user in the specified folder via userDocument
    const userDocuments = await this.userDocumentRepository
      .getRepository()
      .createQueryBuilder('userDocument')
      .leftJoinAndSelect('userDocument.document', 'document')
      .leftJoin('userDocument.user', 'user')
      .leftJoin('userDocument.folder', 'folder')
      .where('user.id = :ownerId AND folder.id = :folderId', {
        ownerId,
        folderId,
      })
      .getMany();

    return userDocuments.map((ud) => ud.document);
  }

  /**
   * Helper: Get all documents in a folder and its subfolders that the user owns
   */
  private async getAllDocumentsInFolder(
    folderId: string,
    ownerId: string,
  ): Promise<Document[]> {
    // Query documents owned by the user in the specified folder and its subfolders via userDocument
    const userDocuments = await this.userDocumentRepository
      .getRepository()
      .createQueryBuilder('userDocument')
      .leftJoinAndSelect('userDocument.document', 'document')
      .leftJoin('userDocument.user', 'user')
      .leftJoin('userDocument.folder', 'folder')
      .where('user.id = :ownerId', { ownerId })
      .andWhere(
        '(folder.id = :folderId OR folder.parentId = :folderId OR folder.parent.parentId = :folderId OR folder.parent.parent.parentId = :folderId)',
        { folderId },
      )
      .getMany();

    return userDocuments.map((ud) => ud.document);
  }

  /**
   * Helper: Delete folder and all its children recursively
   */
  private async deleteFolderRecursively(folderId: string): Promise<void> {
    const folder = await this.folderRepository.findWithTree(folderId);
    if (!folder) {
      return;
    }

    // Delete children first
    for (const child of folder.children) {
      await this.deleteFolderRecursively(child.id);
    }

    // Delete the folder
    await this.folderRepository.delete(folderId);
  }

  /**
   * Helper: Check if a folder ID is in the subtree of another folder
   */
  private async isInSubtree(parentId: string, childId: string): Promise<boolean> {
    const folder = await this.folderRepository.findWithTree(parentId);
    if (!folder) {
      return false;
    }

    // Check direct children
    if (folder.children.some(child => child.id === childId)) {
      return true;
    }

    // Recursively check deeper levels
    for (const child of folder.children) {
      if (await this.isInSubtree(child.id, childId)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Add document to folder
   */
  async addDocumentToFolder(
    folderId: string,
    documentId: string,
    ownerId: string,
  ): Promise<{ message: string }> {
    // Check if folder exists and user owns it via users relation
    const folder = await this.folderRepository
      .getRepository()
      .createQueryBuilder('folder')
      .leftJoin('folder.users', 'user')
      .where('folder.id = :folderId AND user.id = :ownerId', {
        folderId,
        ownerId,
      })
      .getOne();

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    // Check if document exists and user owns it via userDocuments relation
    const document = await this.documentRepository
      .getRepository()
      .createQueryBuilder('document')
      .leftJoin('document.userDocuments', 'userDocument')
      .leftJoin('userDocument.user', 'user')
      .where('document.id = :documentId AND user.id = :ownerId', {
        documentId,
        ownerId,
      })
      .getOne();

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Check if document is already in this folder via userDocument
    const userDocument = await this.userDocumentRepository
      .getRepository()
      .findOne({
        where: { document: { id: documentId }, user: { id: ownerId } },
      });

    if (userDocument?.folder?.id === folderId) {
      throw new BadRequestException('Document is already in this folder');
    }

    await this.userDocumentRepository
      .getRepository()
      .update(
        { document: { id: documentId }, user: { id: ownerId } },
        { folder: { id: folderId } },
      );

    return { message: 'Document added to folder successfully' };
  }

  /**
   * Remove document from folder
   */
  async removeDocumentFromFolder(
    folderId: string,
    documentId: string,
    ownerId: string,
  ): Promise<{ message: string }> {
    // Check if folder exists and user owns it via users relation
    const folder = await this.folderRepository
      .getRepository()
      .createQueryBuilder('folder')
      .leftJoin('folder.users', 'user')
      .where('folder.id = :folderId AND user.id = :ownerId', {
        folderId,
        ownerId,
      })
      .getOne();

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    // Check if document exists, user owns it, and it's in the specified folder via userDocument.folder
    const document = await this.documentRepository
      .getRepository()
      .createQueryBuilder('document')
      .leftJoin('document.userDocuments', 'userDocument')
      .leftJoin('userDocument.user', 'user')
      .leftJoin('userDocument.folder', 'folder')
      .where(
        'document.id = :documentId AND user.id = :ownerId AND folder.id = :folderId',
        { documentId, ownerId, folderId },
      )
      .getOne();

    if (!document) {
      throw new NotFoundException('Document not found in this folder');
    }

    await this.userDocumentRepository
      .getRepository()
      .update(
        { document: { id: documentId }, user: { id: ownerId } },
        { folder: undefined },
      );

    return { message: 'Document removed from folder successfully' };
  }

  /**
   * Get documents in a folder with pagination
   */
  async getDocumentsByFolder(
    folderId: string,
    ownerId: string,
    page: number = 1,
    limit: number = 5,
  ) {
    // Check if folder exists and user owns it via users relation
    const folder = await this.folderRepository
      .getRepository()
      .createQueryBuilder('folder')
      .leftJoin('folder.users', 'user')
      .where('folder.id = :folderId AND user.id = :ownerId', {
        folderId,
        ownerId,
      })
      .getOne();

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    const offset = (page - 1) * limit;

    // Query documents in the folder via userDocument
    const queryBuilder = this.userDocumentRepository
      .getRepository()
      .createQueryBuilder('userDocument')
      .leftJoinAndSelect('userDocument.document', 'document')
      .leftJoin('userDocument.user', 'user')
      .leftJoin('userDocument.folder', 'folder')
      .where('user.id = :ownerId AND folder.id = :folderId', {
        ownerId,
        folderId,
      })
      .orderBy('document.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    const [userDocuments, total] = await queryBuilder.getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    // Map to documents with documentName replacing title, excluding metadataVector
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
  }

  /**
   * Helper: Build folder tree recursively
   */
  private buildFolderTree(
    folder: Folder,
    folderMap: Map<string, Folder>,
  ): Folder {
    const children = Array.from(folderMap.values()).filter(
      (f) => f.parentId === folder.id,
    );
    folder.children = children.map((child) =>
      this.buildFolderTree(child, folderMap),
    );
    return folder;
  }

  /**
   * Helper: Format file size
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
