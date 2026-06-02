import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateCompleteness } from '@/lib/utils/completeness';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const profile = await prisma.profile.findUnique({
            where: { userId: user.id },
            select: {
                isVerified: true,
                lastActiveAt: true,
                reputationScore: true,
                photos: true,
                bio: true,
                interests: true,
                city: true,
                education: true,
                zodiacSign: true,
            },
        });

        if (!profile) {
            return NextResponse.json({ score: 50, level: 'Nuevo', factors: [], tips: [], breakdown: {} });
        }

        const completenessScore = calculateCompleteness({
            photos: profile.photos ?? undefined,
            bio: profile.bio ?? undefined,
            interests: profile.interests ?? undefined,
            city: profile.city ?? undefined,
            education: profile.education ?? undefined,
            zodiacSign: profile.zodiacSign ?? undefined,
        });

        const reportsReceived = await prisma.report.count({
            where: { reportedId: user.id, status: 'reviewed' },
        });

        const blocksReceived = await prisma.block.count({
            where: { blockedId: user.id },
        });

        const matchCount = await prisma.match.count({
            where: {
                OR: [{ user1Id: user.id }, { user2Id: user.id }],
                isActive: true,
            },
        });

        let totalMessages = 0;
        let sentMessages = 0;
        if (matchCount > 0) {
            const matches = await prisma.match.findMany({
                where: {
                    OR: [{ user1Id: user.id }, { user2Id: user.id }],
                    isActive: true,
                },
                select: { id: true },
            });

            const matchIds = matches.map(m => m.id);
            totalMessages = await prisma.message.count({
                where: { matchId: { in: matchIds } },
            });
            sentMessages = await prisma.message.count({
                where: { matchId: { in: matchIds }, senderId: user.id },
            });
        }

        const responseRate = totalMessages > 0
            ? Math.round((sentMessages / totalMessages) * 100)
            : 50;

        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const isActive = profile.lastActiveAt ? new Date(profile.lastActiveAt) > oneWeekAgo : false;

        // Calculate trust score
        let score = 0;
        const factors: { label: string; points: number; positive: boolean }[] = [];

        // Positive factors
        if (completenessScore >= 90) {
            score += 20;
            factors.push({ label: 'Perfil completo (90%+)', points: 20, positive: true });
        } else if (completenessScore >= 70) {
            score += 10;
            factors.push({ label: 'Perfil casi completo (70%+)', points: 10, positive: true });
        }

        if (profile.isVerified) {
            score += 20;
            factors.push({ label: 'Identidad verificada', points: 20, positive: true });
        }

        if (reportsReceived === 0) {
            score += 20;
            factors.push({ label: 'Sin reportes recibidos', points: 20, positive: true });
        }

        if (responseRate >= 50) {
            score += 20;
            factors.push({ label: 'Buena tasa de respuesta', points: 20, positive: true });
        }

        if (isActive) {
            score += 20;
            factors.push({ label: 'Activo en los últimos 7 días', points: 20, positive: true });
        }

        // Negative factors
        if (reportsReceived > 0) {
            const penalty = Math.min(30, reportsReceived * 15);
            score -= penalty;
            factors.push({ label: `${reportsReceived} reporte(s) recibido(s)`, points: -penalty, positive: false });
        }

        if (blocksReceived > 2) {
            const penalty = Math.min(15, (blocksReceived - 2) * 5);
            score -= penalty;
            factors.push({ label: `${blocksReceived} usuarios te bloquearon`, points: -penalty, positive: false });
        }

        score = Math.max(0, Math.min(100, score));

        // Determine level
        let level = 'Nuevo';
        if (score >= 81) level = 'Embajador';
        else if (score >= 61) level = 'Premium';
        else if (score >= 41) level = 'Confiable';
        else if (score >= 21) level = 'Activo';

        // Improvement tips
        const tips: string[] = [];
        if (!profile.isVerified) tips.push('Verifica tu identidad para +20 puntos');
        if (completenessScore < 90) tips.push('Completa tu perfil al 90%+ para +20 puntos');
        if (responseRate < 50) tips.push('Responde a más mensajes para mejorar tu score');
        if (!isActive) tips.push('Actívate en la app para +20 puntos');
        if (reportsReceived > 0) tips.push('Mantén un comportamiento respetuoso para evitar reportes');

        return NextResponse.json({
            score,
            level,
            factors,
            tips,
            breakdown: {
                completeness: completenessScore,
                verified: profile.isVerified,
                reportsReceived,
                blocksReceived,
                responseRate,
                isActive,
            },
        });
    } catch (error) {
        console.error('Error calculating trust score:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
