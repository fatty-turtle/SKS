import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PromptsService } from '../src/modules/prompts/prompts.service';
import { Prompt, PromptRun, PromptVersion } from '../src/database/entities/prompts.entities';
import { OpenAIService } from '../src/common/llm/openai.service';

type DeepMock<T> = { [K in keyof T]?: jest.Mock<any, any> } & Partial<T>;

describe('PromptsService (unit)', () => {
  let service: PromptsService;
  let promptRepo: DeepMock<Repository<Prompt>>;
  let versionRepo: DeepMock<Repository<PromptVersion>>;
  let runRepo: DeepMock<Repository<PromptRun>>;
  let openai: DeepMock<OpenAIService>;

  beforeEach(async () => {
    promptRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    } as any;

    versionRepo = {
      createQueryBuilder: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    } as any;

    runRepo = {
      create: jest.fn(),
      save: jest.fn(),
    } as any;

    openai = {
      chat: jest.fn().mockResolvedValue({
        text: 'hello world',
        usage: { total_tokens: 42 },
        latencyMs: 123,
      }),
    } as any;

    const moduleRef = await Test.createTestingModule({
      providers: [
        PromptsService,
        { provide: getRepositoryToken(Prompt), useValue: promptRepo },
        { provide: getRepositoryToken(PromptVersion), useValue: versionRepo },
        { provide: getRepositoryToken(PromptRun), useValue: runRepo },
        { provide: OpenAIService, useValue: openai },
      ],
    }).compile();

    service = moduleRef.get(PromptsService);
  });

  it('createPrompt - tạo record mới', async () => {
    promptRepo.findOne!.mockResolvedValue(null);
    promptRepo.create!.mockReturnValue({ key: 'k', name: 'n' });
    promptRepo.save!.mockResolvedValue({ id: 'p1', key: 'k', name: 'n' });

    const res = await service.createPrompt({ key: 'k', name: 'n' });
    expect(res).toMatchObject({ id: 'p1', key: 'k' });
    expect(promptRepo.save).toBeCalled();
  });

  it('createVersion - tăng version + activate', async () => {
    promptRepo.findOne!.mockResolvedValue({ id: 'p1' });

    // giả lập MAX(version)=1
    const qbUpdate = { update: () => qbUpdate, set: () => qbUpdate, where: () => qbUpdate, execute: jest.fn() };
    const qbSelect: any = {
      where: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ max: 1 }),
    };
    versionRepo.createQueryBuilder!.mockImplementation((alias: string) =>
      alias === 'v' ? qbSelect : qbUpdate,
    );

    versionRepo.create!.mockReturnValue({ id: 'v2', version: 2, is_active: true });
    versionRepo.save!.mockResolvedValue({ id: 'v2', version: 2, is_active: true });

    const ver = await service.createVersion('p1', { model: 'gpt-4o-mini', activate: true });
    expect(ver).toMatchObject({ version: 2, is_active: true });
    expect(qbUpdate.execute).toBeCalled(); // deactivate các version khác
  });

  it('run - render template + gọi OpenAI + lưu run', async () => {
    promptRepo.findOne!.mockResolvedValue({ id: 'p1', key: 'k' });
    versionRepo.findOne!.mockResolvedValue({
      id: 'v1',
      version: 1,
      model: 'gpt-4o-mini',
      is_active: true,
      system_template: 'Hello {{name}}',
      user_template: 'Say hi to {{name}}',
      prompt: { id: 'p1' },
    });
    runRepo.create!.mockReturnValue({ id: 'r1' });
    runRepo.save!.mockResolvedValue({ id: 'r1' });

    const res = await service.run('k', { vars: { name: 'Truong' } });
    expect(openai.chat).toBeCalledWith(
      expect.objectContaining({ model: 'gpt-4o-mini', system: 'Hello Truong' }),
    );
    expect(res).toMatchObject({ run_id: 'r1', text: 'hello world' });
  });
});
