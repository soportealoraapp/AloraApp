import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/middleware/admin';
import { computeExperimentResults } from '@/server/services/experiment-results';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireSuperAdmin();
  if (auth) return auth;

  try {
    const results = await computeExperimentResults(id);
    return NextResponse.json(results);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
