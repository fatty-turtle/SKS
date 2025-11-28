import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateFolderEntity1761640450766 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create folder table
        await queryRunner.createTable(
            new Table({
                name: 'folder',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'uuid',
                    },
                    { name: 'owner_id', type: 'uuid' },
                    { name: 'name', type: 'text' },
                    { name: 'parent_id', type: 'uuid', isNullable: true },
                    { name: 'created_at', type: 'timestamp', default: 'NOW()' },
                    { name: 'updated_at', type: 'timestamp', default: 'NOW()' },
                ],
            }),
            true,
        );

        // Add foreign key for parent_id
        await queryRunner.createForeignKey(
            'folder',
            new TableForeignKey({
                columnNames: ['parent_id'],
                referencedTableName: 'folder',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );

        // Add folder_id column to document table
        await queryRunner.query(`ALTER TABLE "document" ADD COLUMN "folder_id" uuid`);

        // Add foreign key for folder_id in document table
        await queryRunner.createForeignKey(
            'document',
            new TableForeignKey({
                columnNames: ['folder_id'],
                referencedTableName: 'folder',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            }),
        );

        // Create user_folders join table for many-to-many relation
        await queryRunner.createTable(
            new Table({
                name: 'user_folders',
                columns: [
                    { name: 'user_id', type: 'uuid', isPrimary: true },
                    { name: 'folder_id', type: 'uuid', isPrimary: true },
                ],
            }),
            true,
        );

        await queryRunner.createForeignKey(
            'user_folders',
            new TableForeignKey({
                columnNames: ['user_id'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'user_folders',
            new TableForeignKey({
                columnNames: ['folder_id'],
                referencedTableName: 'folder',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop user_folders join table
        const userFoldersTable = await queryRunner.getTable('user_folders');
        if (userFoldersTable) {
            for (const fk of userFoldersTable.foreignKeys) {
                await queryRunner.dropForeignKey('user_folders', fk);
            }
            await queryRunner.dropTable('user_folders');
        }

        // Drop foreign key from document table
        const documentTable = await queryRunner.getTable('document');
        if (documentTable) {
            const fk = documentTable.foreignKeys.find(fk => fk.columnNames.indexOf('folder_id') !== -1);
            if (fk) {
                await queryRunner.dropForeignKey('document', fk);
            }
            // Drop column
            await queryRunner.query(`ALTER TABLE "document" DROP COLUMN "folder_id"`);
        }

        // Drop folder table
        const folderTable = await queryRunner.getTable('folder');
        if (folderTable) {
            for (const fk of folderTable.foreignKeys) {
                await queryRunner.dropForeignKey('folder', fk);
            }
            await queryRunner.dropTable('folder');
        }
    }

}
