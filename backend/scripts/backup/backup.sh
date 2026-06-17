#!/bin/bash

# Database backup script for TZBlog
# Usage: ./backup.sh [daily|weekly|monthly]

set -eo pipefail

# Load environment variables
source ../.env

# Configuration
BACKUP_DIR="/backup"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_TYPE=${1:-daily}
RETENTION_DAYS=7

if [ "$BACKUP_TYPE" = "weekly" ]; then
    RETENTION_DAYS=30
elif [ "$BACKUP_TYPE" = "monthly" ]; then
    RETENTION_DAYS=90
fi

BACKUP_FILE="${BACKUP_DIR}/${BACKUP_TYPE}_${TIMESTAMP}.sql.gz"

echo "Starting ${BACKUP_TYPE} backup at $(date)"

# Create backup directory if not exists
mkdir -p "$BACKUP_DIR"

# Perform backup
# pipefail 已开启：管道中 pg_dump 失败会被捕获（不再只看末端 gzip 的退出码）。
# 用 if 包裹，避免 set -e 在管道失败时直接终止、跳过下面的错误提示与清理。
if PGPASSWORD="$DB_PASSWORD" pg_dump \
    -h localhost \
    -p 5432 \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --format=custom \
    --compress=9 \
    --no-owner \
    --no-acl \
    | gzip > "$BACKUP_FILE"; then
    echo "Backup completed successfully: $BACKUP_FILE"
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "Backup size: $BACKUP_SIZE"
else
    echo "Backup failed!" >&2
    rm -f "$BACKUP_FILE"   # 清理可能写入的不完整备份文件
    exit 1
fi

# Remove old backups
echo "Cleaning up old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "${BACKUP_TYPE}_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

# Count remaining backups
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/${BACKUP_TYPE}_*.sql.gz 2>/dev/null | wc -l)
echo "Total ${BACKUP_TYPE} backups: $BACKUP_COUNT"

# Upload to cloud storage (optional)
if [ -n "$S3_BUCKET" ]; then
    echo "Uploading to S3..."
    aws s3 cp "$BACKUP_FILE" "s3://$S3_BUCKET/backups/postgres/" --storage-class STANDARD_IA
    echo "Uploaded to S3 successfully"
fi

echo "Backup process completed at $(date)"
