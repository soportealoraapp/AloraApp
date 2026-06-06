# Admin Role Gap

## Problem

`requireSuperAdmin()` in `src/lib/middleware/admin.ts:25-29` is a no-op — it calls `requireAdmin()` and returns null (always passes).

## Root Cause

The Prisma schema (`schema.prisma:19`) defines role as:

```prisma
role  String  @default("user")  // user, moderator, admin
```

There is **no `super_admin` role** in the database. Valid values are: `user`, `moderator`, `admin`.

## Current Behavior

- `requireAdmin()` allows both `admin` and `moderator` roles (`admin.ts:18`)
- `requireSuperAdmin()` allows the same set (via delegation)
- No actual superadmin granularity exists

## To Fix in Future

1. Add `super_admin` to valid role values
2. Create Prisma migration
3. Implement actual role checking in `admin.ts`
4. Restrict experiment management and user banning to super_admin only

## Risk

Low — there is no production deployment that would have super_admin data. The gap only matters if super_admin granularity is needed.
