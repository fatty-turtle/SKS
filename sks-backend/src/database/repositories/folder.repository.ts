import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseRepository } from './base.repository';
import { Folder } from '../entities/folder.entity';

@Injectable()
export class FolderRepository extends BaseRepository<Folder> {
  constructor(private readonly ds: DataSource) {
    super(ds, Folder);
  }

  // Find folders by owner
  async findByOwner(ownerId: string): Promise<Folder[]> {
    return this.repository.find({
      where: { ownerId },
      relations: ['children', 'userDocuments'],
    });
  }

  // Find root folders (no parent)
  async findRootFolders(ownerId: string): Promise<Folder[]> {
    return this.repository
      .find({
        where: { ownerId },
        relations: ['children', 'userDocuments'],
      })
      .then((folders) => folders.filter((folder) => !folder.parentId));
  }

  // Find folder with full tree
  async findWithTree(folderId: string): Promise<Folder | null> {
    return this.repository.findOne({
      where: { id: folderId },
      relations: ['parent', 'children', 'userDocuments'],
    });
  }
}
