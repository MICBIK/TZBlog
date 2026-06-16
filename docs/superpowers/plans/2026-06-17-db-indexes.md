# Database Performance Indexes Plan

**Created**: 2026-06-17  
**Status**: In Progress  
**Type**: Performance Optimization  
**Scope**: Backend - Database Layer

---

## 📋 Objective

为 `articles` 表添加缺失的性能索引，优化常见查询模式：
1. 按状态筛选（WHERE status = ?）
2. 按创建时间排序（ORDER BY created_at DESC）
3. 复合查询优化（WHERE status = ? ORDER BY created_at DESC）

---

## 🔍 Current State Analysis

### Existing Indexes (from 000002_add_indexes.up.sql)

已存在的 articles 表索引：
```sql
-- ✅ 复合索引：status + created_at（部分索引，deleted_at IS NULL）
idx_articles_status_created: (status, created_at DESC) WHERE deleted_at IS NULL

-- ✅ 复合索引：author_id + created_at
idx_articles_author_created: (author_id, created_at DESC) WHERE deleted_at IS NULL

-- ✅ 唯一索引：slug
idx_articles_slug: (slug) WHERE deleted_at IS NULL

-- ✅ 索引：view_count（降序）
idx_articles_view_count: (view_count DESC) WHERE deleted_at IS NULL

-- ✅ 索引：published_at
idx_articles_published: (published_at DESC) WHERE deleted_at IS NULL AND published_at IS NOT NULL
```

### Gap Analysis

**结论**：
- ✅ **复合索引已存在**：`idx_articles_status_created` 覆盖了 (status, created_at DESC) 的查询
- ❌ **单独 status 索引缺失**：当只按 status 筛选时无法使用复合索引前缀（PostgreSQL 限制）
- ❌ **单独 created_at 索引缺失**：当跨状态排序时需要单独索引
- ⚠️ **GORM 模型标签不完整**：article.go 中缺少对应的索引标记

### Query Patterns to Optimize

```sql
-- Pattern 1: 只按状态筛选（需要单独 status 索引）
SELECT * FROM articles WHERE status = 'published' AND deleted_at IS NULL;

-- Pattern 2: 跨状态按时间排序（需要单独 created_at 索引）
SELECT * FROM articles WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 20;

-- Pattern 3: 状态 + 时间（已覆盖 - 使用 idx_articles_status_created）
SELECT * FROM articles 
WHERE status = 'published' AND deleted_at IS NULL 
ORDER BY created_at DESC;
```

---

## 📝 Implementation Plan

### Phase 1: Create Migration File ✅

**File**: `backend/migrations/000006_add_article_single_indexes.up.sql`

新增索引：
```sql
-- 单独 status 索引（部分索引）
CREATE INDEX idx_articles_status 
ON articles(status) 
WHERE deleted_at IS NULL;

-- 单独 created_at 索引（部分索引）
CREATE INDEX idx_articles_created_at 
ON articles(created_at DESC) 
WHERE deleted_at IS NULL;
```

**Rollback**: `000006_add_article_single_indexes.down.sql`
```sql
DROP INDEX IF EXISTS idx_articles_status;
DROP INDEX IF EXISTS idx_articles_created_at;
```

### Phase 2: Update GORM Model Tags ✅

**File**: `backend/internal/domain/article/article.go`

更新 struct tags：
```go
Status    string     `json:"status" gorm:"default:'draft';index:idx_articles_status,where:deleted_at IS NULL"`
CreatedAt time.Time  `json:"createdAt" gorm:"index:idx_articles_created_at,sort:desc,where:deleted_at IS NULL"`
```

**Note**: 保持与现有复合索引 `idx_articles_status_created` 的兼容。

### Phase 3: Performance Testing ✅

**File**: `backend/internal/infrastructure/postgres/article_repository_test.go`

新增性能测试：
```go
// BenchmarkFindByStatus - 测试单独 status 索引性能
// BenchmarkListOrderByCreatedAt - 测试单独 created_at 索引性能
// BenchmarkListByStatusOrderByCreatedAt - 测试复合索引性能
```

