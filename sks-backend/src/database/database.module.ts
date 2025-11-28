import { Module, Global } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { User } from "./entities/user.entity";
import { Document } from "./entities/document.entity";
import { Chunk } from "./entities/chunks.entity";
import { Summary } from "./entities/summary.entity";
import { Folder } from "./entities/folder.entity";
import { Prompt, PromptVersion, PromptRun } from "./entities/prompts.entities";
import { UserDocument } from "./entities/user-document.entity";
import { UserRepository } from "./repositories/user.repository";
import { DocumentRepository } from "./repositories/document.repository";
import { ChunkRepository } from "./repositories/chunks.repository";
import { SummaryRepository } from "./repositories/summary.repository";
import { FolderRepository } from "./repositories/folder.repository";
import { UserDocumentRepository } from "./repositories/user-document.repository";

const entities = [
  User,
  Document,
  Chunk,
  Summary,
  Folder,
  Prompt,
  PromptVersion,
  PromptRun,
  UserDocument
];

const repositories = [
  UserRepository,
  DocumentRepository,
  ChunkRepository,
  SummaryRepository,
  FolderRepository,
  UserDocumentRepository
];

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const sslConfig = configService.get<boolean>("DATABASE_SSL");

        return {
          type: "postgres" as const,
          host: configService.get<string>("DATABASE_HOST"),
          port: configService.get<number>("DATABASE_PORT"),
          username: configService.get<string>("DATABASE_USERNAME"),
          password: configService.get<string>("DATABASE_PASSWORD"),
          database: configService.get<string>("DATABASE_NAME"),
          ssl: sslConfig === true ? { rejectUnauthorized: false } : false,
          autoLoadEntities: true,
          logging:
            configService.get<string>("DATABASE_LOGGING") === String("true"),
          entities,
          migrations: ["dist/database/migrations/*.js"],
          migrationsTableName: "migrations",
          migrationsRun: true,
        };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature(entities),
  ],
  providers: [...repositories],
  exports: [TypeOrmModule, ...repositories],
})
export class DatabaseModule {}
