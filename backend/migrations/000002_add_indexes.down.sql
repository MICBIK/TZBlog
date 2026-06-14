-- Migration Rollback: Remove performance optimization indexes
-- Purpose: Rollback for 000002_add_indexes.up.sql
-- Created: 2026-06-14

-- Drop Articles indexes
DROP INDEX IF EXISTS idx_articles_status_created;
DROP INDEX IF EXISTS idx_articles_author_created;
DROP INDEX IF EXISTS idx_articles_slug;
DROP INDEX IF EXISTS idx_articles_view_count;
DROP INDEX IF EXISTS idx_articles_published;

-- Drop Comments indexes
DROP INDEX IF EXISTS idx_comments_article_created;
DROP INDEX IF EXISTS idx_comments_user_created;
DROP INDEX IF EXISTS idx_comments_parent;

-- Drop Views indexes
DROP INDEX IF EXISTS idx_article_views_article_created;
DROP INDEX IF EXISTS idx_article_views_article_ip;

-- Drop Likes indexes
DROP INDEX IF EXISTS idx_likes_target_user;
DROP INDEX IF EXISTS idx_likes_user_type;

-- Drop Article Tags indexes
DROP INDEX IF EXISTS idx_article_tags_tag;
DROP INDEX IF EXISTS idx_article_tags_article;

-- Drop Tags indexes
DROP INDEX IF EXISTS idx_tags_slug;
DROP INDEX IF EXISTS idx_tags_name;

-- Drop Users indexes
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_username;

-- Drop Follows indexes
DROP INDEX IF EXISTS idx_follows_follower_following;
DROP INDEX IF EXISTS idx_follows_following;

-- Drop Subscriptions indexes
DROP INDEX IF EXISTS idx_subscriptions_user_status;
DROP INDEX IF EXISTS idx_subscriptions_status_end;

-- Drop Orders indexes
DROP INDEX IF EXISTS idx_orders_user_created;
DROP INDEX IF EXISTS idx_orders_status;
DROP INDEX IF EXISTS idx_orders_number;
