# Admin Role Gap — RESOLVED in V3.2

## Problem

`requireSuperAdmin()` in `src/lib/middleware/admin.ts:25-29` was a no-op — it called `requireAdmin()` and returned null (always passes).

## Resolution (V3.2)

Implemented real role hierarchy in `src/lib/middleware/admin.ts`:

| Function | moderator | admin | super_admin |
|----------|:---------:|:-----:|:-----------:|
| `requireModerator()` | ✅ | ✅ | ✅ |
| `requireAdmin()` | ❌ | ✅ | ✅ |
| `requireSuperAdmin()` | ❌ | ❌ | ✅ |

### Route-level segmentation

| Level | Routes |
|-------|--------|
| `requireSuperAdmin` | experiments/* (create/modify/delete), users (ban/suspend) |
| `requireAdmin` | verifications, women-experience, go-no-go, success-stories, match-quality |
| `requireModerator` | reports, activation-*, retention-*, metrics, analytics, marketplace-*, female-retention |

### How to assign super_admin

No Prisma migration needed — `role` is `String` (not an enum) and accepts any value:

```sql
UPDATE "User" SET role = 'super_admin' WHERE id = '<admin-user-id>';
```

### Per-route changes

- 6 routes upgraded from `requireAdmin` → `requireSuperAdmin` (experiments ×3, users)
- 12 routes downgraded from `requireAdmin` (or inline `admin` check) → `requireModerator`
- 7 routes with inline auth blocks replaced with shared middleware imports
- `success-stories/route.ts` — removed local `requireAdmin()` redefinition, uses shared middleware
- Inline auth pattern eliminated: no more `dbUser?.role !== 'admin'` scattered across 7 files
- All 19 admin API routes now use shared middleware from `@/lib/middleware/admin`
