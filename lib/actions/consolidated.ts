'use server'

import { createClient } from '@/lib/supabase/server'
import { getTodayIST } from '@/lib/utils'

export async function fetchDashboardData() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated' }

    try {
        // 1. Fetch User Profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, partner_id, couple_id, gender, display_name, avatar_url')
            .eq('id', user.id)
            .single()

        if (!profile) return { error: 'Profile not found' }

        let partnerId = profile.partner_id
        let partnerProfile = null
        let coupleId = profile.couple_id

        // 2. Resolve Partner ID if missing but couple exists
        if (!partnerId && coupleId) {
            const { data: coupleData } = await supabase
                .from('couples')
                .select('user1_id, user2_id')
                .eq('id', coupleId)
                .single()

            if (coupleData) {
                partnerId = coupleData.user1_id === user.id ? coupleData.user2_id : coupleData.user1_id
            }
        }

        // 3. Fetch Partner Profile
        if (partnerId) {
            const { data: pProfile } = await supabase
                .from('profiles')
                .select('id, display_name, avatar_url, gender')
                .eq('id', partnerId)
                .single()
            partnerProfile = pProfile
        }

        // 4. Fetch Cycle Data
        // We need both user's and partner's cycle data depending on gender/view
        let userCycle = null
        let partnerCycle = null

        const { data: cycles } = await supabase
            .from('cycle_profiles')
            .select('user_id, last_period_start, avg_cycle_length, avg_period_length, sharing_enabled, onboarding_completed')
            .in('user_id', [user.id, partnerId].filter(Boolean))

        if (cycles) {
            userCycle = cycles.find((c: any) => c.user_id === user.id) || null
            partnerCycle = cycles.find((c: any) => c.user_id === partnerId) || null
        }

        // 5. Fetch Logs (Cycle & Support)
        let cycleLogs: any[] = []
        let supportLogs: any[] = []

        if (coupleId) {
            const { data: sLogs } = await supabase
                .from('support_logs')
                .select('id, category, log_date, action_text, supporter_id')
                .eq('couple_id', coupleId)
                .order('created_at', { ascending: false })
                .limit(5)
            supportLogs = sLogs || []

            const { data: cLogs, error: cycleError } = await supabase
                .from('cycle_logs')
                .select('log_date, symptoms')
                .eq('couple_id', coupleId)
                .order('log_date', { ascending: false })
                .limit(10)

            console.log('[fetchDashboardData] Fetching cycleLogs for couple_id:', coupleId)
            console.log('[fetchDashboardData] cycleLogs result:', { count: cLogs?.length, data: cLogs, error: cycleError })

            cycleLogs = cLogs || []
        }

        return {
            success: true,
            data: {
                profile: { ...profile, partner_id: partnerId },
                partnerProfile,
                userCycle,
                partnerCycle,
                cycleLogs,
                supportLogs,
                currentDateIST: getTodayIST()
            }
        }

    } catch (error: any) {
        console.error('Error fetching dashboard data:', error)
        return { error: error.message }
    }
}
