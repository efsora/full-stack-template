#!/bin/sh
set -e

echo "🔍 Waiting for database to be ready..."

# Wait for PostgreSQL to be ready
until PGPASSWORD=$PGPASSWORD psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; do
  echo "⏳ Database is unavailable - sleeping"
  sleep 2
done

echo "✅ Database is ready!"

echo "🔄 Running database migrations..."

# Run migrations (push schema to database)
# Working directory is already /app from Dockerfile
npx drizzle-kit push --config=drizzle.config.ts

if [ $? -eq 0 ]; then
  echo "✅ Migrations completed successfully!"
else
  echo "❌ Migrations failed!"
  exit 1
fi

echo "🚀 Starting backend service..."

# Start the application
exec npm run dev:docker
