#!/bin/bash

# Database restore script for TZBlog
# Usage: ./restore.sh <backup_file>

set -eo pipefail

# Load environment variables
source ../.env

if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    echo "Available backups:"
    ls -lh /backup/*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "WARNING: This will restore the database from: $BACKUP_FILE"
echo "Current database '$DB_NAME' will be dropped and recreated!"
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

echo "Starting restore at $(date)"

# Drop existing database
echo "Dropping existing database..."
PGPASSWORD="$DB_PASSWORD" psql -h localhost -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"

# Create new database
echo "Creating new database..."
PGPASSWORD="$DB_PASSWORD" psql -h localhost -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;"

# Restore backup
# 备份由 pg_dump --format=custom 生成（外层再经 gzip 压缩），必须用 pg_restore 恢复——
# psql 只能执行纯 SQL 文本，无法读取 custom 二进制格式。
echo "Restoring backup..."
if gunzip -c "$BACKUP_FILE" | PGPASSWORD="$DB_PASSWORD" pg_restore \
    -h localhost \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --no-owner \
    --no-acl; then
    echo "Restore completed successfully at $(date)"

    # Verify restore
    echo "Verifying restore..."
    TABLE_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h localhost -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';")
    echo "Tables restored: $TABLE_COUNT"
else
    echo "Restore failed!" >&2
    exit 1
fi
