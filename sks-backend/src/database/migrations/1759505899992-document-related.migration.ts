import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class DocumentRelatedMigration1759505899992
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- 1. Summary table
    await queryRunner.createTable(
      new Table({
        name: 'summary',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          { name: 'summary_text', type: 'text', isNullable: false },
          { name: 'summary_model', type: 'text', isNullable: true },
          { name: 'canonical_hash', type: 'text', isUnique: true },
          { name: 'created_by', type: 'uuid', isNullable: false },
          { name: 'created_at', type: 'timestamp', default: 'NOW()' },
          { name: 'updated_at', type: 'timestamp', default: 'NOW()' },
        ],
      }),
      true,
    );

    // --- 2. Document table
    await queryRunner.createTable(
      new Table({
        name: 'document',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          { name: 'title', type: 'text', isNullable: true },
          { name: 'metadata', type: 'jsonb', isNullable: true },
          { name: 'doc_date', type: 'date', isNullable: true },
          { name: 'extra_attributes', type: 'jsonb', isNullable: true },
          { name: 'file_ref', type: 'text', isNullable: true },
          { name: 'content_hash', type: 'text', isNullable: true },
          { name: 'status', type: 'text', default: "'pending'" },
          { name: 'summary_id', type: 'uuid', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'NOW()' },
          { name: 'updated_at', type: 'timestamp', default: 'NOW()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'document',
      new TableForeignKey({
        columnNames: ['summary_id'],
        referencedTableName: 'summary',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // --- 3. Chunk table
    await queryRunner.createTable(
      new Table({
        name: 'chunks',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          { name: 'chunk_index', type: 'int' },
          { name: 'chunk_text', type: 'text' },
          { name: 'token_count', type: 'int' },
          { name: 'created_at', type: 'timestamp', default: 'NOW()' },
          { name: 'updated_at', type: 'timestamp', default: 'NOW()' },
        ],
      }),
      true,
    );

    // --- 4. Document <-> Chunk (many-to-many join table) ---
    await queryRunner.createTable(
      new Table({
        name: 'document_chunks',
        columns: [
          { name: 'document_id', type: 'uuid', isPrimary: true },
          { name: 'chunk_id', type: 'uuid', isPrimary: true },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'document_chunks',
      new TableForeignKey({
        columnNames: ['document_id'],
        referencedTableName: 'document',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'document_chunks',
      new TableForeignKey({
        columnNames: ['chunk_id'],
        referencedTableName: 'chunks',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // --- 5. Document <-> User (many-to-many join table) ---
    await queryRunner.createTable(
      new Table({
        name: 'user_documents',
        columns: [
          { name: 'user_id', type: 'uuid', isPrimary: true },
          { name: 'document_id', type: 'uuid', isPrimary: true },
        ],
      }),
      true,
    );
    await queryRunner.createForeignKey(
      'user_documents',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'user_documents',
      new TableForeignKey({
        columnNames: ['document_id'],
        referencedTableName: 'document',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // --- Drop join table
    const joinTables = ['user_documents', 'document_chunks'];
    for (const tableName of joinTables) {
      const table = await queryRunner.getTable(tableName);
      if (table) {
        for (const fk of table.foreignKeys) {
          await queryRunner.dropForeignKey(tableName, fk);
        }
        await queryRunner.dropTable(tableName);
      }
    }

    // --- Drop chunks table
    const chunkTable = await queryRunner.getTable('chunks');
    if (chunkTable) {
      for (const fk of chunkTable.foreignKeys) {
        await queryRunner.dropForeignKey('chunks', fk);
      }
      await queryRunner.dropTable('chunks');
    }

    // --- Drop document table
    const documentTable = await queryRunner.getTable('document');
    if (documentTable) {
      for (const fk of documentTable.foreignKeys) {
        await queryRunner.dropForeignKey('document', fk);
      }
      await queryRunner.dropTable('document');
    }

    // --- Drop summary table
    const summaryTable = await queryRunner.getTable('summary');
    if (summaryTable) {
      await queryRunner.dropTable('summary');
    }
  }
}
