-- Convert likes table to polymorphic structure
-- Drop old unique constraint and indexes
DROP INDEX IF EXISTS idx_article_user;

-- Rename article_id to target_id and add target_type
ALTER TABLE likes
  RENAME COLUMN article_id TO target_id;

ALTER TABLE likes
  ADD COLUMN target_type VARCHAR(20) NOT NULL DEFAULT 'article';

-- Create new unique constraint
ALTER TABLE likes
  ADD CONSTRAINT unique_user_target UNIQUE (user_id, target_type, target_id);

-- Create new indexes for efficient queries
CREATE INDEX idx_likes_user ON likes(user_id);
CREATE INDEX idx_likes_target ON likes(target_type, target_id);

-- Add comment for documentation
COMMENT ON COLUMN likes.target_type IS 'Type of entity being liked: article, comment';
COMMENT ON COLUMN likes.target_id IS 'ID of the entity being liked';
