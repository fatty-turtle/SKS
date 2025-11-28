import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1761836008554 implements MigrationInterface {
  name = 'Migration1761836008554';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_documents" DROP CONSTRAINT "FK_aa4b82a9943c65b5f622a6925b2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_documents" DROP CONSTRAINT "FK_7be233cb53d65d6dff4680c14bc"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_aa4b82a9943c65b5f622a6925b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7be233cb53d65d6dff4680c14b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_documents" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_documents" DROP CONSTRAINT "PK_8a8bba31e2063bac24665b86a44"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_documents" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_documents" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_documents" ALTER COLUMN "user_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_documents" ALTER COLUMN "document_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_documents" ADD CONSTRAINT "PK_cea43819156528b63504c4afd4b" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_documents" ADD CONSTRAINT "FK_aa4b82a9943c65b5f622a6925b2" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_documents" ADD CONSTRAINT "FK_7be233cb53d65d6dff4680c14bc" FOREIGN KEY ("document_id") REFERENCES "document"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_documents" DROP CONSTRAINT "FK_7be233cb53d65d6dff4680c14bc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_documents" DROP CONSTRAINT "FK_aa4b82a9943c65b5f622a6925b2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_documents" DROP CONSTRAINT "PK_cea43819156528b63504c4afd4b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_documents" ADD CONSTRAINT "PK_3ac538bcc03450f87eaa980cac7" PRIMARY KEY ("document_id", "id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_documents" ALTER COLUMN "document_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_documents" DROP CONSTRAINT "PK_3ac538bcc03450f87eaa980cac7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_documents" ADD CONSTRAINT "PK_da01c0f683c583fda3d329a7cda" PRIMARY KEY ("user_id", "document_id", "id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_documents" ALTER COLUMN "user_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_documents" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_documents" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_documents" DROP CONSTRAINT "PK_da01c0f683c583fda3d329a7cda"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_documents" ADD CONSTRAINT "PK_8a8bba31e2063bac24665b86a44" PRIMARY KEY ("user_id", "document_id")`,
    );
    await queryRunner.query(`ALTER TABLE "user_documents" DROP COLUMN "id"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_7be233cb53d65d6dff4680c14b" ON "user_documents" ("document_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_aa4b82a9943c65b5f622a6925b" ON "user_documents" ("user_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "user_documents" ADD CONSTRAINT "FK_7be233cb53d65d6dff4680c14bc" FOREIGN KEY ("document_id") REFERENCES "document"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_documents" ADD CONSTRAINT "FK_aa4b82a9943c65b5f622a6925b2" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }
}
