#!/bin/sh
set -e

DEFAULT_AUTH_SECRET="change-me-to-a-long-random-string"
PLACEHOLDER_AUTH_SECRET="generate-with-openssl-rand-base64-32"

if [ -z "${AUTH_SECRET:-}" ] || \
   [ "$AUTH_SECRET" = "$DEFAULT_AUTH_SECRET" ] || \
   [ "$AUTH_SECRET" = "$PLACEHOLDER_AUTH_SECRET" ] || \
   [ "$AUTH_SECRET" = "generate-a-long-random-string" ]; then
  echo "ERROR: AUTH_SECRET is missing or still set to a placeholder." >&2
  echo "Generate one with: openssl rand -base64 32" >&2
  echo "Then export AUTH_SECRET before starting (see selfhosting.md)." >&2
  exit 1
fi

if [ "${SELF_HOST_LOG_VERIFICATION:-}" = "true" ] && [ "${NODE_ENV:-}" = "production" ]; then
  echo "WARNING: SELF_HOST_LOG_VERIFICATION=true logs email OTPs to stdout." >&2
  echo "Disable it for any deploy that serves real users." >&2
fi

echo "→ Running database migrations…"
npx prisma migrate deploy --schema=apps/dashboard/prisma/schema.prisma 2>&1 || {
  echo "⚠ Migration failed — retrying in 3s…"
  sleep 3
  npx prisma migrate deploy --schema=apps/dashboard/prisma/schema.prisma
}

echo "→ Starting server…"
exec "$@"
