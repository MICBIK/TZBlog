-- Migration Rollback: Remove schema optimizations
-- Purpose: Rollback for 000003_optimize_schema.up.sql
-- Created: 2026-06-14

-- ============================================================================
-- PHASE 6: Drop Partial Indexes
-- ============================================================================

DROP INDEX IF EXISTS idx_subscriptions_unverified;
DROP INDEX IF EXISTS idx_comments_pending;
DROP INDEX IF EXISTS idx_users_unverified;
DROP INDEX IF EXISTS idx_articles_drafts;

-- ============================================================================
-- PHASE 5: Drop Covering Indexes
-- ============================================================================

DROP INDEX IF EXISTS idx_comments_count_covering;
DROP INDEX IF EXISTS idx_users_lookup_covering;
DROP INDEX IF EXISTS idx_articles_list_covering;

-- ============================================================================
-- PHASE 4: Drop Advanced Composite Indexes
-- ============================================================================

DROP INDEX IF EXISTS idx_subscriptions_status_verified;
DROP INDEX IF EXISTS idx_users_role_status;
DROP INDEX IF EXISTS idx_users_status_created;
DROP INDEX IF EXISTS idx_article_tags_tag_article;
DROP INDEX IF EXISTS idx_likes_target_type_date;
DROP INDEX IF EXISTS idx_article_views_session_date;
DROP INDEX IF EXISTS idx_article_views_article_date;
DROP INDEX IF EXISTS idx_comments_user_status_created;
DROP INDEX IF EXISTS idx_comments_article_status_created;
DROP INDEX IF EXISTS idx_articles_status_published_created;
DROP INDEX IF EXISTS idx_articles_author_status_published;
DROP INDEX IF EXISTS idx_articles_category_status_views;

-- ============================================================================
-- PHASE 3: Revert Data Type Changes
-- ============================================================================
-- Note: Reverting to TEXT types (original GORM defaults)

-- Likes table
ALTER TABLE likes
    ALTER COLUMN target_type TYPE TEXT;

-- Subscriptions table
ALTER TABLE subscriptions
    ALTER COLUMN email TYPE TEXT,
    ALTER COLUMN token TYPE TEXT;

-- Comments table
ALTER TABLE comments
    ALTER COLUMN status TYPE TEXT;

-- Tags table
ALTER TABLE tags
    ALTER COLUMN name TYPE TEXT,
    ALTER COLUMN slug TYPE TEXT;

-- Users table
ALTER TABLE users
    ALTER COLUMN username TYPE TEXT,
    ALTER COLUMN email TYPE TEXT,
    ALTER COLUMN display_name TYPE TEXT,
    ALTER COLUMN bio TYPE TEXT,
    ALTER COLUMN avatar_url TYPE TEXT,
    ALTER COLUMN role TYPE TEXT,
    ALTER COLUMN status TYPE TEXT;

-- Articles table
ALTER TABLE articles
    ALTER COLUMN title TYPE TEXT,
    ALTER COLUMN slug TYPE TEXT,
    ALTER COLUMN summary TYPE TEXT,
    ALTER COLUMN cover_image TYPE TEXT,
    ALTER COLUMN status TYPE TEXT;

-- ============================================================================
-- PHASE 2: Drop CHECK Constraints
-- ============================================================================

ALTER TABLE likes DROP CONSTRAINT IF EXISTS chk_likes_target_type;
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS chk_subscriptions_status;
ALTER TABLE comments DROP CONSTRAINT IF EXISTS chk_comments_status;
ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_role;
ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_status;
ALTER TABLE articles DROP CONSTRAINT IF EXISTS chk_articles_comment_count;
ALTER TABLE articles DROP CONSTRAINT IF EXISTS chk_articles_like_count;
ALTER TABLE articles DROP CONSTRAINT IF EXISTS chk_articles_view_count;
ALTER TABLE articles DROP CONSTRAINT IF EXISTS chk_articles_reading_time;
ALTER TABLE articles DROP CONSTRAINT IF EXISTS chk_articles_status;
ALTER TABLE follows DROP CONSTRAINT IF EXISTS chk_follows_not_self;

-- ============================================================================
-- PHASE 1: Drop Foreign Key Constraints
-- ============================================================================

-- Reading progress table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reading_progress') THEN
        ALTER TABLE reading_progress DROP CONSTRAINT IF EXISTS fk_reading_progress_user;
        ALTER TABLE reading_progress DROP CONSTRAINT IF EXISTS fk_reading_progress_article;
    END IF;
END $$;

-- Article views table
ALTER TABLE article_views DROP CONSTRAINT IF EXISTS fk_article_views_article;

-- Follows table
ALTER TABLE follows DROP CONSTRAINT IF EXISTS fk_follows_following;
ALTER TABLE follows DROP CONSTRAINT IF EXISTS fk_follows_follower;

-- Article tags junction table
ALTER TABLE article_tags DROP CONSTRAINT IF EXISTS fk_article_tags_tag;
ALTER TABLE article_tags DROP CONSTRAINT IF EXISTS fk_article_tags_article;

-- Likes table
ALTER TABLE likes DROP CONSTRAINT IF EXISTS fk_likes_user;

-- Comments table
ALTER TABLE comments DROP CONSTRAINT IF EXISTS fk_comments_parent;
ALTER TABLE comments DROP CONSTRAINT IF EXISTS fk_comments_user;
ALTER TABLE comments DROP CONSTRAINT IF EXISTS fk_comments_article;

-- Articles table
ALTER TABLE articles DROP CONSTRAINT IF EXISTS fk_articles_category;
ALTER TABLE articles DROP CONSTRAINT IF EXISTS fk_articles_author;
