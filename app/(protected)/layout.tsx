import React from "react"
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppModeProvider } from '@/components/app-mode-context'
import { AmbientTopLoader } from '@/components/ambient-top-loader'
import { DeferredLocationTracker } from '@/components/deferred-location-tracker'
import { DeferredDashboardHeader } from '@/components/deferred-dashboard-header'
import { Suspense } from 'react'
import { DeferredConnectionSync } from '@/components/deferred-connection-sync'

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // 1. Initial Identity context (Fast Pass)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/')
    }

    // Fetch core identity for context hydration - minimal selection for speed
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, couple_id, display_name, avatar_url')
        .eq('id', user.id)
        .single()

    const email = user.email

    return (
        <AppModeProvider initialProfile={profile} initialCoupleId={profile?.couple_id}>
            <AmbientTopLoader />
            <DeferredLocationTracker />
            {profile?.couple_id && <DeferredConnectionSync coupleId={profile.couple_id} userId={user.id} />}
            <div className="relative min-h-screen">
                <Suspense fallback={null}>
                    <HeaderWrapper userId={user.id} email={email} profile={profile} />
                </Suspense>

                <main className="container mx-auto px-4 py-6 pt-14 md:pt-32 relative z-10">
                    {children}
                </main>
            </div>
        </AppModeProvider>
    )
}

async function HeaderWrapper({
    userId,
    email,
    profile
}: {
    userId: string
    email?: string
    profile: { id: string; couple_id: string | null; display_name: string | null; avatar_url: string | null } | null
}) {
    const supabase = await createClient()

    let partnerProfile = null
    let daysTogetherCount = 0

    if (profile?.couple_id) {
        const { data: couple } = await supabase
            .from('couples')
            .select('*')
            .eq('id', profile.couple_id)
            .single()

        if (couple) {
            const partnerId = couple.user1_id === userId ? couple.user2_id : couple.user1_id
            const [partnerRes] = await Promise.all([
                partnerId ? supabase.from('profiles').select('id, display_name, avatar_url').eq('id', partnerId).single() : Promise.resolve({ data: null })
            ]);

            partnerProfile = partnerRes.data
            const startDateStr = couple.anniversary_date || couple.paired_at
            if (startDateStr) {
                const startDate = new Date(startDateStr)
                const today = new Date()
                daysTogetherCount = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
            }
        }
    }

    return (
        <DeferredDashboardHeader
            userName={profile?.display_name || email?.split('@')[0] || 'User'}
            userAvatar={profile?.avatar_url}
            partnerName={partnerProfile?.display_name}
            daysTogetherCount={daysTogetherCount}
            coupleId={profile?.couple_id}
            partnerId={partnerProfile?.id}
            unreadCounts={{ memories: 0, letters: 0 }}
        />
    )
}
