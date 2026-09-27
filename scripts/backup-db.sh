#!/bin/bash
set -euo pipefail

COMPOSE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-${COMPOSE_DIR}/data/backups}"
RETENTION_DAYS=14
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="primegym_${TIMESTAMP}.sql.gz"

set -a
source "${COMPOSE_DIR}/.env"
set +a

mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Iniciando backup..."
docker compose -f "${COMPOSE_DIR}/docker-compose.yml" exec -T postgres \
  pg_dump -U "${POSTGRES_USER}" "${POSTGRES_DB}" | gzip > "${BACKUP_DIR}/${FILENAME}"

echo "[$(date)] Backup creado: ${BACKUP_DIR}/${FILENAME}"

find "${BACKUP_DIR}" -name "primegym_*.sql.gz" -mtime "+${RETENTION_DAYS}" -delete

echo "[$(date)] Backup finalizado. Retención: ${RETENTION_DAYS} días."