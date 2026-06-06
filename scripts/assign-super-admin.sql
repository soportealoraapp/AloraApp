-- ============================================================================
-- assign-super-admin.sql
--
-- Assign super_admin role to an existing admin user.
-- Run BEFORE deploying V3.2+ to prevent 403 errors on:
--   - /api/admin/experiments/*
--   - /api/admin/users
--
-- Usage:  psql $DATABASE_URL -f scripts/assign-super-admin.sql -v user_id='<uuid>'
-- ============================================================================

BEGIN;

-- Step 1: Verify the user exists and is currently an admin
SELECT
    id,
    email,
    role,
    created_at
FROM "User"
WHERE id = :'user_id';

-- Step 2: Fail-safe — confirm only one row
\echo '>>> Checking that exactly one user matches...'

-- Step 3: Promote to super_admin
UPDATE "User"
SET role = 'super_admin'
WHERE id = :'user_id'
  AND role = 'admin';

-- Step 4: Verify the change
\echo '>>> Verifying promotion...'
SELECT
    id,
    email,
    role,
    created_at
FROM "User"
WHERE id = :'user_id';

-- Step 5: List all super_admins
\echo '>>> All super_admin users:'
SELECT id, email, created_at
FROM "User"
WHERE role = 'super_admin';

COMMIT;
