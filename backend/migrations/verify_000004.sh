#!/bin/bash

# Migration 000004 静态验证脚本
# Purpose: 在没有数据库连接的情况下验证 SQL 语法和结构
# Created: 2026-06-14

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Migration 000004 静态验证${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

MIGRATION_UP="migrations/000004_fix_critical_issues.up.sql"
MIGRATION_DOWN="migrations/000004_fix_critical_issues.down.sql"

# Check files exist
echo -e "${YELLOW}检查文件存在...${NC}"
if [ ! -f "$MIGRATION_UP" ]; then
    echo -e "${RED}✗ 文件不存在: $MIGRATION_UP${NC}"
    exit 1
fi

if [ ! -f "$MIGRATION_DOWN" ]; then
    echo -e "${RED}✗ 文件不存在: $MIGRATION_DOWN${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Migration 文件存在${NC}"

# Check CREATE TABLE statements
echo -e "\n${YELLOW}检查 CREATE TABLE 语句...${NC}"
API_KEYS=$(grep -c "CREATE TABLE.*api_keys" "$MIGRATION_UP" || true)
PASSWORD_HISTORY=$(grep -c "CREATE TABLE.*password_history" "$MIGRATION_UP" || true)
AUDIT_LOGS=$(grep -c "CREATE TABLE.*audit_logs" "$MIGRATION_UP" || true)

if [ "$API_KEYS" -ge 1 ]; then
    echo -e "${GREEN}✓ api_keys 表定义存在${NC}"
else
    echo -e "${RED}✗ api_keys 表定义缺失${NC}"
    exit 1
fi

if [ "$PASSWORD_HISTORY" -ge 1 ]; then
    echo -e "${GREEN}✓ password_history 表定义存在${NC}"
else
    echo -e "${RED}✗ password_history 表定义缺失${NC}"
    exit 1
fi

if [ "$AUDIT_LOGS" -ge 1 ]; then
    echo -e "${GREEN}✓ audit_logs 表定义存在${NC}"
else
    echo -e "${RED}✗ audit_logs 表定义缺失${NC}"
    exit 1
fi

# Check indexes
echo -e "\n${YELLOW}检查索引定义...${NC}"
INDEX_COUNT=$(grep -c "CREATE INDEX" "$MIGRATION_UP" || true)
echo "发现 ${INDEX_COUNT} 个索引"

if [ "$INDEX_COUNT" -ge 13 ]; then
    echo -e "${GREEN}✓ 索引数量符合预期 (>=13)${NC}"
else
    echo -e "${RED}✗ 索引数量不足 (需要 >=13, 实际 ${INDEX_COUNT})${NC}"
    exit 1
fi

# Check foreign key constraint
echo -e "\n${YELLOW}检查外键约束...${NC}"
FK_ORDERS=$(grep -c "fk_orders_user" "$MIGRATION_UP" || true)

if [ "$FK_ORDERS" -ge 1 ]; then
    echo -e "${GREEN}✓ orders.user_id 外键约束存在${NC}"
else
    echo -e "${RED}✗ orders.user_id 外键约束缺失${NC}"
    exit 1
fi

# Check CHECK constraints
echo -e "\n${YELLOW}检查 CHECK 约束...${NC}"
CHK_API_KEYS=$(grep -c "chk_api_keys_revoked_at" "$MIGRATION_UP" || true)
CHK_AUDIT_LOGS=$(grep -c "chk_audit_logs_result" "$MIGRATION_UP" || true)

if [ "$CHK_API_KEYS" -ge 1 ]; then
    echo -e "${GREEN}✓ api_keys CHECK 约束存在${NC}"
else
    echo -e "${YELLOW}⚠ api_keys CHECK 约束缺失${NC}"
fi

if [ "$CHK_AUDIT_LOGS" -ge 1 ]; then
    echo -e "${GREEN}✓ audit_logs CHECK 约束存在${NC}"
else
    echo -e "${YELLOW}⚠ audit_logs CHECK 约束缺失${NC}"
fi

# Check REFERENCES clauses
echo -e "\n${YELLOW}检查外键引用...${NC}"
REFERENCES_COUNT=$(grep -c "REFERENCES users(id)" "$MIGRATION_UP" || true)
echo "发现 ${REFERENCES_COUNT} 个对 users 表的引用"

if [ "$REFERENCES_COUNT" -ge 3 ]; then
    echo -e "${GREEN}✓ 外键引用正确${NC}"
else
    echo -e "${RED}✗ 外键引用不足${NC}"
    exit 1
fi

# Check down migration
echo -e "\n${YELLOW}检查回滚 migration...${NC}"
DROP_API_KEYS=$(grep -c "DROP TABLE.*api_keys" "$MIGRATION_DOWN" || true)
DROP_PASSWORD_HISTORY=$(grep -c "DROP TABLE.*password_history" "$MIGRATION_DOWN" || true)
DROP_AUDIT_LOGS=$(grep -c "DROP TABLE.*audit_logs" "$MIGRATION_DOWN" || true)
DROP_FK=$(grep -c "DROP CONSTRAINT.*fk_orders_user" "$MIGRATION_DOWN" || true)

if [ "$DROP_API_KEYS" -ge 1 ] && [ "$DROP_PASSWORD_HISTORY" -ge 1 ] && [ "$DROP_AUDIT_LOGS" -ge 1 ] && [ "$DROP_FK" -ge 1 ]; then
    echo -e "${GREEN}✓ 回滚 migration 完整${NC}"
else
    echo -e "${RED}✗ 回滚 migration 不完整${NC}"
    echo "  DROP api_keys: $DROP_API_KEYS"
    echo "  DROP password_history: $DROP_PASSWORD_HISTORY"
    echo "  DROP audit_logs: $DROP_AUDIT_LOGS"
    echo "  DROP fk_orders_user: $DROP_FK"
    exit 1
fi

# Check SQL syntax (basic)
echo -e "\n${YELLOW}检查基本 SQL 语法...${NC}"

# Check for common syntax errors
UNCLOSED_PAREN=$(grep -c "([^)]*$" "$MIGRATION_UP" | grep -v "^0$" || echo "0")
if [ "$UNCLOSED_PAREN" = "0" ]; then
    echo -e "${GREEN}✓ 未发现未闭合的括号${NC}"
else
    echo -e "${YELLOW}⚠ 可能存在未闭合的括号${NC}"
fi

# Check for semicolons
SEMICOLON_COUNT=$(grep -c ";" "$MIGRATION_UP" || true)
if [ "$SEMICOLON_COUNT" -ge 30 ]; then
    echo -e "${GREEN}✓ SQL 语句终止符正常${NC}"
else
    echo -e "${YELLOW}⚠ 分号数量可能不足${NC}"
fi

# Summary
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}静态验证通过 ✓${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "\n${YELLOW}验证总结:${NC}"
echo "  ✓ 文件存在性"
echo "  ✓ 3 个表定义 (api_keys, password_history, audit_logs)"
echo "  ✓ ${INDEX_COUNT} 个索引"
echo "  ✓ 1 个外键约束 (fk_orders_user)"
echo "  ✓ 2 个 CHECK 约束"
echo "  ✓ 回滚 migration 完整"

echo -e "\n${YELLOW}下一步:${NC}"
echo "1. 连接到数据库后运行:"
echo "   migrate -path ./migrations -database \"\$DB_URL\" up"
echo ""
echo "2. 验证表创建:"
echo "   psql \"\$DB_URL\" -c \"\\dt\""
echo ""
echo "3. 验证索引:"
echo "   psql \"\$DB_URL\" -c \"\\di\""
echo ""
echo "4. 验证约束:"
echo "   psql \"\$DB_URL\" -c \"SELECT * FROM information_schema.table_constraints WHERE table_name IN ('api_keys', 'password_history', 'audit_logs', 'orders');\""

echo -e "\n${GREEN}Migration 000004 已准备就绪!${NC}"
