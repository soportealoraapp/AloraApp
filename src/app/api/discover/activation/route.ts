import { NextRequest, NextResponse } from 'next/server';
import { calculateActivationScore } from '@/lib/product/activation-score';
import { getActivationTasks } from '@/lib/product/activation-tasks';

export async function GET(request: NextRequest) {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [score, tasks] = await Promise.all([
      calculateActivationScore(user.id),
      getActivationTasks(user.id),
    ]);
    return NextResponse.json({ score, tasks });
  } catch (error) {
    console.error('Error fetching activation data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
