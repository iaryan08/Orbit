import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const subscription = await request.json();
        console.log('Received subscription:', subscription);

        if (!subscription || !subscription.endpoint) {
            return NextResponse.json({ error: 'Invalid subscription.' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.error('Auth error in subscribe:', authError);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Use Admin client for saving subscription to bypass RLS policy limitations on upsert/update
        const adminSupabase = await createAdminClient();

        const { error: dbError } = await adminSupabase
            .from('push_subscriptions')
            .upsert({
                user_id: user.id,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys?.p256dh,
                auth: subscription.keys?.auth
            }, { onConflict: 'endpoint' });

        if (dbError) {
            console.error('Database error saving subscription:', dbError);
            return NextResponse.json({ error: `Database error: ${dbError.message}` }, { status: 500 });
        }

        console.log('Successfully saved subscription for user:', user.id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error in subscribe route:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
