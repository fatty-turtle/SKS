import { Module } from '@nestjs/common';
import { SummaryController } from './summary.controller';
import { SummaryService } from './summary.service';
import { DatabaseModule } from '../../database/database.module';
import { PromptsModule } from '../prompts/prompts.module';
import { CommonModule } from '../../common/common.module';
import { SummaryRepository } from 'src/database/repositories/summary.repository';
import { ChunkRepository } from 'src/database/repositories/chunks.repository';
import { PromptsService } from '../prompts/prompts.service';
import { DocumentRepository } from 'src/database/repositories/document.repository';
import { UserDocumentRepository } from 'src/database/repositories/user-document.repository';

@Module({
  imports: [DatabaseModule, PromptsModule, CommonModule],
  controllers: [SummaryController],
  providers: [
    SummaryService,
    SummaryRepository,
    ChunkRepository,
    PromptsService,
    DocumentRepository,
    UserDocumentRepository,
  ],
})
export class SummaryModule {}
