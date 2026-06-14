-- Migration Rollback: Fix Critical Database Issues
-- Purpose: Remove tables and constraints added in 000004_fix_critical_issues.up.sql
-- Created: 2026-06-14

-- ============================================================================
-- PART 1: Drop Foreign Key Constraints
-- ============================================================================

-- Drop orders foreign key constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_orders_user;

-- ============================================================================
-- PART 2: Drop Tables (in reverse dependency order)
-- ============================================================================

-- Drop audit_logs table
DROP TABLE IF EXISTS audit_logs;

-- Drop password_history table
DROP TABLE IF EXISTS password_history;

-- Drop api_keys table
DROP TABLE IF EXISTS api_keys;

-- ============================================================================
-- Rollback Summary
-- ============================================================================
-- Tables dropped:
--   1. audit_logs
--   2. password_history
--   3. api_keys
--
-- Constraints removed:
--   1. fk_orders_user from orders table
--
-- Note: All indexes are automatically dropped with their tables
