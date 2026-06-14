-- Migration: Add is_premium column to articles table
-- This fixes D1: articles table missing is_premium column

-- Add is_premium column (defaults to false for existing records)
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT FALSE;

-- Add index for premium articles queries
CREATE INDEX IF NOT EXISTS idx_articles_is_premium ON articles(is_premium);

-- Add comment
COMMENT ON COLUMN articles.is_premium IS 'Whether this article requires premium subscription';
