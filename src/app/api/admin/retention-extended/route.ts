import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin';
import { getExtendedRetention } from '@/server/services/product-metrics';

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

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
