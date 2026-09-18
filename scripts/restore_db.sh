#!/bin/bash

# ==============================================================================
# Database Restore Script for MongoDB
# CV-Job Matching Platform
#
# Usage:
#   ./scripts/restore_db.sh [PATH_TO_BACKUP_TAR_GZ]
# Example:
#   ./scripts/restore_db.sh ~/backups/db_backup_2026-09-18_10-00-00.tar.gz
# ==============================================================================

set -e

# Configuration
CONTAINER_NAME="${MONGO_CONTAINER:-cv-mongodb-prod}"
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    if docker ps --format '{{.Names}}' | grep -q "^mongodb$"; then
        CONTAINER_NAME="mongodb"
    fi
fi

DB_NAME="${DB_NAME:-cv_project_db}"
BACKUP_PARENT_DIR="$HOME/backups"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Determine backup file
BACKUP_INPUT="$1"
BACKUP_PARENT_DIR="${BACKUP_DIR:-$HOME/backups}"

if [ -n "${BACKUP_INPUT}" ] && [ -d "${BACKUP_INPUT}" ]; then
    BACKUP_PARENT_DIR="${BACKUP_INPUT}"
    BACKUP_FILE=""
elif [ -n "${BACKUP_INPUT}" ] && [ -f "${BACKUP_INPUT}" ]; then
    BACKUP_FILE="${BACKUP_INPUT}"
else
    BACKUP_FILE=""
fi

if [ -z "${BACKUP_FILE}" ]; then
    echo -e "${YELLOW}🔍 Searching for latest backup in ${BACKUP_PARENT_DIR}...${NC}"
    BACKUP_FILE=$(find "${BACKUP_PARENT_DIR}" -type f -name "db_backup_*.tar.gz" 2>/dev/null | sort -r | head -n 1)
    
    if [ -z "${BACKUP_FILE}" ]; then
        echo -e "${RED}❌ Error: No backup files found in ${BACKUP_PARENT_DIR}!${NC}"
        echo -e "Usage: $0 [path_to_backup.tar.gz | backup_directory]"
        exit 1
    fi
    echo -e "${GREEN}👉 Selected latest backup: ${BACKUP_FILE}${NC}"
fi

if [ ! -f "${BACKUP_FILE}" ]; then
    echo -e "${RED}❌ Error: Backup file '${BACKUP_FILE}' does not exist!${NC}"
    exit 1
fi

echo -e "${YELLOW}=====================================================${NC}"
echo -e "${YELLOW}🔄 Starting Database Restore: ${DB_NAME}${NC}"
echo -e "${YELLOW}📁 From Archive: ${BACKUP_FILE}${NC}"
echo -e "${YELLOW}=====================================================${NC}"

# 2. Check if MongoDB container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${RED}❌ Error: MongoDB container '${CONTAINER_NAME}' is not running!${NC}"
    exit 1
fi

# 3. Create temporary directory for extraction
RESTORE_TMP="/tmp/restore_$(date +%s)"
mkdir -p "${RESTORE_TMP}"

echo -e "📦 Extracting backup archive..."
tar -xzf "${BACKUP_FILE}" -C "${RESTORE_TMP}"

# Find extracted database folder
EXTRACTED_FOLDER=$(find "${RESTORE_TMP}" -mindepth 1 -maxdepth 2 -type d -name "${DB_NAME}" | head -n 1)

if [ -z "${EXTRACTED_FOLDER}" ]; then
    # Fallback to looking for any directory with .bson files
    EXTRACTED_FOLDER=$(find "${RESTORE_TMP}" -type f -name "*.bson" -exec dirname {} \; | head -n 1)
fi

if [ -z "${EXTRACTED_FOLDER}" ]; then
    echo -e "${RED}❌ Error: Could not find valid BSON database dump in archive!${NC}"
    rm -rf "${RESTORE_TMP}"
    exit 1
fi

echo -e "📥 Copying backup files to container '${CONTAINER_NAME}'..."
docker cp "${EXTRACTED_FOLDER}" "${CONTAINER_NAME}:/tmp/restore_data"

# 4. Execute mongorestore with --drop to cleanly overwrite collections
echo -e "⚡ Restoring database '${DB_NAME}'..."
docker exec "${CONTAINER_NAME}" mongorestore --db "${DB_NAME}" --drop /tmp/restore_data

# 5. Clean up temporary files
echo -e "🧹 Cleaning up temporary files..."
docker exec "${CONTAINER_NAME}" rm -rf /tmp/restore_data
rm -rf "${RESTORE_TMP}"

echo -e "${GREEN}=====================================================${NC}"
echo -e "${GREEN}✅ Database restored successfully to '${DB_NAME}'!${NC}"
echo -e "${GREEN}=====================================================${NC}"
