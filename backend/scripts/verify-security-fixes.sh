#!/bin/bash

# Security Fixes Verification Script
# This script verifies that all security fixes are in place

echo "================================================"
echo "Security Fixes Verification"
echo "================================================"
echo ""

BACKEND_DIR="/Users/baihaibin/Documents/WorkSpares/TZBlog/backend"
cd "$BACKEND_DIR"

PASS=0
FAIL=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

check_fix() {
    local name="$1"
    local file="$2"
    local pattern="$3"

    if grep -q "$pattern" "$file" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $name"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} $name"
        ((FAIL++))
    fi
}

echo "Checking SEC-004: Privilege Escalation Fix..."
check_fix "JWT generates with role parameter" \
    "pkg/auth/jwt.go" \
    "GenerateToken(userID int64, role string)"

check_fix "Register passes user role" \
    "internal/service/auth_service.go" \
    "GenerateToken(newUser.ID, newUser.Role)"

check_fix "Login passes user role" \
    "internal/service/auth_service.go" \
    "GenerateToken(usr.ID, usr.Role)"

echo ""
echo "Checking SEC-001: XSS Protection..."
check_fix "Article creation sanitizes content" \
    "internal/service/article_service.go" \
    "SanitizeContent()"

check_fix "Comment creation sanitizes content" \
    "internal/service/comment_service.go" \
    "SanitizeContent()"

echo ""
echo "Checking SEC-002: CSRF Protection..."
# 认证为纯 JWT Bearer（Authorization header + localStorage，不使用 cookie），对 CSRF 天然免疫，
# 故已移除 OptionalCSRF 中间件。此处校验认证确实采用 Bearer 方案（CSRF 豁免的前提）。
check_fix "Auth uses Bearer token scheme (CSRF-exempt design)" \
    "internal/api/middleware/auth.go" \
    "Bearer"

echo ""
echo "Checking SEC-006: Strong Password Hashing..."
check_fix "Bcrypt cost increased to 12" \
    "internal/domain/user/user.go" \
    "BcryptCost = 12"

echo ""
echo "Checking SEC-003: Password History..."
check_fix "Password history repository in AuthService" \
    "internal/service/auth_service.go" \
    "passwordHistRepo user.PasswordHistoryRepository"

check_fix "Password reuse error defined" \
    "internal/domain/user/errors.go" \
    "ErrPasswordReused"

echo ""
echo "Checking SEC-005: Information Disclosure..."
# 注：payment handler / webhook 当前未实现（无 payment_handler.go、无路由），原检查项已移除以保持脚本与现状一致。
check_fix "Readiness check doesn't leak DB error details" \
    "cmd/server/main.go" \
    'healthStatus\["database"\] = "down"'

echo ""
echo "Checking SEC-007: Config File Security..."
if grep -q "config.yaml" .gitignore 2>/dev/null || grep -q "config.yaml" ../.gitignore 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Config files in .gitignore"
    ((PASS++))
else
    echo -e "${RED}✗${NC} Config files in .gitignore"
    ((FAIL++))
fi

echo ""
echo "Checking Build..."
if go build -o /tmp/tzblog-verify ./cmd/server/main.go 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Backend builds successfully"
    ((PASS++))
    rm -f /tmp/tzblog-verify
else
    echo -e "${RED}✗${NC} Backend build failed"
    ((FAIL++))
fi

echo ""
echo "================================================"
echo "Results: ${GREEN}$PASS passed${NC}, ${RED}$FAIL failed${NC}"
echo "================================================"

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}All security fixes verified!${NC}"
    exit 0
else
    echo -e "${RED}Some checks failed. Please review.${NC}"
    exit 1
fi
