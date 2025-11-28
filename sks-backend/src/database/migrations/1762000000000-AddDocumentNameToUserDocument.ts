import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDocumentNameToUserDocument1762000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_documents" ADD "document_name" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_documents" DROP COLUMN "document_name"`,
    );
  }
}
