import { NextResponse } from 'next/server';
import { getFlags } from '@/lib/product/flags';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const flags = await getFlags(user.id);
    return NextResponse.json(flags);
  } catch (error) {
    console.error('Error fetching flags:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
