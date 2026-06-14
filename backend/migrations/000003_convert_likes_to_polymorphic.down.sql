-- Revert likes table back to article-only structure
-- Drop polymorphic indexes
DROP INDEX IF EXISTS idx_likes_user;
DROP INDEX IF EXISTS idx_likes_target;

-- Drop unique constraint
ALTER TABLE likes
  DROP CONSTRAINT IF EXISTS unique_user_target;

-- Remove target_type column
ALTER TABLE likes
  DROP COLUMN IF EXISTS target_type;

-- Rename target_id back to article_id
ALTER TABLE likes
  RENAME COLUMN target_id TO article_id;

-- Recreate original unique index
CREATE UNIQUE INDEX idx_article_user ON likes(article_id, user_id);
