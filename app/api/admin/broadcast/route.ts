import { createClient } from '@/lib/supabase/server'
import { broadcastUpdateNotification } from '@/lib/actions/announcements'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Safety: Hardcoded admin check (or just check if logged in for this specific requested task)
    // You can replace this with your actual UID if you want it strictly protected
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const result = await broadcastUpdateNotification()
        return NextResponse.json({
            message: 'Broadcast started',
            details: result
        })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
