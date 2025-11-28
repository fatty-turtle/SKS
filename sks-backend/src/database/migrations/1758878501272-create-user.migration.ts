import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateUserMigration1758878501272 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise < void> {
        await queryRunner.createTable(
            new Table({
                name: "users",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        generationStrategy: "uuid",
                        default: "uuid_generate_v4()", // make sure extension is enabled
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "now()",
                    },
                    {
                        name: "updated_at",
                        type: "timestamp",
                        default: "now()",
                    },
                    {
                        name: "email",
                        type: "varchar",
                        isUnique: true,
                    },
                    {
                        name: "password",
                        type: "varchar",
                    },
                    {
                        name: "name",
                        type: "varchar",
                        isNullable: true,
                    },
                    {
                        name: "role",
                        type: "enum",
                        enum: ["user", "admin"],
                        default: "'user'",
                    },
                    {
                        name: "is_email_confirmed",
                        type: "boolean",
                        default: false,
                    },
                    {
                        name: "email_confirmation_token",
                        type: "varchar",
                        isNullable: true,
                    },
                ],
            }),
            true,
        );
    }
    
      public async down(queryRunner: QueryRunner): Promise < void> {
        await queryRunner.dropTable("users");
    }

}
