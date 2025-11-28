import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
  Put,
  Delete,
  HttpCode,
  HttpStatus,
  Logger,
  Request,
  Query,
} from '@nestjs/common';
import { FolderService } from './folder.service';
import { CreateFolderDto } from './dtos/create-folder.dto';
import { UpdateFolderDto } from './dtos/update-folder.dto';
import { MoveFolderDto } from './dtos/move-folder.dto';
import { DeleteFolderDto, DeleteFolderOption } from './dtos/delete-folder.dto';
import { AddDocumentToFolderDto } from './dtos/add-document-to-folder.dto';
import { RemoveDocumentFromFolderDto } from './dtos/remove-document-from-folder.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../authentication/jwt/jwt-auth.guard';

@Controller('folders')
export class FolderController {
  private readonly logger = new Logger(FolderController.name);

  constructor(private readonly folderService: FolderService) {}

  // --- Get all folders for logged-in user ---
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all folders for logged-in user' })
  @ApiResponse({ status: 200, description: 'Folders fetched successfully!' })
  @UseGuards(JwtAuthGuard)
  @Get()
  async getFolders(@Request() req) {
    const ownerId = req.user.userId;
    const result = await this.folderService.getFolders(ownerId);
    return {
      message: 'Folders retrieved successfully',
      total: result.total,
      folders: result.folders,
    };
  }

  // --- Get root folders for logged-in user ---
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get root folders for logged-in user' })
  @ApiResponse({
    status: 200,
    description: 'Root folders fetched successfully!',
  })
  @UseGuards(JwtAuthGuard)
  @Get('root')
  async getRootFolders(@Request() req) {
    const ownerId = req.user.userId;
    const result = await this.folderService.getRootFolders(ownerId);
    return {
      message: 'Root folders retrieved successfully',
      total: result.total,
      folders: result.folders,
    };
  }

  // --- Get folder tree by ID ---
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get folder tree by ID' })
  @ApiResponse({
    status: 200,
    description: 'Folder tree fetched successfully!',
  })
  @UseGuards(JwtAuthGuard)
  @Get('tree')
  async getFolderTree(@Body() body: { folderId: string }, @Request() req) {
    const ownerId = req.user.userId;
    const folder = await this.folderService.getFolderTree(
      body.folderId,
      ownerId,
    );
    return {
      message: 'Folder tree retrieved successfully',
      folder,
    };
  }

  // --- Get folder by ID ---
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get folder by ID' })
  @ApiResponse({ status: 200, description: 'Folder retrieved successfully!' })
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getFolderById(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const ownerId = req.user.userId;
    const folder = await this.folderService.getFolderById(id, ownerId);
    return {
      message: 'Folder retrieved successfully',
      folder,
    };
  }

  // --- Create folder ---
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new folder' })
  @ApiResponse({ status: 201, description: 'Folder created successfully!' })
  @UseGuards(JwtAuthGuard)
  @Post()
  async createFolder(@Body() createFolderDto: CreateFolderDto, @Request() req) {
    const ownerId = req.user.userId;
    const folder = await this.folderService.createFolder(
      createFolderDto,
      ownerId,
    );
    return {
      message: 'Folder created successfully',
      folder,
    };
  }

  // --- Update folder ---
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a folder' })
  @ApiResponse({ status: 200, description: 'Folder updated successfully!' })
  @UseGuards(JwtAuthGuard)
  @Put('update')
  async updateFolder(@Body() updateFolderDto: UpdateFolderDto, @Request() req) {
    const ownerId = req.user.userId;
    const folder = await this.folderService.updateFolder(
      updateFolderDto,
      ownerId,
    );
    return {
      message: 'Folder updated successfully',
      folder,
    };
  }

  // --- Move folder ---
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Move a folder to a new parent' })
  @ApiResponse({ status: 200, description: 'Folder moved successfully!' })
  @UseGuards(JwtAuthGuard)
  @Put('move')
  async moveFolder(@Body() moveFolderDto: MoveFolderDto, @Request() req) {
    const ownerId = req.user.userId;
    const folder = await this.folderService.moveFolder(moveFolderDto, ownerId);
    return {
      message: 'Folder moved successfully',
      folder,
    };
  }

  // --- Delete folder ---
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a folder' })
  @ApiResponse({ status: 200, description: 'Folder deleted successfully!' })
  @UseGuards(JwtAuthGuard)
  @Delete('delete')
  async deleteFolder(@Body() deleteFolderDto: DeleteFolderDto, @Request() req) {
    const ownerId = req.user.userId;
    const result = await this.folderService.deleteFolder(
      ownerId,
      deleteFolderDto,
    );
    return result;
  }

  // --- Add document to folder ---
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add a document to a folder' })
  @ApiResponse({
    status: 200,
    description: 'Document added to folder successfully!',
  })
  @UseGuards(JwtAuthGuard)
  @Post('documents/add')
  async addDocumentToFolder(
    @Body() dto: AddDocumentToFolderDto,
    @Request() req,
  ) {
    const ownerId = req.user.userId;
    const result = await this.folderService.addDocumentToFolder(
      dto.folderId,
      dto.documentId,
      ownerId,
    );
    return result;
  }

  // --- Remove document from folder ---
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a document from a folder' })
  @ApiResponse({
    status: 200,
    description: 'Document removed from folder successfully!',
  })
  @UseGuards(JwtAuthGuard)
  @Delete('documents/remove')
  async removeDocumentFromFolder(
    @Body() dto: RemoveDocumentFromFolderDto,
    @Request() req,
  ) {
    const ownerId = req.user.userId;
    const result = await this.folderService.removeDocumentFromFolder(
      dto.folderId,
      dto.documentId,
      ownerId,
    );
    return result;
  }

  // --- Get documents by folder ---
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get documents in a folder with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Documents retrieved successfully!',
  })
  @UseGuards(JwtAuthGuard)
  @Get(':folderId/documents')
  async getDocumentsByFolder(
    @Param('folderId', ParseUUIDPipe) folderId: string,
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '5',
  ) {
    const ownerId = req.user.userId;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 5;
    const result = await this.folderService.getDocumentsByFolder(
      folderId,
      ownerId,
      pageNum,
      limitNum,
    );
    return {
      message: 'Documents retrieved successfully',
      total: result.total,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
      documents: result.documents,
    };
  }
}
