#!/bin/sh
set -e

echo "Aplicando migraciones de Prisma..."
npx prisma migrate deploy --schema apps/api/prisma/schema.prisma

# AJUSTAR: reemplazar por el archivo de entrada real que genera tu build
# (ej: apps/api/dist/index.js, apps/api/dist/server.js, apps/api/dist/main.js)
echo "Iniciando API..."
exec node apps/api/dist/index.js