import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsUUID } from 'class-validator';

export class RunPromptDto {
  @ApiProperty({
    // CHÍNH SỬA Ở ĐÂY: thêm additionalProperties để thỏa schema của swagger
    type: 'object',
    additionalProperties: true,
    description: 'Biến đầu vào để render template',
    example: { text: 'Lorem ipsum...' },
  })
  @IsObject({ message: 'vars must be an object' })
  vars: Record<string, any>;

  @ApiPropertyOptional({
    description: 'UUID để group/correlation (tùy chọn)',
    example: '9a9a7b7b-5f6f-4c4c-8a8a-1b1b2c2c3d3d',
  })
  @IsOptional()
  @IsUUID('4', { message: 'summaryId must be a UUID v4' })
  summaryId?: string;

  @ApiPropertyOptional({
    description: 'Version cụ thể của prompt (UUID). Nếu bỏ trống sẽ dùng active version',
    example: '0421338b-fe2e-4dcc-aa89-f544288c5b8a',
  })
  @IsOptional()
  @IsUUID('4', { message: 'versionId must be a UUID v4' })
  versionId?: string;
}
