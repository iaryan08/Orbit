'use server'

import { createClient } from '@/lib/supabase/server'
import { getTodayIST } from '@/lib/utils'

// Standalone fetchers for reliability
export async function fetchCoreDashboardData() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Not authenticated' }

        const selectFields = 'id, partner_id, couple_id, gender, display_name, avatar_url, city, timezone, latitude, longitude, location_source, updated_at'

        // 1. Fetch Profile
        const { data: profile, error: pError } = await supabase
            .from('profiles')
            .select(selectFields)
            .eq('id', user.id)
            .single()

        if (pError || !profile) {
            console.error('[fetchCoreDashboardData] Profile error:', pError)
            return { error: 'Profile not found' }
        }

        let partnerId = profile.partner_id
        const coupleId = profile.couple_id

        const rolling24hStart = new Date(Date.now() - 24 * 60 * 60 * 1000)

        // Parallel Fetch for all dashboard content
        const [pProfileRes, coupleRes, pMoodsRes, uMoodsRes, countsRes, userCycleRes, partnerCycleRes, cycleLogsRes, supportLogsRes] = await Promise.all([
            partnerId ? supabase.from('profiles').select(selectFields).eq('id', partnerId).single() : Promise.resolve({ data: null, error: null }),
            coupleId ? supabase.from('couples').select('id, user1_id, user2_id, anniversary_date, paired_at, couple_code').eq('id', coupleId).single() : Promise.resolve({ data: null, error: null }),
            partnerId ? supabase.from('moods').select('id, created_at, emoji, mood_text, mood:emoji, note:mood_text').eq('user_id', partnerId).gte('created_at', rolling24hStart.toISOString()).order('created_at', { ascending: false }) : Promise.resolve({ data: [], error: null }),
            supabase.from('moods').select('id, created_at, emoji, mood_text, mood:emoji, note:mood_text').eq('user_id', user.id).gte('created_at', rolling24hStart.toISOString()).order('created_at', { ascending: false }),
            coupleId ? Promise.all([
                supabase.from('memories').select('*', { count: 'exact', head: true }).eq('couple_id', coupleId),
                supabase.from('love_letters').select('*', { count: 'exact', head: true }).eq('couple_id', coupleId)
            ]) : Promise.resolve([{ count: 0 }, { count: 0 }]),
            // Lunara Data (Resilient queries - select * to handle date vs log_date variations)
            supabase.from('cycle_profiles').select('*').eq('user_id', user.id).maybeSingle(),
            partnerId ? supabase.from('cycle_profiles').select('*').eq('user_id', partnerId).maybeSingle() : Promise.resolve({ data: null, error: null }),
            coupleId ? supabase.from('cycle_logs').select('*').eq('couple_id', coupleId).limit(30) : Promise.resolve({ data: [], error: null }),
            coupleId ? supabase.from('support_logs').select('*').eq('couple_id', coupleId).limit(30) : Promise.resolve({ data: [], error: null })
        ])

        const memoriesCount = (countsRes as any)[0]?.count || 0
        const lettersCount = (countsRes as any)[1]?.count || 0

        // Handle field name variations in logs (log_date vs date)
        const normalizedCycleLogs = (cycleLogsRes?.data || []).map((l: any) => ({
            ...l,
            log_date: l.log_date || l.date // fallback
        })).sort((a: any, b: any) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime())

        const normalizedSupportLogs = (supportLogsRes?.data || []).map((l: any) => ({
            ...l,
            log_date: l.log_date || l.date // fallback
        })).sort((a: any, b: any) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime())

        return {
            success: true,
            data: {
                profile: { ...profile, partner_id: partnerId },
                partnerProfile: pProfileRes?.data,
                couple: coupleRes?.data,
                partnerTodayMoods: pMoodsRes?.data || [],
                userTodayMoods: uMoodsRes?.data || [],
                memoriesCount,
                lettersCount,
                userCycle: userCycleRes?.data,
                partnerCycle: partnerCycleRes?.data,
                cycleLogs: normalizedCycleLogs,
                supportLogs: normalizedSupportLogs,
                currentDateIST: getTodayIST()
            }
        }
    } catch (e: any) {
        console.error('[fetchCoreDashboardData] critical error:', e)
        return { error: e.message }
    }
}

export async function fetchBucketListData(coupleId: string) {
    try {
        const supabase = await createClient()
        // select(*) to be schema-agnostic during migration shifts
        const { data, error } = await supabase
            .from('bucket_list')
            .select('*')
            .eq('couple_id', coupleId)

        if (error) {
            console.error('[fetchBucketListData] DB Error:', error)
            return []
        }

        // Resilient mapping for is_done / is_completed variations
        return (data || []).map((item: any) => ({
            ...item,
            is_completed: item.is_completed ?? item.is_done ?? false
        })).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } catch (e) {
        console.error('[fetchBucketListData] internal error:', e)
        return []
    }
}

export async function fetchOnThisDayData(coupleId: string) {
    try {
        const supabase = await createClient()
        const istDate = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
        const month = istDate.getMonth() + 1
        const day = istDate.getDate()

        const [memoriesRes, milestonesRes] = await Promise.all([
            supabase.rpc('get_on_this_day_memories', {
                target_couple_id: coupleId,
                target_month: month,
                target_day: day
            }),
            supabase.rpc('get_on_this_day_milestones', {
                target_couple_id: coupleId,
                target_month: month,
                target_day: day
            })
        ])

        return {
            memories: memoriesRes.data || [],
            milestones: milestonesRes.data || []
        }
    } catch (e) {
        console.error('[fetchOnThisDayData] error:', e)
        return { memories: [], milestones: [] }
    }
}

// Main entry point - Now plain and reliable (No unstable_cache for now to clear blockers)
export async function fetchDashboardData() {
    return await fetchCoreDashboardData()
}
