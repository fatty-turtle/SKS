import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateDocumentNameDto {
  @ApiProperty({
    description: 'The new name for the document',
    example: 'Updated Document Name',
  })
  @IsString()
  @IsNotEmpty()
  newDocumentName: string;
}
