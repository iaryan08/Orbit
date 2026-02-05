import { createClient } from '@/lib/supabase/server';
import { sendPushNotification } from '@/lib/push-server';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const result = await sendPushNotification(
            user.id,
            'Test Notification',
            'Your device is correctly receiving push notifications from MoonBetweenUs! ✨',
            '/dashboard'
        );

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error in test-push route:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
