'use server'

import { createClient } from '@/lib/supabase/server'
import { getTodayIST } from '@/lib/utils'
import { dedupedFetch } from '@/lib/dedup-fetch'

export async function fetchDashboardData() {
    return dedupedFetch('dashboard-data', async () => {
        const start = performance.now()
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return { error: 'Not authenticated' }

        try {
            // STEP 1: Crucial Identity Data (Sequential but fast)
            // We need this to determine WHO to fetch data for
            const { data: profile } = await supabase
                .from('profiles')
                .select('id, partner_id, couple_id, gender, display_name, avatar_url')
                .eq('id', user.id)
                .single()

            if (!profile) return { error: 'Profile not found' }

            let partnerId = profile.partner_id
            const coupleId = profile.couple_id

            // If partner not linked in profile, try to find via couples table
            // This is a "fix-it" step, usually fast or skipped
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

            // STEP 2: The "Big Bang" Fetch
            // Fetch EVERYTHING else in parallel. No more waterfalls.    
            const now = new Date()
            const istDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))

            // Calculate "Start of Today" in UTC for database queries
            // IST Midnight = Previous Day 18:30 UTC
            const todayStart = new Date(istDate)
            todayStart.setHours(0, 0, 0, 0)
            todayStart.setHours(todayStart.getHours() - 5)
            todayStart.setMinutes(todayStart.getMinutes() - 30)

            const promises = [
                // 0. Partner Profile
                partnerId ? supabase.from('profiles').select('id, display_name, avatar_url, gender').eq('id', partnerId).single() : Promise.resolve({ data: null }),

                // 1. Cycles (User & Partner)
                supabase.from('cycle_profiles').select('user_id, last_period_start, avg_cycle_length, avg_period_length, sharing_enabled, onboarding_completed').in('user_id', [user.id, partnerId].filter(Boolean)),

                // 2. Couple Data (Anniversaries)
                coupleId ? supabase.from('couples').select('*').eq('id', coupleId).single() : Promise.resolve({ data: null }),

                // 3. Partner Moods (Today)
                partnerId ? supabase.from('moods').select('*, mood:emoji, note:mood_text').eq('user_id', partnerId).gte('created_at', todayStart.toISOString()).order('created_at', { ascending: false }) : Promise.resolve({ data: [] }),

                // 4. User Moods (Today)
                supabase.from('moods').select('*, mood:emoji, note:mood_text').eq('user_id', user.id).gte('created_at', todayStart.toISOString()).order('created_at', { ascending: false }),

                // 5. Counts (Letters & Memories)
                coupleId ? supabase.from('memories').select('*', { count: 'exact', head: true }).eq('couple_id', coupleId) : Promise.resolve({ count: 0 }),
                coupleId ? supabase.from('love_letters').select('*', { count: 'exact', head: true }).eq('couple_id', coupleId) : Promise.resolve({ count: 0 }),

                // 6. Recent Logs (Lunara Support)
                coupleId ? supabase.from('support_logs').select('id, category, log_date, action_text, supporter_id').eq('couple_id', coupleId).order('created_at', { ascending: false }).limit(5) : Promise.resolve({ data: [] }),
                coupleId ? supabase.from('cycle_logs').select('log_date, symptoms').eq('couple_id', coupleId).order('log_date', { ascending: false }).limit(10) : Promise.resolve({ data: [] }),

                // 7. On This Day Content
                coupleId ? supabase.from('memories').select('*').eq('couple_id', coupleId) : Promise.resolve({ data: [] }),
                coupleId ? supabase.from('milestones').select('*').eq('couple_id', coupleId) : Promise.resolve({ data: [] }),
            ]

            const [
                pProfileRes,
                cyclesRes,
                coupleRes,
                partnerMoodsRes,
                userMoodsRes,
                memCountRes,
                letCountRes,
                supportLogsRes,
                cycleLogsRes,
                memoriesRes,
                milestonesRes
            ] = await Promise.all(promises)

            // Organize Cycle Data
            let userCycle = null
            let partnerCycle = null
            if (cyclesRes.data) {
                userCycle = cyclesRes.data.find((c: any) => c.user_id === user.id) || null
                partnerCycle = cyclesRes.data.find((c: any) => c.user_id === partnerId) || null
            }

            // Identify "On This Day" matches
            const month = istDate.getMonth() + 1
            const day = istDate.getDate()
            const isToday = (dateStr: string) => {
                if (!dateStr) return false
                const [y, m, d] = dateStr.split('T')[0].split('-').map(Number)
                return m === month && d === day
            }

            const onThisDayMemories = (memoriesRes.data || []).filter((m: any) => isToday(m.memory_date))
            const onThisDayMilestones = (milestonesRes.data || []).filter((m: any) => isToday(m.milestone_date))

            const end = performance.now()
            console.log(`[Dashboard] Fetched all data in ${(end - start).toFixed(2)}ms`)

            return {
                success: true,
                data: {
                    // Identity
                    profile: { ...profile, partner_id: partnerId },
                    partnerProfile: pProfileRes.data,
                    couple: coupleRes.data,

                    // Moods & Social
                    partnerTodayMoods: partnerMoodsRes.data || [],
                    userTodayMoods: userMoodsRes.data || [],
                    memoriesCount: memCountRes.count || 0,
                    lettersCount: letCountRes.count || 0,

                    // Lunara
                    userCycle,
                    partnerCycle,
                    cycleLogs: cycleLogsRes.data || [],
                    supportLogs: supportLogsRes.data || [],

                    // Daily Content
                    onThisDayMemories,
                    onThisDayMilestones,

                    // Meta
                    currentDateIST: getTodayIST()
                }
            }

        } catch (error: any) {
            console.error('Error fetching dashboard data:', error)
            return { error: error.message }
        }
    })
}
