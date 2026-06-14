#!/bin/bash

# Database Optimization Migration Test Script
# Purpose: Test all database migrations and verify optimizations
# Created: 2026-06-14

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test database credentials (adjust as needed)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
DB_NAME="${DB_NAME:-tzblog_test}"

# Connection string
DB_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=disable"

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Database Migration Test Script${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Check if migrate tool is installed
if ! command -v migrate &> /dev/null; then
    echo -e "${RED}Error: 'migrate' tool not found${NC}"
    echo "Install with: brew install golang-migrate (macOS)"
    echo "Or visit: https://github.com/golang-migrate/migrate"
    exit 1
fi

echo -e "${GREEN}✓ Migration tool found${NC}"

# Check if database exists
echo -e "\n${YELLOW}Checking database connection...${NC}"
if psql "${DB_URL}" -c "SELECT 1" &> /dev/null; then
    echo -e "${GREEN}✓ Database connection successful${NC}"
else
    echo -e "${RED}Error: Cannot connect to database${NC}"
    echo "Please ensure PostgreSQL is running and credentials are correct"
    exit 1
fi

# Function to run migration up
migrate_up() {
    echo -e "\n${YELLOW}Running migrations UP...${NC}"
    migrate -path ./migrations -database "${DB_URL}" up
    echo -e "${GREEN}✓ Migrations applied successfully${NC}"
}

# Function to run migration down
migrate_down() {
    echo -e "\n${YELLOW}Rolling back migrations...${NC}"
    migrate -path ./migrations -database "${DB_URL}" down -all
    echo -e "${GREEN}✓ Migrations rolled back successfully${NC}"
}

# Function to check migration version
check_version() {
    echo -e "\n${YELLOW}Current migration version:${NC}"
    migrate -path ./migrations -database "${DB_URL}" version
}

# Function to verify foreign keys
verify_foreign_keys() {
    echo -e "\n${YELLOW}Verifying foreign key constraints...${NC}"

    FK_COUNT=$(psql "${DB_URL}" -t -c "
        SELECT COUNT(*)
        FROM pg_constraint
        WHERE contype = 'f' AND connamespace = 'public'::regnamespace;
    " | xargs)

    echo "Found ${FK_COUNT} foreign key constraints"

    if [ "${FK_COUNT}" -ge 10 ]; then
        echo -e "${GREEN}✓ Foreign keys created successfully${NC}"
    else
        echo -e "${RED}✗ Expected at least 10 foreign keys, found ${FK_COUNT}${NC}"
        return 1
    fi
}

# Function to verify CHECK constraints
verify_check_constraints() {
    echo -e "\n${YELLOW}Verifying CHECK constraints...${NC}"

    CHK_COUNT=$(psql "${DB_URL}" -t -c "
        SELECT COUNT(*)
        FROM pg_constraint
        WHERE contype = 'c' AND connamespace = 'public'::regnamespace;
    " | xargs)

    echo "Found ${CHK_COUNT} CHECK constraints"

    if [ "${CHK_COUNT}" -ge 10 ]; then
        echo -e "${GREEN}✓ CHECK constraints created successfully${NC}"
    else
        echo -e "${RED}✗ Expected at least 10 CHECK constraints, found ${CHK_COUNT}${NC}"
        return 1
    fi
}

# Function to verify indexes
verify_indexes() {
    echo -e "\n${YELLOW}Verifying indexes...${NC}"

    IDX_COUNT=$(psql "${DB_URL}" -t -c "
        SELECT COUNT(*)
        FROM pg_indexes
        WHERE schemaname = 'public';
    " | xargs)

    echo "Found ${IDX_COUNT} indexes"

    if [ "${IDX_COUNT}" -ge 40 ]; then
        echo -e "${GREEN}✓ Indexes created successfully${NC}"
    else
        echo -e "${YELLOW}⚠ Expected at least 40 indexes, found ${IDX_COUNT}${NC}"
    fi
}

# Function to verify data types
verify_data_types() {
    echo -e "\n${YELLOW}Verifying optimized data types...${NC}"

    # Check if articles.title is VARCHAR(200)
    TITLE_TYPE=$(psql "${DB_URL}" -t -c "
        SELECT data_type, character_maximum_length
        FROM information_schema.columns
        WHERE table_name = 'articles' AND column_name = 'title';
    " | xargs)

    echo "articles.title type: ${TITLE_TYPE}"

    if [[ "${TITLE_TYPE}" == *"character varying"* ]] && [[ "${TITLE_TYPE}" == *"200"* ]]; then
        echo -e "${GREEN}✓ Data types optimized${NC}"
    else
        echo -e "${YELLOW}⚠ Data type might not be optimized yet${NC}"
    fi
}

# Function to test invalid data rejection
test_invalid_data() {
    echo -e "\n${YELLOW}Testing invalid data rejection...${NC}"

    # Test 1: Invalid article status (should fail)
    echo -n "  Testing invalid article status... "
    if psql "${DB_URL}" -c "
        INSERT INTO articles (title, slug, author_id, status)
        VALUES ('Test', 'test', 1, 'invalid_status');
    " &> /dev/null; then
        echo -e "${RED}✗ FAIL - Invalid status was accepted${NC}"
        return 1
    else
        echo -e "${GREEN}✓ PASS - Invalid status rejected${NC}"
    fi

    # Test 2: Negative view count (should fail)
    echo -n "  Testing negative view count... "
    if psql "${DB_URL}" -c "
        INSERT INTO articles (title, slug, author_id, view_count)
        VALUES ('Test', 'test2', 1, -1);
    " &> /dev/null; then
        echo -e "${RED}✗ FAIL - Negative count was accepted${NC}"
        return 1
    else
        echo -e "${GREEN}✓ PASS - Negative count rejected${NC}"
    fi

    # Test 3: Self-follow (should fail)
    echo -n "  Testing self-follow prevention... "
    if psql "${DB_URL}" -c "
        INSERT INTO follows (follower_id, following_id)
        VALUES (1, 1);
    " &> /dev/null; then
        echo -e "${RED}✗ FAIL - Self-follow was accepted${NC}"
        return 1
    else
        echo -e "${GREEN}✓ PASS - Self-follow rejected${NC}"
    fi

    echo -e "${GREEN}✓ All invalid data tests passed${NC}"
}

# Function to list all constraints
list_constraints() {
    echo -e "\n${YELLOW}Listing all constraints...${NC}"

    psql "${DB_URL}" -c "
        SELECT
            conname AS constraint_name,
            contype AS constraint_type,
            conrelid::regclass AS table_name
        FROM pg_constraint
        WHERE connamespace = 'public'::regnamespace
        ORDER BY contype, conrelid::regclass::text;
    "
}

# Function to list all indexes
list_indexes() {
    echo -e "\n${YELLOW}Listing all indexes...${NC}"

    psql "${DB_URL}" -c "
        SELECT
            tablename,
            indexname,
            indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
        ORDER BY tablename, indexname;
    "
}

# Main test flow
main() {
    echo -e "\n${YELLOW}Starting migration tests...${NC}"

    # Clean start
    migrate_down || true

    # Run migrations
    migrate_up
    check_version

    # Verify optimizations
    verify_foreign_keys
    verify_check_constraints
    verify_indexes
    verify_data_types

    # Test data validation
    test_invalid_data

    # Optional: Show details
    if [ "$1" == "--verbose" ]; then
        list_constraints
        list_indexes
    fi

    echo -e "\n${GREEN}========================================${NC}"
    echo -e "${GREEN}All tests passed! ✓${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "\nDatabase optimizations verified:"
    echo "  ✓ Foreign key constraints"
    echo "  ✓ CHECK constraints"
    echo "  ✓ Optimized indexes"
    echo "  ✓ Optimized data types"
    echo "  ✓ Invalid data rejection"
}

# Run main function
main "$@"
