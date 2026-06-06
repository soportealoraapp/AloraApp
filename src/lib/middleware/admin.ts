import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function requireAdmin(): Promise<NextResponse | null> {
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

    if (!dbUser || (dbUser.role !== 'admin' && dbUser.role !== 'moderator')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return null;
}

/**
 * NOTE: requireSuperAdmin is intentionally aliased to requireAdmin because
 * the Prisma schema (schema.prisma:19) defines role as:
 *   role  String  @default("user")  // user, moderator, admin
 *
 * There is NO `super_admin` role in the database schema.
 * If super_admin granularity is needed in the future:
 *   1. Add `super_admin` to the valid role values
 *   2. Create a Prisma migration
 *   3. Implement actual role checking here
 */
export async function requireSuperAdmin(): Promise<NextResponse | null> {
    const result = await requireAdmin();
    if (result) return result;
    return null;
}
