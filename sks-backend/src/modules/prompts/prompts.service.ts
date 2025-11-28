import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prompt, PromptRun, PromptVersion } from 'src/database/entities/prompts.entities';

import { CreatePromptDto } from 'src/modules/prompts/dtos/create-prompt.dto';
import { CreateVersionDto } from 'src/modules/prompts/dtos/create-version.dto';
import { RenderPreviewDto } from 'src/modules/prompts/dtos/render-preview.dto';
import { RunPromptDto } from 'src/modules/prompts/dtos/run.dto';
import { PromptRenderer } from 'src/modules/prompts/dtos/prompts.renderer';
import { OpenAIService } from 'src/common/llm/openai.service';
import { ExtractJsonAttrsDto } from 'src/modules/prompts/dtos/extract-json-attrs.dto';


type AttrRow = { path: string; type?: string; sample?: any; depth: number };

function inferType(value: any): string {
  if (value === null) return 'null';
  const t = typeof value;
  if (t !== 'object') return t; // string, number, boolean, undefined
  if (Array.isArray(value)) {
    if (value.length === 0) return 'array<unknown>';
    const first = value.find(v => v !== undefined);
    return `array<${inferType(first)}>`;
  }
  return 'object';
}

function isPrimitiveLike(v: any) {
  return v === null || typeof v !== 'object';
}

@Injectable()
export class PromptsService {
  constructor(
    @InjectRepository(Prompt) private promptsRepo: Repository<Prompt>,
    @InjectRepository(PromptVersion) private versionsRepo: Repository<PromptVersion>,
    @InjectRepository(PromptRun) private runsRepo: Repository<PromptRun>,
    private readonly llm: OpenAIService,
  ) {}

  async createPrompt(dto: CreatePromptDto, ownerId?: string) {
    const exists = await this.promptsRepo.findOne({ where: { key: dto.key } });
    if (exists) throw new BadRequestException('Prompt key already exists');
    const prompt = this.promptsRepo.create({
      ...dto,
      owner: ownerId ? ({ id: ownerId } as any) : undefined,
    });
    return this.promptsRepo.save(prompt);
  }

  listPrompts() {
    return this.promptsRepo.find({ relations: ['versions'] });
  }

  async getPromptByKey(key: string) {
    const prompt = await this.promptsRepo.findOne({ where: { key }, relations: ['versions'] });
    if (!prompt) throw new NotFoundException('Prompt not found');
    return prompt;
  }

  async createVersion(promptId: string, dto: CreateVersionDto, userId?: string) {
    const prompt = await this.promptsRepo.findOne({ where: { id: promptId } });
    if (!prompt) throw new NotFoundException('Prompt not found');

    const max = await this.versionsRepo
      .createQueryBuilder('v')
      .where('v.prompt_id = :pid', { pid: promptId })
      .select('MAX(v.version)', 'max')
      .getRawOne<{ max: number }>();

    const versionNum = (max?.max ?? 0) + 1;

    if (dto.activate) {
      await this.versionsRepo.createQueryBuilder()
        .update(PromptVersion).set({ is_active: false })
        .where('prompt_id = :pid', { pid: promptId })
        .execute();
    }

    const v = this.versionsRepo.create({
      prompt, version: versionNum, ...dto,
      created_by: userId ? ({ id: userId } as any) : undefined,
      is_active: !!dto.activate,
    });

    return this.versionsRepo.save(v);
  }

  async setActiveVersion(promptId: string, version: number) {
    const v = await this.versionsRepo.findOne({ where: { prompt: { id: promptId }, version } });
    if (!v) throw new NotFoundException('Version not found');

    await this.versionsRepo.createQueryBuilder()
      .update(PromptVersion).set({ is_active: false })
      .where('prompt_id = :pid', { pid: promptId }).execute();

    v.is_active = true;
    return this.versionsRepo.save(v);
  }

  private async pickVersion(promptId: string, versionId?: string) {
    if (versionId) {
      const v = await this.versionsRepo.findOne({ where: { id: versionId }, relations: ['prompt'] });
      if (!v) throw new NotFoundException('Version not found');
      return v;
    }
    const active = await this.versionsRepo.findOne({
      where: { prompt: { id: promptId }, is_active: true }, relations: ['prompt'],
    });
    if (!active) throw new NotFoundException('No active version for this prompt');
    return active;
  }

