import { Module } from '@nestjs/common';
import { OpenAIService } from './llm/openai.service';

@Module({
  providers: [OpenAIService],
  exports: [OpenAIService],
})
export class CommonModule {}
