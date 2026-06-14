-- Migration rollback: Remove is_premium column from articles table

-- Drop index
DROP INDEX IF EXISTS idx_articles_is_premium;

-- Drop column
ALTER TABLE articles
DROP COLUMN IF EXISTS is_premium;