  async renderPreview(promptId: string, dto: RenderPreviewDto) {
    const v = await this.pickVersion(promptId, dto.versionId);
    return {
      version: v.version,
      system: PromptRenderer.render(v.system_template, dto.vars),
      user: PromptRenderer.render(v.user_template, dto.vars),
      model: v.model,
    };
  }

  async run(promptKey: string, dto: RunPromptDto, userId?: string) {
    const prompt = await this.promptsRepo.findOne({ where: { key: promptKey } });
    if (!prompt) throw new NotFoundException('Prompt not found');

    const v = await this.pickVersion(prompt.id, dto.versionId);
    const system = PromptRenderer.render(v.system_template, dto.vars);
    const user = PromptRenderer.render(v.user_template, dto.vars) ?? '';

    const result = await this.llm.chat({
      model: v.model,
      system,
      user,
      temperature: v.temperature ?? undefined,
      top_p: v.top_p ?? undefined,
      max_tokens: v.max_tokens ?? undefined,
      stop: v.stop_sequences ?? undefined,
    });

    const run = this.runsRepo.create({
      prompt,
      prompt_version: v,
      input_vars: dto.vars,
      rendered_system: system,
      rendered_user: user,
      response_text: result.text,
      response_usage: result.usage,
      latency_ms: result.latencyMs,
      // nếu client không gửi summaryId thì để null (cột là UUID)
      ...(dto.summaryId ? { summary_id: dto.summaryId } : {}),
      created_by: userId ? ({ id: userId } as any) : undefined,
    });
    await this.runsRepo.save(run);

    return {
      text: result.text,
      usage: result.usage,
      latency_ms: run.latency_ms,
      run_id: run.id,
    };
  }
    extractJsonAttributes(dto: ExtractJsonAttrsDto) {
    const { payload, options } = dto;

    if (payload === undefined) {
      throw new BadRequestException('payload is required');
    }

    const arrayStyle = options?.arrayStyle ?? 'wildcard'; // 'wildcard' | 'index'
    const maxDepth = options?.maxDepth ?? 50;
    const includeTypes = options?.includeTypes ?? true;
    const includeSample = options?.includeSample ?? true;

    const out: AttrRow[] = [];

    const visit = (node: any, base: string, depth: number) => {
      if (depth > maxDepth) return;

      // primitive -> ghi nhận và thoát
      if (isPrimitiveLike(node)) {
        const row: AttrRow = { path: base || '$', depth };
        if (includeTypes) row.type = inferType(node);
        if (includeSample) row.sample = node;
        out.push(row);
        return;
      }

      // array
      if (Array.isArray(node)) {
        const arrPath = base || '$';
        const row: AttrRow = { path: arrPath, depth };
        if (includeTypes) row.type = inferType(node);
        if (includeSample) row.sample = node[0];
        out.push(row);

        if (node.length === 0) return;

        if (arrayStyle === 'index') {
          for (let i = 0; i < node.length; i++) {
            visit(node[i], `${arrPath}[${i}]`, depth + 1);
          }
        } else {
          // wildcard: chỉ dive vào 1 phần tử mẫu
          visit(node[0], `${arrPath}[]`, depth + 1);
        }
        return;
      }

      // object
      const keys = Object.keys(node);
      if (keys.length === 0) {
        const row: AttrRow = { path: base || '$', depth };
        if (includeTypes) row.type = 'object';
        out.push(row);
        return;
      }

      for (const k of keys) {
        const next = node[k];
        const p = base ? `${base}.${k}` : k;

        const row: AttrRow = { path: p, depth: depth + 1 };
        if (includeTypes) row.type = inferType(next);
        if (includeSample && isPrimitiveLike(next)) row.sample = next;
        out.push(row);

        if (!isPrimitiveLike(next)) {
          visit(next, p, depth + 1);
        }
      }
    };

    visit(payload, '', 0);

    // de-dup theo path|type
    const dedup = new Map<string, AttrRow>();
    for (const r of out) {
      const key = `${r.path}|${r.type ?? ''}`;
      if (!dedup.has(key)) dedup.set(key, r);
    }

    const attributes = Array.from(dedup.values());
    return { count: attributes.length, attributes };
  }

}
