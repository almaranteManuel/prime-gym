#!/bin/sh
set -e

echo "Aplicando migraciones de Prisma..."
npx prisma migrate deploy --schema apps/api/prisma/schema.prisma

# Salida de `tsc` con rootDir en la raíz del monorepo (el alias a @gym/shared
# arrastra packages/shared al compilado), por eso la ruta es dist/apps/api/src.
echo "Iniciando API..."
exec node apps/api/dist/apps/api/src/index.js