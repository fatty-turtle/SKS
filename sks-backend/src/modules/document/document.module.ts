import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/common/common.module';
import { PromptsModule } from 'src/modules/prompts/prompts.module';

import { Document } from 'src/database/entities/document.entity';
import { Chunk } from 'src/database/entities/chunks.entity';
import { Summary } from 'src/database/entities/summary.entity';

import { DocumentRepository } from 'src/database/repositories/document.repository';
import { ChunkRepository } from 'src/database/repositories/chunks.repository';
import { SummaryRepository } from 'src/database/repositories/summary.repository';

import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { UserRepository } from 'src/database/repositories/user.repository';
import { SummaryService } from '../summary/summary.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document, Chunk, Summary]),
    CommonModule,
    PromptsModule,
  ],
  controllers: [DocumentController],
  providers: [
    DocumentService,
    DocumentRepository,
    ChunkRepository,
    SummaryRepository,
    UserRepository,
    SummaryService,
  ],
  exports: [DocumentService],
})
export class DocumentModule {}
