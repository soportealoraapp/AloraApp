import { NextResponse } from 'next/server';
import { requireModerator } from '@/lib/middleware/admin';
import { getExtendedRetention } from '@/server/services/product-metrics';
import { withRateLimit } from '@/server/utils/api-rate-limit';

export async function GET(request: Request) {
  const auth = await requireModerator();
  if (auth) return auth;

  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { data: { user: adminUser } } = await supabase.auth.getUser();
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rateLimitResponse = await withRateLimit(adminUser.id, 'adminAction');
  if (rateLimitResponse) return rateLimitResponse;

  const url = new URL(request.url);
  const days = Math.min(Math.max(parseInt(url.searchParams.get('days') || '30'), 1), 90);

  try {
    const data = await getExtendedRetention(days);
    return NextResponse.json({ rows: data });
  } catch (error) {
    console.error('Error fetching extended retention:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
