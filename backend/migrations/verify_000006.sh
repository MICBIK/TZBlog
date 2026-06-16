#!/bin/bash
# Verify index usage with EXPLAIN ANALYZE
# Run this script after applying migration 000006

set -e

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-tzblog_dev}"
DB_USER="${DB_USER:-tzblog}"
DB_PASSWORD="${DB_PASSWORD:-tzblog}"

echo "=========================================="
echo "Index Verification Script"
echo "=========================================="
echo ""

# Function to run query and check for index usage
verify_query() {
    local query="$1"
    local expected_index="$2"
    local description="$3"

    echo "Test: $description"
    echo "Expected index: $expected_index"
    echo ""

    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "$query"

    echo ""
    echo "=========================================="
    echo ""
}

# Check if indexes exist
echo "1. Checking if new indexes exist..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'articles'
AND indexname IN ('idx_articles_status', 'idx_articles_created_at')
ORDER BY indexname;
"

echo ""
echo "=========================================="
echo ""

# Test 1: Status-only query
verify_query "
EXPLAIN ANALYZE
SELECT id, title, slug, status, created_at
FROM articles
WHERE status = 'published' AND deleted_at IS NULL
LIMIT 20;
" "idx_articles_status" "Query with status filter only"

# Test 2: Created_at-only query
verify_query "
EXPLAIN ANALYZE
SELECT id, title, slug, status, created_at
FROM articles
WHERE deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 20;
" "idx_articles_created_at" "Query with created_at ordering only"

# Test 3: Composite query
verify_query "
EXPLAIN ANALYZE
SELECT id, title, slug, status, created_at
FROM articles
WHERE status = 'published' AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 20;
" "idx_articles_status_created" "Query with status filter and created_at ordering"

echo "Verification complete!"
echo ""
echo "Look for 'Index Scan using idx_articles_XXX' in the output above."
echo "If you see 'Seq Scan', the index is not being used."
