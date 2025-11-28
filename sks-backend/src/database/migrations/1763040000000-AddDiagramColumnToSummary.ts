import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDiagramColumnToSummary1763040000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "summary" ADD "diagram" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "summary" DROP COLUMN "diagram"`);
    }

}
