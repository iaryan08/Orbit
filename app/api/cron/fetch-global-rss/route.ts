import { NextResponse } from 'next/server'
import { syncGlobalRSS } from '@/lib/actions/insights'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')

    // Basic security check for the cron job
    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const result = await syncGlobalRSS()

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            message: `Successfully synced ${result.count} RSS items.`
        })
    } catch (error) {
        console.error('Cron Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
