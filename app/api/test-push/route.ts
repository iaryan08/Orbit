import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { sendPushNotification } from '@/lib/push-server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const result = await sendPushNotification(
            user.id,
            "Test Notification",
            "This is a test notification from Moon Between Us!",
            "/dashboard"
        );

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error in test-push:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
