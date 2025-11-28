import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVectorColumnToDocument1761983951230 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "document" ADD COLUMN "metadata_vector" vector(1536)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "document" DROP COLUMN "metadata_vector"`);
    }

}
