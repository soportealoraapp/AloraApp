import { prisma } from '@/lib/prisma';

export async function requireAdmin() {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Unauthorized', status: 401 };
    }

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true }
    });

    if (!dbUser || (dbUser.role !== 'admin' && dbUser.role !== 'moderator')) {
        return { error: 'Forbidden', status: 403 };
    }

    return { user, role: dbUser.role };
}

export async function requireSuperAdmin() {
    const result = await requireAdmin();
    if (result.error) return result;
    if (result.role !== 'admin') {
        return { error: 'Forbidden', status: 403 };
    }
    return result;
}
