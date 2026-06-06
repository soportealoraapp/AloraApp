import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RoleCheck = (role: string) => boolean;

const allowModerator: RoleCheck = (role) =>
    role === 'moderator' || role === 'admin' || role === 'super_admin';

const allowAdmin: RoleCheck = (role) =>
    role === 'admin' || role === 'super_admin';

const allowSuperAdmin: RoleCheck = (role) =>
    role === 'super_admin';

async function checkRole(allow: RoleCheck, label: string): Promise<NextResponse | null> {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true }
    });

    if (!dbUser || !allow(dbUser.role)) {
        return NextResponse.json({
            error: 'Forbidden',
            message: `${label} role required`
        }, { status: 403 });
    }

    return null;
}

/**
 * Requires moderator, admin, or super_admin role.
 * Use for: reports review, read-only metrics, content moderation.
 */
export async function requireModerator(): Promise<NextResponse | null> {
    return checkRole(allowModerator, 'Moderator');
}

/**
 * Requires admin or super_admin role (rejects moderators).
 * Use for: user bans, verification actions, feature flags.
 */
export async function requireAdmin(): Promise<NextResponse | null> {
    return checkRole(allowAdmin, 'Admin');
}

/**
 * Requires super_admin role only.
 * Use for: experiment management, system configuration.
 *
 * Assign super_admin manually in DB:
 *   UPDATE "User" SET role = 'super_admin' WHERE id = '<admin-user-id>';
 * No Prisma migration needed — role is String, accepts any value.
 */
export async function requireSuperAdmin(): Promise<NextResponse | null> {
    return checkRole(allowSuperAdmin, 'Super Admin');
}
