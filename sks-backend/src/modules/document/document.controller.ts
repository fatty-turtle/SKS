import {
  Controller,
  Post,
  Patch,
  UploadedFile,
  UseInterceptors,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
  Delete,
  Request,
  Res,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentService } from './document.service';
import { DocumentDto } from './dtos/document.dto';
import { DeleteDocumentDto } from './dtos/delete-document.dto';
import { SearchDocumentDto } from './dtos/search-document.dto';
import { UpdateDocumentNameDto } from './dtos/update-document-name.dto';
import { DocumentValidationPipe } from './pipes/document-validation.pipe';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../authentication/jwt/jwt-auth.guard';

@Controller('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  // --- Upload document ---
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upload a document and return updated list' })
  @ApiResponse({ status: 200, description: 'Document uploaded successfully!' })
  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile(new DocumentValidationPipe()) file: Express.Multer.File,
    @Body() createDocumentDto: DocumentDto,
    @Request() req,
  ): Promise<any> {
    const ownerId = req.user.userId; // inject ownerId from JWT

    if (!createDocumentDto.title) {
      createDocumentDto.title = file.originalname;
    }

    const uploaded = await this.documentService.uploadDocument(
      file,
      createDocumentDto,
      ownerId,
    );
    const updatedList = await this.documentService.getDocuments(ownerId);

    return {
      message: 'Document uploaded and list refreshed successfully',
      uploaded,
      updatedList,
    };
  }

  // --- Get all documents for logged-in user ---
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all documents for logged-in user' })
  @ApiResponse({ status: 200, description: 'Documents fetched successfully!' })
  @UseGuards(JwtAuthGuard)
  @Get()
  async getDocuments(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '5',
  ) {
    const ownerId = req.user.userId;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 5;
    const result = await this.documentService.getDocuments(
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

  // // --- Get a single document by ID for logged-in user ---
  // @HttpCode(HttpStatus.OK)
  // @ApiOperation({ summary: 'Get a single document by ID for logged-in user' })
  // @ApiResponse({ status: 200, description: 'Document fetched successfully!' })
  // @UseGuards(JwtAuthGuard)
  // @Get(':id')
  // async getDocument(
  //   @Param('id', ParseUUIDPipe) documentId: string,
  //   @Request() req,
  // ) {
  //   const ownerId = req.user.userId;
  //   const result = await this.documentService.getDocument(documentId, ownerId);
  //   return result;
  // }
  // --- Delete document by logged-in user ---
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a document for logged-in user' })
  @ApiResponse({ status: 200, description: 'Document deleted successfully!' })
  @UseGuards(JwtAuthGuard)
  @Delete('delete')
  async deleteDocument(@Request() req, @Body() deleteDto: DeleteDocumentDto) {
    const ownerId = req.user.userId;
    const result = await this.documentService.deleteDocument(
      ownerId,
      deleteDto.documentId,
    );
    return result;
  }

  // --- Toggle favorite for a document ---
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle favorite status for a document' })
  @ApiResponse({ status: 200, description: 'Favorite toggled successfully!' })
  @UseGuards(JwtAuthGuard)
  @Post(':documentId/toggle-favorite')
  async toggleFavorite(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Request() req,
  ) {
    const userId = req.user.userId;
    const result = await this.documentService.toggleFavorite(
      userId,
      documentId,
    );
    return {
      message: 'Favorite toggled successfully',
      data: result,
    };
  }

  // --- Get favorite documents for logged-in user ---
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get favorite documents for logged-in user' })
  @ApiResponse({ status: 200, description: 'Favorites fetched successfully!' })
  @UseGuards(JwtAuthGuard)
  @Get('favorites')
  async getFavorites(@Request() req) {
    const userId = req.user.userId;
    const result = await this.documentService.getFavorites(userId);
    return {
      message: 'Favorites retrieved successfully',
      favorites: result,
    };
  }

  // --- Search documents ---
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search documents by query' })
  @ApiResponse({ status: 200, description: 'Documents searched successfully!' })
  @UseGuards(JwtAuthGuard)
  @Get('search')
  async searchDocuments(@Query() searchDto: SearchDocumentDto, @Request() req) {
    const ownerId = req.user.userId;
    const result = await this.documentService.searchDocuments(
      searchDto.q,
      ownerId,
      searchDto.limit,
    );
    return {
      message: 'Documents searched successfully',
      relatedTitleDocuments: result.relatedTitleDocuments,
      relatedContentDocuments: result.relatedContentDocuments,
    };
  }

  // --- Get related documents ---
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get related documents based on vector similarity' })
  @ApiResponse({
    status: 200,
    description: 'Related documents retrieved successfully!',
  })
  @UseGuards(JwtAuthGuard)
  @Get(':id/related')
  async getRelatedDocuments(
    @Param('id', ParseUUIDPipe) documentId: string,
    @Request() req,
  ) {
    const ownerId = req.user.userId;
    const result = await this.documentService.getRelatedDocuments(
      documentId,
      ownerId,
    );
    return {
      message: 'Related documents retrieved successfully',
      total: result.total,
      documents: result.documents,
    };
  }

  // --- Serve document file ---
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Serve the document file for download/viewing' })
  @ApiResponse({ status: 200, description: 'File served successfully!' })
  @UseGuards(JwtAuthGuard)
  @Get(':id/file')
  async getDocumentFile(
    @Param('id', ParseUUIDPipe) documentId: string,
    @Request() req,
    @Res() res: Response,
  ) {
    const ownerId = req.user.userId;
    const filePath = await this.documentService.getDocumentFilePath(
      documentId,
      ownerId,
    );
    res.sendFile(filePath, { root: '.' });
  }

  // --- Update document name ---
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update the name of a document for the logged-in user',
  })
  @ApiResponse({
    status: 200,
    description: 'Document name updated successfully!',
  })
  @UseGuards(JwtAuthGuard)
  @Patch(':documentId/update-name')
  async updateDocumentName(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Body() updateDto: UpdateDocumentNameDto,
    @Request() req,
  ) {
    const userId = req.user.userId;
    const result = await this.documentService.updateDocumentName(
      userId,
      documentId,
      updateDto.newDocumentName,
    );
    return result;
  }
}
