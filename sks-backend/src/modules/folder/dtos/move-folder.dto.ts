import { IsUUID, IsOptional } from 'class-validator';

export class MoveFolderDto {
  @IsUUID()
  folderId: string;

  @IsOptional()
  @IsUUID()
  newParentId?: string;
}
