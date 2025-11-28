import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateFolderDto {
  @IsUUID()
  folderId: string;
  
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}
