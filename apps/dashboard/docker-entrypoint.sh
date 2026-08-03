#!/bin/sh
set -e

echo "→ Running database migrations…"
npx prisma migrate deploy --schema=apps/dashboard/prisma/schema.prisma 2>&1 || {
  echo "⚠ Migration failed — retrying in 3s…"
  sleep 3
  npx prisma migrate deploy --schema=apps/dashboard/prisma/schema.prisma
}

echo "→ Starting server…"
exec "$@"
