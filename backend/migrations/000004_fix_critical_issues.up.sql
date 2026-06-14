-- Migration: Fix Critical Database Issues
-- Purpose: Create missing tables and fix foreign key constraints
-- Issues Fixed: C-011, C-012, C-014, C-015
-- Created: 2026-06-14

-- ============================================================================
-- PART 1: Create API Keys Table (C-011)
-- ============================================================================
-- Purpose: Manage API keys for programmatic access
-- Impact: Enables secure API authentication with revocation and expiration

CREATE TABLE IF NOT EXISTS api_keys (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    key_prefix VARCHAR(20) NOT NULL,
    key_hash VARCHAR(128) NOT NULL UNIQUE,
    permissions TEXT[],
    is_revoked BOOLEAN DEFAULT false,
    revoked_at TIMESTAMP,
    expires_at TIMESTAMP,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for API keys table
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_expires_at ON api_keys(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_api_keys_revoked ON api_keys(is_revoked) WHERE is_revoked = false;

-- Check constraint for API keys
ALTER TABLE api_keys
    ADD CONSTRAINT chk_api_keys_revoked_at
    CHECK ((is_revoked = true AND revoked_at IS NOT NULL) OR (is_revoked = false AND revoked_at IS NULL));

-- ============================================================================
-- PART 2: Create Password History Table (C-012)
-- ============================================================================
-- Purpose: Track password history to prevent reuse
-- Impact: Enhances security by enforcing password rotation policies

CREATE TABLE IF NOT EXISTS password_history (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for password history
CREATE INDEX idx_password_history_user_id ON password_history(user_id);
CREATE INDEX idx_password_history_created_at ON password_history(created_at DESC);

-- Composite index for checking recent passwords
CREATE INDEX idx_password_history_user_recent ON password_history(user_id, created_at DESC);

-- ============================================================================
-- PART 3: Create Audit Logs Table (C-014)
-- ============================================================================
-- Purpose: Track all security-relevant actions for compliance and debugging
-- Impact: Enables security monitoring, forensics, and compliance reporting

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_id BIGINT,
    resource_type VARCHAR(50),
    ip VARCHAR(45) NOT NULL,
    user_agent TEXT,
    result VARCHAR(20) NOT NULL,
    error_msg TEXT,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for audit logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_ip ON audit_logs(ip);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_result_failure ON audit_logs(result) WHERE result = 'failure';

-- Composite index for user activity analysis
CREATE INDEX idx_audit_logs_user_action_date ON audit_logs(user_id, action, created_at DESC);

-- Composite index for resource tracking
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id) WHERE resource_type IS NOT NULL;

-- Check constraint for audit logs result
ALTER TABLE audit_logs
    ADD CONSTRAINT chk_audit_logs_result
    CHECK (result IN ('success', 'failure'));

-- ============================================================================
-- PART 4: Fix Orders Table Foreign Key (C-015)
-- ============================================================================
-- Purpose: Add missing foreign key constraint for orders.user_id
-- Impact: Ensures referential integrity for order records

DO $$
BEGIN
    -- Check if the foreign key constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_orders_user'
          AND table_name = 'orders'
    ) THEN
        -- Add the foreign key constraint
        ALTER TABLE orders
            ADD CONSTRAINT fk_orders_user
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

        RAISE NOTICE 'Added foreign key constraint fk_orders_user to orders table';
    ELSE
        RAISE NOTICE 'Foreign key constraint fk_orders_user already exists';
    END IF;
END $$;

-- Add index for orders.user_id if not exists
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- ============================================================================
-- PART 5: Verify All Tables Exist
-- ============================================================================
-- Purpose: Confirm all required tables are present
-- Impact: Provides clear feedback during migration

DO $$
DECLARE
    missing_tables TEXT[] := ARRAY[]::TEXT[];
    required_tables TEXT[] := ARRAY[
        'users', 'categories', 'articles', 'tags', 'article_tags',
        'comments', 'likes', 'article_views', 'follows', 'subscriptions',
        'reading_progress', 'orders', 'api_keys', 'password_history', 'audit_logs'
    ];
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY required_tables
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = tbl
        ) THEN
            missing_tables := array_append(missing_tables, tbl);
        END IF;
    END LOOP;

    IF array_length(missing_tables, 1) > 0 THEN
        RAISE EXCEPTION 'Missing tables: %', array_to_string(missing_tables, ', ');
    ELSE
        RAISE NOTICE 'All required tables exist';
    END IF;
END $$;

-- ============================================================================
-- Migration Summary
-- ============================================================================
-- Tables created:
--   1. api_keys - API key management with revocation and expiration
--   2. password_history - Password history tracking for security policies
--   3. audit_logs - Comprehensive audit trail for security and compliance
--
-- Constraints added:
--   1. fk_orders_user - Foreign key for orders.user_id
--   2. chk_api_keys_revoked_at - Ensure revoked_at is set when is_revoked is true
--   3. chk_audit_logs_result - Validate audit log result values
--
-- Indexes created:
--   - 13 indexes across 3 new tables for optimal query performance
--   - Composite indexes for common query patterns
--   - Partial indexes for filtered queries