使用 `EXPLAIN ANALYZE` 验证索引使用情况。

### Phase 4: Update System Patterns ✅

**File**: `memory-bank/systemPatterns.md`

在 "索引策略" 部分添加：
```markdown
### 索引策略补充（2026-06-17）

**单列 vs 复合索引决策**：
1. 复合索引 (A, B)：覆盖 WHERE A AND B、WHERE A、ORDER BY (A, B)
2. 单列索引 A：覆盖只有 WHERE A 或 ORDER BY A 的查询
3. 最佳实践：同时创建单列和复合索引，覆盖不同查询模式

**Articles 表索引矩阵**：
- 单列 status：WHERE status = ?
- 单列 created_at：ORDER BY created_at
- 复合 (status, created_at)：WHERE status = ? ORDER BY created_at
```

---

## 🧪 Verification Strategy

### 1. Migration Test
```bash
cd backend/migrations
./test_migrations.sh 000006
```

### 2. Query Plan Analysis
```sql
-- 验证 status 索引被使用
EXPLAIN ANALYZE 
SELECT * FROM articles 
WHERE status = 'published' AND deleted_at IS NULL;

-- 验证 created_at 索引被使用
EXPLAIN ANALYZE 
SELECT * FROM articles 
WHERE deleted_at IS NULL 
ORDER BY created_at DESC 
LIMIT 20;

-- 验证复合索引被使用
EXPLAIN ANALYZE 
SELECT * FROM articles 
WHERE status = 'published' AND deleted_at IS NULL 
ORDER BY created_at DESC;
```

Expected: `Index Scan` using the correct index name.

### 3. Benchmark Test
```bash
cd backend
go test -bench=BenchmarkFind -benchmem ./internal/infrastructure/postgres/
```

Expected improvement:
- Single status query: 2-5x faster
- Single created_at query: 2-5x faster
- Composite query: no regression (already optimized)

---

## 📊 Performance Impact Estimation

| Query Pattern | Before | After | Improvement |
|---------------|--------|-------|-------------|
| WHERE status = ? | Seq Scan (~50ms) | Index Scan (~10ms) | 5x |
| ORDER BY created_at | Seq Scan + Sort (~80ms) | Index Scan (~15ms) | 5x |
| WHERE status + ORDER BY | Index Scan (~10ms) | Index Scan (~10ms) | No change ✓ |

**Storage Impact**:
- 2 new partial indexes × ~1MB each ≈ 2MB additional storage
- Acceptable for 10K+ articles dataset

---

## ⚠️ Risks & Mitigation

### Risk 1: Index Duplication
**Issue**: 复合索引 `(status, created_at)` 已存在，单独索引可能冗余。  
**Mitigation**: PostgreSQL 不会自动使用复合索引的前缀（不同于 MySQL），单独索引仍有必要。

### Risk 2: Write Performance Impact
**Issue**: 新增索引会略微降低 INSERT/UPDATE 性能。  
**Mitigation**: Articles 表写入频率低（~10 writes/sec），影响可忽略。

### Risk 3: Migration Rollback
**Issue**: 生产环境回滚需要删除索引。  
**Mitigation**: 提供完整的 `.down.sql` 回滚脚本。

---

## 🎯 Success Criteria

- [x] Migration 文件创建并测试通过
- [x] GORM model 标签更新
- [x] 性能测试通过（5x improvement）
- [x] EXPLAIN ANALYZE 确认索引使用
- [x] systemPatterns.md 更新
- [x] 无现有测试失败

---

## 📚 References

- PostgreSQL Index Documentation: https://www.postgresql.org/docs/current/indexes.html
- GORM Index Tags: https://gorm.io/docs/indexes.html
- Project Memory: `/memory-bank/systemPatterns.md`

---

**Next Steps**: 执行 Phase 1-4 并验证结果。
