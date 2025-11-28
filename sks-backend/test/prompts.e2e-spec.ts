import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromptsModule } from '../src/modules/prompts/prompts.module';
import { Prompt, PromptRun, PromptVersion } from '../src/database/entities/prompts.entities';
import { OpenAIService } from '../src/common/llm/openai.service';

class OpenAIMock {
  async chat() {
    return { text: 'ok', usage: { total_tokens: 10 }, latencyMs: 50 };
  }
}

describe('Prompts (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.TEST_DB_HOST || 'localhost',
          port: Number(process.env.TEST_DB_PORT || 5433),
          username: process.env.TEST_DB_USER || 'postgres',
          password: process.env.TEST_DB_PASS || 'postgres',
          database: process.env.TEST_DB_NAME || 'sks_test',
          entities: [Prompt, PromptVersion, PromptRun],
          synchronize: true, // chỉ cho e2e test
        }),
        PromptsModule,
      ],
    })
      .overrideProvider(OpenAIService)
      .useClass(OpenAIMock)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/prompts (POST) + /prompts/:id/versions (POST) + /prompts/:key/run (POST)', async () => {
    // create prompt
    const p = await request(app.getHttpServer())
      .post('/prompts')
      .send({ key: 'doc.summarize', name: 'Summarizer' })
      .expect(201)
      .then(r => r.body);

    // create version (active)
    const v = await request(app.getHttpServer())
      .post(`/prompts/${p.id}/versions`)
      .send({
        model: 'gpt-4o-mini',
        system_template: 'You are {{role}}',
        user_template: 'Summarize: {{text}}',
        activate: true,
      })
      .expect(201)
      .then(r => r.body);

    expect(v.version).toBe(1);
    expect(v.is_active).toBe(true);

    // run prompt
    const run = await request(app.getHttpServer())
      .post(`/prompts/${p.key}/run`)
      .send({ vars: { role: 'assistant', text: 'hello' } })
      .expect(201)
      .then(r => r.body);

    expect(run.text).toBe('ok');
    expect(run.run_id).toBeDefined();
  });
});
