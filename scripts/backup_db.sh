#!/bin/bash

# ==============================================================================
# Database Automated Backup Script for MongoDB
# CV-Job Matching Platform
#
# Usage:
#   ./scripts/backup_db.sh [BACKUP_DIR]
# ==============================================================================

set -e

# Configuration
CONTAINER_NAME="${MONGO_CONTAINER:-cv-mongodb-prod}"
# Fallback to dev container name if prod container is not found
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    if docker ps --format '{{.Names}}' | grep -q "^mongodb$"; then
        CONTAINER_NAME="mongodb"
    fi
fi

DB_NAME="${DB_NAME:-cv_project_db}"
BACKUP_PARENT_DIR="${1:-$HOME/backups}"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_DIR="${BACKUP_PARENT_DIR}/db_backup_${TIMESTAMP}"
BACKUP_ARCHIVE="${BACKUP_DIR}.tar.gz"
RETENTION_DAYS=7

# Colors for output
GREEN='\033[032m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=====================================================${NC}"
echo -e "${YELLOW}📦 Starting MongoDB Automated Backup: ${DB_NAME}${NC}"
echo -e "${YELLOW}=====================================================${NC}"

# 1. Check if Docker container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${RED}❌ Error: MongoDB container '${CONTAINER_NAME}' is not running!${NC}"
    exit 1
fi

# 2. Create local backup directory
mkdir -p "${BACKUP_PARENT_DIR}"
mkdir -p "${BACKUP_DIR}"

# 3. Execute mongodump inside container
echo -e "🔄 Dumping database '${DB_NAME}' from container '${CONTAINER_NAME}'..."
docker exec "${CONTAINER_NAME}" mongodump --db "${DB_NAME}" --out "/tmp/dump_${TIMESTAMP}"

# 4. Copy dump from container to host
echo -e "📥 Copying dump to host directory..."
docker cp "${CONTAINER_NAME}:/tmp/dump_${TIMESTAMP}/${DB_NAME}" "${BACKUP_DIR}/"

# 5. Clean up temporary dump inside container
docker exec "${CONTAINER_NAME}" rm -rf "/tmp/dump_${TIMESTAMP}"

# 6. Compress the backup archive
echo -e "🗜️  Compressing backup to ${BACKUP_ARCHIVE}..."
tar -czf "${BACKUP_ARCHIVE}" -C "${BACKUP_PARENT_DIR}" "db_backup_${TIMESTAMP}"
rm -rf "${BACKUP_DIR}"

# 7. Calculate and display backup size
BACKUP_SIZE=$(du -h "${BACKUP_ARCHIVE}" | cut -f1)
echo -e "${GREEN}✅ Backup created successfully: ${BACKUP_ARCHIVE} (Size: ${BACKUP_SIZE})${NC}"

# 8. Clean up backups older than RETENTION_DAYS to save disk space
echo -e "🧹 Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_PARENT_DIR}" -type f -name "db_backup_*.tar.gz" -mtime +${RETENTION_DAYS} -exec rm -f {} \;

echo -e "${GREEN}✨ Database backup process completed!${NC}"
