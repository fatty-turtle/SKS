// src/modules/prompts/prompts.controller.ts


import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { PromptsService } from './prompts.service';
import { CreatePromptDto } from './dtos/create-prompt.dto';
import { CreateVersionDto } from './dtos/create-version.dto';
import { RenderPreviewDto } from './dtos/render-preview.dto';
import { RunPromptDto } from './dtos/run.dto';
import { ExtractJsonAttrsDto } from './dtos/extract-json-attrs.dto';




import { JwtAuthGuard } from 'src/modules/authentication/jwt/jwt-auth.guard';
import { RolesGuard } from 'src/modules/authentication/jwt/roles.guard';
import { Public } from 'src/common/decorators/public.decorator';
import { Roles } from 'src/common/decorators/role.decorator'; // bạn cần file này nếu chưa có
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from 'src/database/entities/user.entity'; // đường dẫn có thể khác




@ApiTags('prompts')
@Controller('prompts')
export class PromptsController {
  constructor(private readonly svc: PromptsService) {}


  // -------------------------------------------------
  // GET /prompts
  // List all prompts (admin only, vì đây là config nội bộ)
  // -------------------------------------------------
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'List all prompts' })
  @ApiResponse({
    status: 200,
    description: 'Return all prompts with their versions',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          key: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          versions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                version: { type: 'number' },
                is_active: { type: 'boolean' },
                model: { type: 'string' },
              },
            },
          },
        },
      },
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  list() {
    return this.svc.listPrompts();
  }


  // -------------------------------------------------
  // POST /prompts
  // Create a new prompt (admin only)
  // -------------------------------------------------
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Create a new prompt definition' })
  @ApiResponse({
    status: 201,
    description: 'Prompt created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        key: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        is_archived: { type: 'boolean' },
        created_at: { type: 'string' },
        updated_at: { type: 'string' },
      },
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreatePromptDto) {
    return this.svc.createPrompt(dto);
  }


  // -------------------------------------------------
  // GET /prompts/:key
  // Get prompt by key (admin only - this is config info)
  // -------------------------------------------------
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Get a prompt (and its versions) by key' })
  @ApiResponse({
    status: 200,
    description: 'Prompt + versions fetched successfully',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get(':key')
  getByKey(@Param('key') key: string) {
    return this.svc.getPromptByKey(key);
  }


  // -------------------------------------------------
  // POST /prompts/:id/versions
  // Create a new version for a prompt (admin only)
  // -------------------------------------------------
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Create a new version of a prompt' })
  @ApiResponse({
    status: 201,
    description: 'Prompt version created',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        version: { type: 'number' },
        is_active: { type: 'boolean' },
        model: { type: 'string' },
        system_template: { type: 'string' },
        user_template: { type: 'string' },
        created_at: { type: 'string' },
      },
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post(':id/versions')
  createVersion(@Param('id') id: string, @Body() dto: CreateVersionDto) {
    return this.svc.createVersion(id, dto);
  }


  // -------------------------------------------------
  // PATCH /prompts/:id/versions/activate?version=2
  // Mark a version as active (admin only)
  // -------------------------------------------------
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Activate a specific version of a prompt' })
  @ApiResponse({
    status: 200,
    description: 'Prompt version activated',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id/versions/activate')
  activate(
    @Param('id') id: string,
    @Query('version') version: string,
  ) {
    return this.svc.setActiveVersion(id, Number(version));
  }


  // -------------------------------------------------
  // POST /prompts/:id/render
  // Render preview (admin only, to debug templates)
  // -------------------------------------------------
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Preview rendered prompt with given variables (no LLM call)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the system/user messages after variable injection',
    schema: {
      type: 'object',
      properties: {
        version: { type: 'number' },
        system: { type: 'string' },
        user: { type: 'string' },
        model: { type: 'string' },
      },
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post(':id/render')
  @HttpCode(HttpStatus.OK)
  render(@Param('id') id: string, @Body() dto: RenderPreviewDto) {
    return this.svc.renderPreview(id, dto);
  }
  // -------------------------------------------------
  // POST /prompts/utils/json-attributes
  // Phân tích một JSON document -> trả về danh sách "thuộc tính" dạng path
  // (ví dụ: user.name, user.emails[], profile.age, ...)
  // Admin-only vì đây là tiện ích cho config nội bộ
  // -------------------------------------------------
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Extract attribute paths from a JSON document' })
  @ApiResponse({
    status: 200,
    description: 'Return flattened attribute paths (with optional type & sample)',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number' },
        attributes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string', example: 'user.emails[]' },
              type: { type: 'string', example: 'array<string>' },
              sample: { type: 'string', example: 'a@x.com' },
              depth: { type: 'number', example: 2 },
            },
          },
        },
      },
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('utils/json-attributes')
  @HttpCode(HttpStatus.OK)
  extractJsonAttributes(@Body() dto: ExtractJsonAttrsDto) {
    return this.svc.extractJsonAttributes(dto);
  }


  // -------------------------------------------------
  // POST /prompts/:key/run
  // Run LLM (OPTION: public or authenticated)
  //   - Nếu đây là API nội bộ chỉ backend dùng -> giữ admin only.
  //   - Nếu đây là API cho user cuối (ví dụ chatbot người dùng), cho phép Public().
  //
  // Dưới đây cho phép user thường đã login (JwtAuthGuard)
  // chứ KHÔNG yêu cầu admin, vì đây là chỗ thực sự dùng LLM.
  // -------------------------------------------------
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Execute active prompt version with variables and call LLM' })
  @ApiResponse({
    status: 201,
    description: 'LLM executed successfully',
    schema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        usage: { type: 'object' },
        latency_ms: { type: 'number' },
        run_id: { type: 'string' },
      },
    },
  })
  @UseGuards(JwtAuthGuard)
  // nếu muốn ai cũng gọi được thì thay bằng:
  // @Public()
  @Post(':key/run')
  @HttpCode(HttpStatus.CREATED)
  run(@Param('key') key: string, @Body() dto: RunPromptDto) {
    return this.svc.run(key, dto);
  }
}
