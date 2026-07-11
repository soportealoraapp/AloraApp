import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin';
import { computeExperimentResults } from '@/server/services/experiment-results';
import { withRateLimit } from '@/server/utils/api-rate-limit';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAdmin();
  if (auth) return auth;

  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { data: { user: adminUser } } = await supabase.auth.getUser();
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rateLimitResponse = await withRateLimit(adminUser.id, 'adminAction');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const results = await computeExperimentResults(id);
    return NextResponse.json(results);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
