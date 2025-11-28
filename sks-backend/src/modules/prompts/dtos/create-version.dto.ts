import { IsArray, IsBoolean, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateVersionDto {
  @IsString() model: string;
  @IsOptional() @IsNumber() temperature?: number;
  @IsOptional() @IsNumber() top_p?: number;
  @IsOptional() @IsInt() max_tokens?: number;
  @IsOptional() @IsArray() stop_sequences?: string[];
  @IsOptional() @IsString() system_template?: string;
  @IsOptional() @IsString() user_template?: string;
  @IsOptional() input_schema?: any;
  @IsOptional() metadata?: any;
  @IsOptional() @IsBoolean() activate?: boolean;
}
