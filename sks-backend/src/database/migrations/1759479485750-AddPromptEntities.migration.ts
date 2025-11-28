import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class AddPromptManagement1759479485750 implements MigrationInterface {
  name = 'AddPromptManagement1759479485750';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ensure pgcrypto for gen_random_uuid() (safe if exists)
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

    // ====== prompts ======
    await queryRunner.createTable(
      new Table({
        name: 'prompts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          { name: 'key', type: 'text', isNullable: false, isUnique: true },
          { name: 'name', type: 'text', isNullable: false },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'owner_id', type: 'uuid', isNullable: true },
          { name: 'is_archived', type: 'boolean', default: false.toString() },
          { name: 'created_at', type: 'timestamptz', default: 'now()' },
          { name: 'updated_at', type: 'timestamptz', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'prompts',
      new TableForeignKey({
        columnNames: ['owner_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        onUpdate: 'NO ACTION',
      }),
    );

    // ====== prompt_versions ======
    await queryRunner.createTable(
      new Table({
        name: 'prompt_versions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          { name: 'prompt_id', type: 'uuid', isNullable: false },
          { name: 'version', type: 'int', isNullable: false },
          { name: 'is_active', type: 'boolean', default: false.toString() },
          { name: 'model', type: 'text', isNullable: false },
          { name: 'temperature', type: 'numeric', isNullable: true },
          { name: 'top_p', type: 'numeric', isNullable: true },
          { name: 'max_tokens', type: 'int', isNullable: true },
          { name: 'stop_sequences', type: 'text', isArray: true, isNullable: true },
          { name: 'system_template', type: 'text', isNullable: true },
          { name: 'user_template', type: 'text', isNullable: true },
          { name: 'input_schema', type: 'jsonb', isNullable: true },
          { name: 'metadata', type: 'jsonb', isNullable: true },
          { name: 'created_by', type: 'uuid', isNullable: true },
          { name: 'created_at', type: 'timestamptz', default: 'now()' },
        ],
        uniques: [
          {
            name: 'UQ_prompt_versions_prompt_version',
            columnNames: ['prompt_id', 'version'],
          },
        ],
        indices: [
          { name: 'IDX_prompt_versions_is_active', columnNames: ['is_active'] },
          { name: 'IDX_prompt_versions_prompt_id', columnNames: ['prompt_id'] },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys('prompt_versions', [
      new TableForeignKey({
        columnNames: ['prompt_id'],
        referencedTableName: 'prompts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['created_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    ]);

    // Partial unique index: only one active version per prompt
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uniq_prompt_active_version
      ON prompt_versions (prompt_id)
      WHERE is_active = TRUE;
    `);

    // ====== prompt_runs ======
    await queryRunner.createTable(
      new Table({
        name: 'prompt_runs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          { name: 'prompt_id', type: 'uuid', isNullable: false },
          { name: 'prompt_version_id', type: 'uuid', isNullable: false },
          { name: 'input_vars', type: 'jsonb', isNullable: false },
          { name: 'rendered_system', type: 'text', isNullable: true },
          { name: 'rendered_user', type: 'text', isNullable: true },
          { name: 'response_text', type: 'text', isNullable: true },
          { name: 'response_usage', type: 'jsonb', isNullable: true },
          { name: 'latency_ms', type: 'int', isNullable: true },
          { name: 'summary_id', type: 'uuid', isNullable: true },
          { name: 'created_by', type: 'uuid', isNullable: true },
          { name: 'created_at', type: 'timestamptz', default: 'now()' },
        ],
        indices: [
          { name: 'IDX_prompt_runs_prompt', columnNames: ['prompt_id'] },
          { name: 'IDX_prompt_runs_version', columnNames: ['prompt_version_id'] },
          { name: 'IDX_prompt_runs_summary', columnNames: ['summary_id'] },
          { name: 'IDX_prompt_runs_created_at', columnNames: ['created_at'] },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys('prompt_runs', [
      new TableForeignKey({
        columnNames: ['prompt_id'],
        referencedTableName: 'prompts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['prompt_version_id'],
        referencedTableName: 'prompt_versions',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    //   new TableForeignKey({
    //     columnNames: ['summary_id'],
    //     referencedTableName: 'summaries',
    //     referencedColumnNames: ['id'],
    //     onDelete: 'SET NULL',
    //   }),
      new TableForeignKey({
        columnNames: ['created_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop prompt_runs FKs + table
    const prFks = await queryRunner.getTable('prompt_runs');
    if (prFks) {
      for (const fk of prFks.foreignKeys) {
        await queryRunner.dropForeignKey('prompt_runs', fk);
      }
    }
    await queryRunner.dropTable('prompt_runs', true);

    // Drop partial index on prompt_versions
    await queryRunner.query(
      `DROP INDEX IF EXISTS uniq_prompt_active_version;`,
    );

    // Drop prompt_versions FKs + table
    const pv = await queryRunner.getTable('prompt_versions');
    if (pv) {
      for (const fk of pv.foreignKeys) {
        await queryRunner.dropForeignKey('prompt_versions', fk);
      }
    }
    await queryRunner.dropTable('prompt_versions', true);

    // Drop prompts FKs + table
    const p = await queryRunner.getTable('prompts');
    if (p) {
      for (const fk of p.foreignKeys) {
        await queryRunner.dropForeignKey('prompts', fk);
      }
    }
    await queryRunner.dropTable('prompts', true);

    // (Optionally) do not drop pgcrypto extension
  }
}
