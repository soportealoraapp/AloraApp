import { NextResponse } from 'next/server';
import { assignVariant } from '@/lib/product/experiments';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { experimentName } = await request.json();
    if (!experimentName || typeof experimentName !== 'string') {
      return NextResponse.json({ error: 'experimentName is required' }, { status: 400 });
    }

    const result = await assignVariant(experimentName, user.id);

    return NextResponse.json({
      variantName: result.variant.name,
      experimentName: result.experiment.name,
      experimentStatus: result.experiment.status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
