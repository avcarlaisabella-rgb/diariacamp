#!/bin/sh
set -e

echo "Aplicando migrations do Prisma (prisma migrate deploy)..."
npx prisma migrate deploy

echo "Iniciando DiáriaCamp..."
exec "$@"
