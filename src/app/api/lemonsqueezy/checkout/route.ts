import { NextResponse } from 'next/server';
import { createCheckout } from '@/lib/lemonsqueezy/actions';
import { getServerUser } from '@/lib/middleware/auth';

export async function POST(request: Request) {
    try {
        const user = await getServerUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const result = await createCheckout(user.id, user.email || '');

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ url: result.url });
    } catch (error) {
        console.error('Error creating checkout:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
