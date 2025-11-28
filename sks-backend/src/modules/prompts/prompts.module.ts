import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Prompt, PromptRun, PromptVersion } from 'src/database/entities/prompts.entities';;
import { PromptsService } from './prompts.service';
import { PromptsController } from './prompts.controller';
import { OpenAIService } from '../../common/llm/openai.service';

@Module({
  imports: [TypeOrmModule.forFeature([Prompt, PromptVersion, PromptRun])],
  controllers: [PromptsController],
  providers: [PromptsService, OpenAIService],
  exports: [PromptsService],
})
export class PromptsModule {}
