import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/middleware/admin';

export async function GET() {
  const auth = await requireAdmin();
  if (auth) return auth;

  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      profilesWithVoice,
      verifiedProfiles,
      quizUsers,
      dailyQuestionTodayUsers,
      totalMatches,
    ] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.profile.count({ where: { voiceIntro: { not: null } } }),
      prisma.profile.count({ where: { isVerified: true } }),
      prisma.quizResult.groupBy({ by: ['userId'] }).then(r => r.length),
      prisma.dailyAnswer.groupBy({ by: ['userId'], where: { createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } } }).then(r => r.length),
      prisma.match.count({ where: { createdAt: { gte: thirtyDaysAgo }, isActive: true } }),
    ]);

    // Activation scores for all users in period
    const recentUserIds = (await prisma.user.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { id: true },
    })).map(u => u.id);

    // Compute activation stats
    const profilesWithPhotos = await prisma.profile.count({
      where: { userId: { in: recentUserIds }, photos: { isEmpty: false } },
    });
    const profilesWithBio = await prisma.profile.count({
      where: { userId: { in: recentUserIds }, bio: { not: '' } },
    });
    const profilesWithInterest = await prisma.profile.count({
      where: { userId: { in: recentUserIds }, interests: { isEmpty: false } },
    });
    const profilesWithValues = await prisma.profile.count({
      where: { userId: { in: recentUserIds }, values: { isEmpty: false } },
    });

    const completenessCount = recentUserIds.length > 0 ? await prisma.profile.count({
      where: {
        userId: { in: recentUserIds },
        OR: [
          { photos: { isEmpty: false } },
          { bio: { not: '' } },
          { interests: { isEmpty: false } },
          { values: { isEmpty: false } },
        ],
      },
    }) : 0;

    const activationRate = recentUserIds.length > 0
      ? Math.round((completenessCount / recentUserIds.length) * 100) : 0;

    // Match rates by segment
    const segmentQuery = await prisma.$queryRaw<{
      segment: string; user_count: bigint; match_count: bigint
    }[]>`
      SELECT 'con_quiz' as segment, COUNT(DISTINCT qr.user_id) as user_count,
        COUNT(DISTINCT m.id) as match_count
      FROM quiz_results qr
      LEFT JOIN matches m ON (m.user1_id = qr.user_id OR m.user2_id = qr.user_id)
        AND m.created_at >= ${thirtyDaysAgo} AND m.is_active = true
      UNION ALL
      SELECT 'sin_quiz' as segment, COUNT(DISTINCT u.id) as user_count,
        COUNT(DISTINCT m.id) as match_count
      FROM users u
      LEFT JOIN matches m ON (m.user1_id = u.id OR m.user2_id = u.id)
        AND m.created_at >= ${thirtyDaysAgo} AND m.is_active = true
      WHERE u.created_at >= ${thirtyDaysAgo}
        AND u.id NOT IN (SELECT DISTINCT user_id FROM quiz_results)
    `;

    // Voice match rates
    const voiceSegmentQuery = await prisma.$queryRaw<{
      segment: string; user_count: bigint; match_count: bigint
    }[]>`
      SELECT 'con_voz' as segment, COUNT(DISTINCT p.user_id) as user_count,
        COUNT(DISTINCT m.id) as match_count
      FROM profiles p
      LEFT JOIN matches m ON (m.user1_id = p.user_id OR m.user2_id = p.user_id)
        AND m.created_at >= ${thirtyDaysAgo} AND m.is_active = true
      WHERE p.voice_intro IS NOT NULL
      UNION ALL
      SELECT 'sin_voz' as segment, COUNT(DISTINCT u.id) as user_count,
        COUNT(DISTINCT m.id) as match_count
      FROM users u
      LEFT JOIN matches m ON (m.user1_id = u.id OR m.user2_id = u.id)
        AND m.created_at >= ${thirtyDaysAgo} AND m.is_active = true
      WHERE u.created_at >= ${thirtyDaysAgo}
        AND u.id NOT IN (SELECT DISTINCT user_id FROM profiles WHERE voice_intro IS NOT NULL)
    `;

    // Verified match rates
    const verifiedSegmentQuery = await prisma.$queryRaw<{
      segment: string; user_count: bigint; match_count: bigint
    }[]>`
      SELECT 'verificado' as segment, COUNT(DISTINCT p.user_id) as user_count,
        COUNT(DISTINCT m.id) as match_count
      FROM profiles p
      LEFT JOIN matches m ON (m.user1_id = p.user_id OR m.user2_id = p.user_id)
        AND m.created_at >= ${thirtyDaysAgo} AND m.is_active = true
      WHERE p.is_verified = true
      UNION ALL
      SELECT 'no_verificado' as segment, COUNT(DISTINCT u.id) as user_count,
        COUNT(DISTINCT m.id) as match_count
      FROM users u
      LEFT JOIN matches m ON (m.user1_id = u.id OR m.user2_id = u.id)
        AND m.created_at >= ${thirtyDaysAgo} AND m.is_active = true
      WHERE u.created_at >= ${thirtyDaysAgo}
        AND u.id NOT IN (SELECT DISTINCT user_id FROM profiles WHERE is_verified = true)
    `;

    function parseSegment(rows: { segment: string; user_count: bigint; match_count: bigint }[], label: string) {
      const row = rows.find(r => r.segment === label);
      if (!row) return { userCount: 0, matchCount: 0, matchRate: 0 };
      const userCount = Number(row.user_count);
      const matchCount = Number(row.match_count);
      return { userCount, matchCount, matchRate: userCount > 0 ? Math.round((matchCount / userCount) * 100) / 10 : 0 };
    }

    const quizRate = parseSegment(segmentQuery, 'con_quiz');
    const noQuizRate = parseSegment(segmentQuery, 'sin_quiz');
    const voiceRate = parseSegment(voiceSegmentQuery, 'con_voz');
    const noVoiceRate = parseSegment(voiceSegmentQuery, 'sin_voz');
    const verifiedRate = parseSegment(verifiedSegmentQuery, 'verificado');
    const noVerifiedRate = parseSegment(verifiedSegmentQuery, 'no_verificado');

    const voiceIntroRate = totalUsers > 0 ? Math.round((profilesWithVoice / totalUsers) * 100) : 0;
    const verificationRate = totalUsers > 0 ? Math.round((verifiedProfiles / totalUsers) * 100) : 0;
    const quizCompletionRate = totalUsers > 0 ? Math.round((quizUsers / totalUsers) * 100) : 0;
    const dailyQuestionRate = totalUsers > 0 ? Math.round((dailyQuestionTodayUsers / totalUsers) * 100) : 0;

    return NextResponse.json({
      activation: {
        rate: activationRate,
        totalUsers: recentUserIds.length,
        activatedCount: completenessCount,
        profilesWithPhotos,
        profilesWithBio,
        profilesWithInterest,
        profilesWithValues,
      },
      features: {
        voiceIntroRate,
        verificationRate,
        quizCompletionRate,
        dailyQuestionRate,
      },
      comparisons: {
        quiz: { with: quizRate, without: noQuizRate },
        voice: { with: voiceRate, without: noVoiceRate },
        verification: { with: verifiedRate, without: noVerifiedRate },
      },
    });
  } catch (error) {
    console.error('Error fetching activation insights:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
