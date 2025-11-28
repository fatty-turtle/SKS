import { DataSource } from "typeorm";
import { config } from "dotenv";
import { join } from "path";
import "reflect-metadata";

// Load environment variables
config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DATABASE_HOST || "localhost",
  port: parseInt(process.env.DATABASE_PORT || "5432"),
  username: process.env.DATABASE_USERNAME || "postgres",
  password: process.env.DATABASE_PASSWORD || "sks_password",
  database: process.env.DATABASE_NAME || "sks",
  ssl: false,
  synchronize: false, // Always false for production
  logging: process.env.NODE_ENV === "development",
  entities: [join(__dirname, "entities", "**/*.{ts,js}")],
  migrations: [join(__dirname, "migrations", "*{.ts,.js}")],
  subscribers: [join(__dirname, "subscribers", "*{.ts,.js}")],
  migrationsTableName: "migrations",
  migrationsRun: false,
});
