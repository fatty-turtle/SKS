import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { SummaryService } from './summary.service';

import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../authentication/jwt/jwt-auth.guard';

@Controller('summary')
export class SummaryController {
  constructor(private readonly summaryService: SummaryService) {}

  // --- Get summary ---
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get and return summary' })
  @ApiResponse({ status: 200, description: 'Summary retrieved successfully!' })
  @UseGuards(JwtAuthGuard)
  @Get(':documentId')
  async getSummaryByDocId(
    @Param('documentId') documentId: string,
    @Request() req,
  ) {
    const userId = req.user.userId;
    return this.summaryService.getSummary(documentId, userId);
  }

  // --- Create summary ---
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create summary for a document' })
  @ApiResponse({
    status: 201,
    description: 'Summary created successfully!',
  })
  @UseGuards(JwtAuthGuard)
  @Post(':documentId/create')
  async createSummaryByDocId(
    @Param('documentId') documentId: string,
    @Request() req,
  ) {
    const ownerId = req.user.userId;
    const result = await this.summaryService.createSummary(documentId, ownerId);
    return result;
  }

  // --- Refresh summary ---
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh summary for a document' })
  @ApiResponse({
    status: 200,
    description: 'Summary refreshed successfully!',
  })
  @UseGuards(JwtAuthGuard)
  @Post(':documentId/refresh')
  async refreshSummaryByDocId(
    @Param('documentId') documentId: string,
    @Request() req,
  ) {
    const ownerId = req.user.userId;
    const result = await this.summaryService.refreshSummary(
      documentId,
      ownerId,
    );
    return result;
  }

  // --- Delete summary ---
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete summary for a document' })
  @ApiResponse({
    status: 200,
    description: 'Summary deleted successfully!',
  })
  @UseGuards(JwtAuthGuard)
  @Delete(':documentId')
  async deleteSummaryByDocId(
    @Param('documentId') documentId: string,
    @Request() req,
  ) {
    const userId = req.user.userId;
    return await this.summaryService.deleteSummary(documentId, userId);
  }

  // --- Generate diagram ---
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate Mermaid diagram from document summary' })
  @ApiResponse({
    status: 200,
    description: 'Diagram generated successfully!',
  })
  @UseGuards(JwtAuthGuard)
  @Post(':documentId/diagram')
  async generateDiagramByDocId(
    @Param('documentId') documentId: string,
    @Request() req,
  ) {
    const userId = req.user.userId;
    const diagramLines = await this.summaryService.generateDiagram(documentId, userId);
    return { diagram: diagramLines };
  }
}
