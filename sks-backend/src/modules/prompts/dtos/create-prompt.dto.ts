import { IsOptional, IsString } from 'class-validator';

export class CreatePromptDto {
  @IsString() key: string;
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
}
