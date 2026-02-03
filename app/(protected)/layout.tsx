import React from "react"
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardHeader } from '@/components/dashboard-header'
import { RealtimeObserver } from '@/components/realtime-observer'
import { fetchUnreadCounts } from '@/lib/actions/auth'
import { AppModeProvider } from '@/components/app-mode-context'

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    // Initial profile fetch
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    let couple = null
    let partnerProfile = null
    let daysTogetherCount = 0

    if (profile?.couple_id) {
        // Parallel fetch couple and partner info
        const { data: coupleData } = await supabase
            .from('couples')
            .select('*')
            .eq('id', profile.couple_id)
            .single()

        couple = coupleData

        if (couple) {
            const partnerId = couple.user1_id === user.id ? couple.user2_id : couple.user1_id

            const [partnerRes, daysRes, unreadCounts] = await Promise.all([
                partnerId ? supabase.from('profiles').select('*').eq('id', partnerId).single() : Promise.resolve({ data: null }),
                Promise.resolve(couple.paired_at),
                fetchUnreadCounts()
            ]);

            partnerProfile = partnerRes.data;

            // Calculate days together
            const startDateStr = couple.anniversary_date || couple.paired_at;
            if (startDateStr) {
                const startDate = new Date(startDateStr)
                const today = new Date()
                daysTogetherCount = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
            }
        }
    }

    return (
        <AppModeProvider>
            <div className="min-h-screen bg-transparent pb-10 md:pb-0">
                <RealtimeObserver
                    coupleId={profile?.couple_id || null}
                    partnerId={couple ? (couple.user1_id === user.id ? couple.user2_id : couple.user1_id) : null}
                />
                <DashboardHeader
                    userName={profile?.display_name || user.email?.split('@')[0] || 'User'}
                    userAvatar={profile?.avatar_url}
                    partnerName={partnerProfile?.display_name}
                    daysTogetherCount={daysTogetherCount}
                    unreadCounts={couple ? await fetchUnreadCounts() : undefined}
                />
                <main className="container mx-auto px-4 py-6 pt-32">
                    {children}
                </main>
            </div>
        </AppModeProvider>
    )
}
