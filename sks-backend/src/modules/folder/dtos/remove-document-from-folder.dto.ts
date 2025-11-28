import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RemoveDocumentFromFolderDto {
  @ApiProperty({
    description: 'The ID of the folder',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  folderId: string;

  @ApiProperty({
    description: 'The ID of the document to remove',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  documentId: string;
}
