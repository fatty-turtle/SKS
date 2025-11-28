import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveEmailConfirmationFields1763468195862 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_email_confirmed"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email_confirmation_token"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "is_email_confirmed" boolean DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "email_confirmation_token" varchar NULL`);
    }

}
