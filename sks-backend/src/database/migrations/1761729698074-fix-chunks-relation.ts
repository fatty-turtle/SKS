import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixChunksRelation1761729698074 implements MigrationInterface {
  name = 'FixChunksRelation1761729698074';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_documents" DROP CONSTRAINT "FK_aa4b82a9943c65b5f622a6925b2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_documents" DROP CONSTRAINT "FK_7be233cb53d65d6dff4680c14bc"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_aa4b82a9943c65b5f622a6925b" ON "user_documents" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7be233cb53d65d6dff4680c14b" ON "user_documents" ("document_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "user_documents" ADD CONSTRAINT "FK_aa4b82a9943c65b5f622a6925b2" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_documents" ADD CONSTRAINT "FK_7be233cb53d65d6dff4680c14bc" FOREIGN KEY ("document_id") REFERENCES "document"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
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
      `ALTER TABLE "chunks" DROP CONSTRAINT "FK_d841de45a719fe1f35213d79207"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7be233cb53d65d6dff4680c14b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_aa4b82a9943c65b5f622a6925b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_documents" ADD CONSTRAINT "FK_7be233cb53d65d6dff4680c14bc" FOREIGN KEY ("document_id") REFERENCES "document"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_documents" ADD CONSTRAINT "FK_aa4b82a9943c65b5f622a6925b2" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
