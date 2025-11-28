import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFileSizeToDocument1763038727809 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "document" ADD "file_size" bigint`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "document" DROP COLUMN "file_size"`);
    }

}
