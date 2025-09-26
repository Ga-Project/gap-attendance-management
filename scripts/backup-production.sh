#!/bin/bash
set -e

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

# Configuration
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="attendance_backup_${DATE}.sql"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "🗄️ Starting database backup..."

# Create database backup
docker-compose -f docker-compose.prod.yml exec -T db pg_dump \
    -U "${POSTGRES_USER:-postgres}" \
    -d "${POSTGRES_DB:-attendance_production}" \
    --no-owner --no-privileges > "$BACKUP_DIR/$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_DIR/$BACKUP_FILE"
BACKUP_FILE="${BACKUP_FILE}.gz"

echo "✅ Backup created: $BACKUP_DIR/$BACKUP_FILE"

# Clean up old backups
echo "🧹 Cleaning up old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "attendance_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "📊 Current backups:"
ls -lh "$BACKUP_DIR"/attendance_backup_*.sql.gz 2>/dev/null || echo "No backups found"

echo "✅ Backup process completed!"