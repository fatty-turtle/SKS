import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class MoveSummaryAndFolderToUserDocument1761836008555
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add summary_id column to user_documents
    await queryRunner.addColumn(
      'user_documents',
      new TableColumn({
        name: 'summary_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Add folder_id column to user_documents
    await queryRunner.addColumn(
      'user_documents',
      new TableColumn({
        name: 'folder_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Add foreign key for summary_id in user_documents
    await queryRunner.createForeignKey(
      'user_documents',
      new TableForeignKey({
        columnNames: ['summary_id'],
        referencedTableName: 'summary',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // Add foreign key for folder_id in user_documents
    await queryRunner.createForeignKey(
      'user_documents',
      new TableForeignKey({
        columnNames: ['folder_id'],
        referencedTableName: 'folder',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // Drop foreign key for summary_id in document
    const documentTable = await queryRunner.getTable('document');
    if (documentTable) {
      const summaryFk = documentTable.foreignKeys.find((fk) =>
        fk.columnNames.includes('summary_id'),
      );
      if (summaryFk) {
        await queryRunner.dropForeignKey('document', summaryFk);
      }
      // Drop summary_id column from document
      await queryRunner.dropColumn('document', 'summary_id');
    }

    // Drop foreign key for folder_id in document
    if (documentTable) {
      const folderFk = documentTable.foreignKeys.find((fk) =>
        fk.columnNames.includes('folder_id'),
      );
      if (folderFk) {
        await queryRunner.dropForeignKey('document', folderFk);
      }
      // Drop folder_id column from document
      await queryRunner.dropColumn('document', 'folder_id');
    }

    // Drop canonical_hash column from summary
    const summaryTable = await queryRunner.getTable('summary');
    if (summaryTable) {
      await queryRunner.dropColumn('summary', 'canonical_hash');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add summary_id column back to document
    await queryRunner.addColumn(
      'document',
      new TableColumn({
        name: 'summary_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Add folder_id column back to document
    await queryRunner.addColumn(
      'document',
      new TableColumn({
        name: 'folder_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Add foreign key for summary_id in document
    await queryRunner.createForeignKey(
      'document',
      new TableForeignKey({
        columnNames: ['summary_id'],
        referencedTableName: 'summary',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // Add foreign key for folder_id in document
    await queryRunner.createForeignKey(
      'document',
      new TableForeignKey({
        columnNames: ['folder_id'],
        referencedTableName: 'folder',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // Drop foreign keys from user_documents
    const userDocumentsTable = await queryRunner.getTable('user_documents');
    if (userDocumentsTable) {
      const summaryFk = userDocumentsTable.foreignKeys.find((fk) =>
        fk.columnNames.includes('summary_id'),
      );
      if (summaryFk) {
        await queryRunner.dropForeignKey('user_documents', summaryFk);
      }
      const folderFk = userDocumentsTable.foreignKeys.find((fk) =>
        fk.columnNames.includes('folder_id'),
      );
      if (folderFk) {
        await queryRunner.dropForeignKey('user_documents', folderFk);
      }
      // Drop columns from user_documents
      await queryRunner.dropColumn('user_documents', 'summary_id');
      await queryRunner.dropColumn('user_documents', 'folder_id');
    }

    // Add canonical_hash column back to summary
    await queryRunner.addColumn(
      'summary',
      new TableColumn({
        name: 'canonical_hash',
        type: 'text',
        isUnique: true,
      }),
    );
  }
}
