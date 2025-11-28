import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Folder } from 'src/database/entities/folder.entity';
import { Document } from 'src/database/entities/document.entity';
import { User } from 'src/database/entities/user.entity';

import { FolderRepository } from 'src/database/repositories/folder.repository';
import { DocumentRepository } from 'src/database/repositories/document.repository';
import { UserRepository } from 'src/database/repositories/user.repository';

import { FolderService } from './folder.service';
import { FolderController } from './folder.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Folder, Document, User])],
  controllers: [FolderController],
  providers: [
    FolderService,
    FolderRepository,
    DocumentRepository,
    UserRepository,
  ],
  exports: [FolderService],
})
export class FolderModule {}
