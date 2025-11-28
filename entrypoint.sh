#!/bin/sh

# Wait for PostgreSQL to be ready
until pg_isready -h postgres -p 5432 -U postgres; do
  echo "Waiting for PostgreSQL..."
  sleep 2
done

echo "PostgreSQL is ready"

# Run database seeds
node dist/database/seeds/seed-admin.js
node dist/database/seeds/seed-prompts.js

# Start the application
exec node dist/main.js
