const { execSync } = require("child_process");

const args = process.argv.slice(2);
const migrationName = args[0];

if (!migrationName) {
  console.error(
    "❌ You must provide a migration name. Example: npm run migration:create CreateUsersTable"
  );
  process.exit(1);
}

const command = `npm run typeorm -- migration:create src/database/migrations/${migrationName}`;

console.log(`👉 Creating migration: ${migrationName}`);
execSync(command, { stdio: "inherit" });
