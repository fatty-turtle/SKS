import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export enum DeleteFolderOption {
  DELETE_WITH_DOCS = 'delete_with_docs',
  DELETE_FOLDER_ONLY = 'delete_folder_only',
}

export class DeleteFolderDto {
  @IsUUID()
  folderId: string;

  @IsEnum(DeleteFolderOption)
  @IsOptional()
  option?: DeleteFolderOption = DeleteFolderOption.DELETE_FOLDER_ONLY;
}
