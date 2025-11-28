
// src/common/llm/openai.service.ts
import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

export interface LlmCall {
  model: string;
  system?: string;
  user: string;
  temperature?: number; // có thể truyền nhầm string từ nơi khác, service sẽ ép kiểu an toàn
  top_p?: number;
  max_tokens?: number;
  stop?: string[];
}

@Injectable()
export class OpenAIService {
  private client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Ép kiểu an toàn: nhận number | string | null/undefined -> number | undefined
  private coerceNumber(v: unknown): number | undefined {
    if (v === null || v === undefined || v === '') return undefined;
    if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
    if (typeof v === 'string') {
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    }
    return undefined;
  }

  async chat(opts: LlmCall) {
    const t0 = Date.now();

    // Chuẩn bị messages đúng type SDK
    type Msg = OpenAI.Chat.Completions.ChatCompletionMessageParam;
    const messages: Msg[] = [];
    if (opts.system) messages.push({ role: 'system', content: opts.system });
    messages.push({ role: 'user', content: opts.user });

    // Ép kiểu số (dù interface là number, nhưng phòng trường hợp nơi khác gửi string)
    const temperature = this.coerceNumber((opts as any).temperature ?? opts.temperature);
    const top_p      = this.coerceNumber((opts as any).top_p ?? opts.top_p);
    const max_tokens = this.coerceNumber((opts as any).max_tokens ?? opts.max_tokens);

    const payload: OpenAI.Chat.Completions.ChatCompletionCreateParams = {
      model: opts.model,
      messages,
      ...(temperature !== undefined ? { temperature } : {}),
      ...(top_p      !== undefined ? { top_p }      : {}),
      ...(max_tokens !== undefined ? { max_tokens } : {}),
      ...(opts.stop && opts.stop.length ? { stop: opts.stop } : {}),
    };

    const resp = await this.client.chat.completions.create(payload);

    const text = resp.choices?.[0]?.message?.content ?? '';
    const latencyMs = Date.now() - t0;

    // Giữ đúng shape đang dùng ở chỗ khác
    return {
      text,
      usage: resp.usage,         // { prompt_tokens, completion_tokens, total_tokens }
      latencyMs,                 // thay cho result.latencyMs trước đó
      requestId: (resp as any)?._request_id ?? undefined,
      model: resp.model,
    };
  }

  async createEmbedding(text: string): Promise<number[]> {
    const t0 = Date.now();
    const resp = await this.client.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });
    return resp.data[0].embedding;
  }
}
