import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddIsFavoriteToUserDocuments1761788618714 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn('user_documents', new TableColumn({
            name: 'is_favorite',
            type: 'boolean',
            default: false,
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('user_documents', 'is_favorite');
    }

}
