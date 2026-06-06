# Role Migration Checklist — super_admin

## Overview

V3.2 introduced a three-tier admin hierarchy:
- `requireModerator()` — content moderation, read-only metrics
- `requireAdmin()` — user actions, verification management
- `requireSuperAdmin()` — experiment management, user bans

6 API routes now require `super_admin`:
- `PUT /api/admin/experiments/[id]`
- `DELETE /api/admin/experiments/[id]`
- `GET /api/admin/experiments/[id]/results`
- `GET /api/admin/experiments`
- `POST /api/admin/experiments`
- `PATCH /api/admin/users`

Without a `super_admin` user, these routes return 403.

## Pre-deployment

- [ ] Identify which admins need `super_admin` access
- [ ] Run `scripts/assign-super-admin.sql` for each admin
- [ ] Verify `super_admin` exists: `SELECT id, email FROM "User" WHERE role = 'super_admin';`
- [ ] Confirm no `moderator` users are assigned to routes that now require `admin` or `super_admin`

## Post-deployment

- [ ] Test `GET /api/admin/experiments` as `super_admin` → returns 200
- [ ] Test `GET /api/admin/experiments` as `admin` → returns 403
- [ ] Test `GET /api/admin/reports` as `moderator` → returns 200
- [ ] Test `GET /api/admin/reports` as `user` → returns 403
- [ ] Verify existing admin dashboards still work (metrics, analytics, activation funnel)
- [ ] Verify existing moderator workflows (reports, success stories) still work

## Rollback

If any route returns an unexpected 403:

1. Check the user's role: `SELECT id, email, role FROM "User" WHERE id = '<id>';`
2. If moderate access needed, assign `admin` or `super_admin`:
   ```sql
   UPDATE "User" SET role = 'super_admin' WHERE id = '<id>';
   ```
3. If a route is too restrictive, temporarily downgrade its middleware:
   - `requireSuperAdmin()` → `requireAdmin()` in the route's import
