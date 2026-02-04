import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const subscription = await request.json();

        if (!subscription || !subscription.endpoint) {
            return NextResponse.json({ error: 'Invalid subscription.' }, { status: 400 });
        }

        const supabase = await createClient();

        // Optional: Connect to user
        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await supabase
            .from('push_subscriptions')
            .upsert({
                user_id: user?.id,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth
            }, { onConflict: 'endpoint' });

        if (error) {
            console.error('Error saving subscription:', error);
            return NextResponse.json({ error: 'Error saving subscription.' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in subscribe route:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
