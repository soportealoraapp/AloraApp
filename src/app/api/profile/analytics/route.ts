import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateProfileCompleteness } from '@/server/services/profile-completeness';

// GET /api/profile/analytics — Get real profile analytics
export async function GET() {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const profile = await prisma.profile.findUnique({
            where: { userId: user.id },
            select: {
                photos: true,
                bio: true,
                interests: true,
                values: true,
                isVerified: true,
            }
        });

        // Parallel queries for metrics
        const [
            totalLikesReceived,
            likesLast30d,
            likesLast7d,
            totalMatches,
            matchesLast30d,
            messagesSent,
            messagesReceived,
            profileVisits,
            quizResults,
        ] = await Promise.all([
            prisma.interaction.count({
                where: { toUserId: user.id, type: { in: ['like', 'superlike'] } }
            }),
            prisma.interaction.count({
                where: { toUserId: user.id, type: { in: ['like', 'superlike'] }, createdAt: { gte: thirtyDaysAgo } }
            }),
            prisma.interaction.count({
                where: { toUserId: user.id, type: { in: ['like', 'superlike'] }, createdAt: { gte: sevenDaysAgo } }
            }),
            prisma.match.count({
                where: { OR: [{ user1Id: user.id }, { user2Id: user.id }] }
            }),
            prisma.match.count({
                where: { OR: [{ user1Id: user.id }, { user2Id: user.id }], createdAt: { gte: thirtyDaysAgo } }
            }),
            prisma.message.count({
                where: { senderId: user.id }
            }),
            prisma.message.count({
                where: { match: { OR: [{ user1Id: user.id }, { user2Id: user.id }] }, senderId: { not: user.id } }
            }),
            prisma.profileVisit.count({
                where: { visitedId: user.id }
            }),
            prisma.quizResult.count({
                where: { userId: user.id }
            }),
        ]);

        // Calculate metrics
        const replyRate = messagesReceived > 0 ? Math.round((messagesSent / messagesReceived) * 100) : 0;
        const matchRate = totalLikesReceived > 0 ? Math.round((totalMatches / totalLikesReceived) * 100) : 0;

        // Profile completeness (centralized calculation)
        const completeness = calculateProfileCompleteness(profile || {});

        // Recommendations based on real data
        const recommendations: string[] = [];
        if (!profile?.photos || profile.photos.length < 4) {
            recommendations.push('Los perfiles con 4+ fotos reciben 38% mas likes');
        }
        if (!profile?.bio || profile.bio.length < 50) {
            recommendations.push('Bios de 50+ caracteres generan 2x mas conversaciones');
        }
        if (!profile?.interests || profile.interests.length < 3) {
            recommendations.push('Agregar 3+ intereses aumenta tu compatibilidad');
        }
        if (!profile?.isVerified) {
            recommendations.push('Los perfiles verificados reciben 45% mas likes');
        }
        if (quizResults < 3) {
            recommendations.push('Completar 3+ quizzes mejora tu score de compatibilidad');
        }
        if (replyRate < 50) {
            recommendations.push('Responder mas mensajes mejora tu reputacion');
        }

        // Likes per week (last 4 weeks)
        const likesPerWeek: number[] = [];
        for (let i = 3; i >= 0; i--) {
            const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
            const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
            const count = await prisma.interaction.count({
                where: {
                    toUserId: user.id,
                    type: { in: ['like', 'superlike'] },
                    createdAt: { gte: weekStart, lt: weekEnd }
                }
            });
            likesPerWeek.push(count);
        }

        return NextResponse.json({
            metrics: {
                totalLikesReceived,
                likesLast30d,
                likesLast7d,
                totalMatches,
                matchesLast30d,
                messagesSent,
                messagesReceived,
                replyRate,
                matchRate,
                profileVisits,
                quizResults,
                completeness,
            },
            likesPerWeek,
            recommendations,
            period: 'Ultimos 30 dias',
        });

    } catch (error) {
        console.error('Error getting profile analytics:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
