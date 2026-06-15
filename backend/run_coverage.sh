#!/bin/bash

echo "=========================================="
echo "Running tests with coverage..."
echo "=========================================="

cd /Users/baihaibin/Documents/WorkSpares/TZBlog/backend

# Run tests with coverage
go test -coverprofile=coverage.out ./... 2>&1 | tee test_output.txt

echo ""
echo "=========================================="
echo "Coverage Summary"
echo "=========================================="

# Get overall coverage
go tool cover -func=coverage.out | grep total | awk '{print "Total Coverage: " $3}'

echo ""
echo "=========================================="
echo "Module Coverage Breakdown"
echo "=========================================="

# Show coverage by package
go tool cover -func=coverage.out | grep -E "(internal/api/middleware|internal/repository/postgres|internal/cache|internal/domain|pkg/errors)" | awk '{print $1 " " $3}' | sort -t: -k1 | head -30

echo ""
echo "=========================================="
echo "Test Results Summary"
echo "=========================================="

# Count pass/fail
grep -E "^(PASS|FAIL|ok|FAIL)" test_output.txt | tail -20

echo ""
echo "Test run complete!"
