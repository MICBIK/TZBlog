-- Migration Rollback: Drop all tables
-- Purpose: Rollback for 000001_initial_schema.up.sql
-- Created: 2026-06-14

-- Drop tables in reverse order to avoid foreign key issues
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS reading_progress;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS follows;
DROP TABLE IF EXISTS article_views;
DROP TABLE IF EXISTS likes;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS article_tags;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS articles;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;
