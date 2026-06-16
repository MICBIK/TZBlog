-- Rollback: Remove single-column indexes for articles table
-- This rollback is safe - composite index idx_articles_status_created still exists

DROP INDEX IF EXISTS idx_articles_status;
DROP INDEX IF EXISTS idx_articles_created_at;
