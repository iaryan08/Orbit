'use server'

import { createClient } from '@/lib/supabase/server'
import { getTodayIST } from '@/lib/utils'
import { unstable_cache } from 'next/cache'

export async function fetchDashboardData() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated' }

    const getCachedData = unstable_cache(
        async () => {
            const start = performance.now()

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

                // 1. Calendar Day Start (For Memories, Milestones, "On This Day")
                const calendarDayStart = new Date(istDate)
                calendarDayStart.setHours(0, 0, 0, 0)
                calendarDayStart.setHours(calendarDayStart.getHours() - 5)
                calendarDayStart.setMinutes(calendarDayStart.getMinutes() - 30)

                // 2. Rolling 24-Hour Window (For Moods, Libido, Symptoms)
                // Data stays visible for 24h from creation, instead of resetting at midnight
                const rolling24hStart = new Date(now.getTime() - 24 * 60 * 60 * 1000)

                const promises = [
                    // 0. Partner Profile
                    partnerId ? supabase.from('profiles').select('id, display_name, avatar_url, gender').eq('id', partnerId).single() : Promise.resolve({ data: null }),

                    // 1. Cycles (User & Partner)
                    supabase.from('cycle_profiles').select('user_id, last_period_start, avg_cycle_length, avg_period_length, sharing_enabled, onboarding_completed, period_ended_at').in('user_id', [user.id, partnerId].filter(Boolean)),

                    // 2. Couple Data (Anniversaries)
                    coupleId ? supabase.from('couples').select('*').eq('id', coupleId).single() : Promise.resolve({ data: null }),

                    // 3. Partner Moods (Rolling 24h)
                    partnerId ? supabase.from('moods').select('*, mood:emoji, note:mood_text').eq('user_id', partnerId).gte('created_at', rolling24hStart.toISOString()).order('created_at', { ascending: false }) : Promise.resolve({ data: [] }),

                    // 4. User Moods (Rolling 24h)
                    supabase.from('moods').select('*, mood:emoji, note:mood_text').eq('user_id', user.id).gte('created_at', rolling24hStart.toISOString()).order('created_at', { ascending: false }),

                    // 5. Counts (Letters & Memories)
                    coupleId ? supabase.from('memories').select('*', { count: 'exact', head: true }).eq('couple_id', coupleId) : Promise.resolve({ count: 0 }),
                    coupleId ? supabase.from('love_letters').select('*', { count: 'exact', head: true }).eq('couple_id', coupleId) : Promise.resolve({ count: 0 }),

                    // 6. Recent Logs (Lunara Support)
                    coupleId ? supabase.from('support_logs').select('id, category, log_date, action_text, supporter_id').eq('couple_id', coupleId).order('created_at', { ascending: false }).limit(5) : Promise.resolve({ data: [] }),

                    // 7. Cycle Logs (Rolling 24h check based on updated_at, or fallback to recent log_date)
                    // We fetch recent logs and filter in JS or use updated_at if possible. 
                    // Using updated_at > 24h ago ensures we capture recent edits even if log_date was "yesterday"
                    coupleId ? supabase.from('cycle_logs').select('*').eq('couple_id', coupleId).gte('updated_at', rolling24hStart.toISOString()).order('updated_at', { ascending: false }) : Promise.resolve({ data: [] }),

                    // 8. On This Day Content (Calendar Based)
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
                ] = await Promise.all(promises) as any[]

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

                // For milestones, check all date fields and track whose date it is
                const onThisDayMilestones = (milestonesRes.data || []).reduce((acc: any[], m: any) => {
                    const dualDateCategories = ['first_kiss', 'first_surprise', 'first_memory']
                    const isDualDate = dualDateCategories.includes(m.category)
                    const u1Id = coupleRes.data?.user1_id
                    const u2Id = coupleRes.data?.user2_id

                    if (isDualDate) {
                        // Check user1's date
                        if (isToday(m.date_user1)) {
                            acc.push({ ...m, milestone_date: m.date_user1, isOwnDate: u1Id === user.id, isPartnerDate: u1Id !== user.id })
                        }
                        // Check user2's date
                        if (isToday(m.date_user2)) {
                            acc.push({ ...m, milestone_date: m.date_user2, isOwnDate: u2Id === user.id, isPartnerDate: u2Id !== user.id })
                        }
                    } else {
                        // Single date categories
                        if (isToday(m.milestone_date)) {
                            acc.push({ ...m, isOwnDate: true, isPartnerDate: false })
                        }
                    }
                    return acc
                }, [])

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
        },
        ['dashboard-data', user.id],
        {
            tags: [`dashboard-${user.id}`],
            revalidate: false // Infinite cache, relies 100% on manual revalidation (revalidateTag)
        }
    )

    return await getCachedData()
}
