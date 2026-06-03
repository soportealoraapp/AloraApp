import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin';
import {
  getCompatibilityImpact,
  getVoiceIntroImpact,
  getDailyQuestionImpact,
  getVerificationImpact,
  getActivationBySegment,
} from '@/server/services/product-metrics';

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(request.url);
  const days = Math.min(Math.max(parseInt(url.searchParams.get('days') || '30'), 1), 90);

  try {
    const [compatibility, voiceIntro, dailyQuestion, verification, activationBySegment] = await Promise.all([
      getCompatibilityImpact(days),
      getVoiceIntroImpact(days),
      getDailyQuestionImpact(days),
      getVerificationImpact(days),
      getActivationBySegment(days),
    ]);

    return NextResponse.json({
      compatibility,
      voiceIntro,
      dailyQuestion,
      verification,
      activationBySegment,
    });
  } catch (error) {
    console.error('Error fetching product metrics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
