import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthenticationModule } from './modules/authentication/authentication.module';
import { DocumentModule } from './modules/document/document.module';
import { SummaryModule } from './modules/summary/summary.module';
import { AdminModule } from './modules/admin/admin.module';
import { PromptsModule } from './modules/prompts/prompts.module';
import { FolderModule } from './modules/folder/folder.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    DatabaseModule,
    AuthenticationModule,
    DocumentModule,
    SummaryModule,
    AdminModule,
    PromptsModule,
    FolderModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
