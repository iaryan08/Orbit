'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { MoodType } from '@/lib/constants'
import { getTodayIST, getISTDate } from '@/lib/utils'

export async function submitMood(mood: MoodType, note?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Get user's couple_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('couple_id')
    .eq('id', user.id)
    .single()

  if (!profile?.couple_id) {
    return { error: 'You need to be paired with a partner first' }
  }

  /*
   * FIX: Use IST time to calculate mood_date
   */
  const todayStr = getTodayIST()

  const { error } = await supabase
    .from('moods')
    .insert({
      user_id: user.id,
      couple_id: profile.couple_id,
      emoji: mood,
      mood_text: note || null,
      mood_date: todayStr
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function getTodayMoods() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('couple_id')
    .eq('id', user.id)
    .single()

  if (!profile?.couple_id) return null

  /* 
   * FIX: Use IST time to determine "today"
   * Server might be in UTC, so new Date() is UTC.
   * We need to find what "today" means in India.
   */
  const istDate = getISTDate()

  // Set to beginning of the day in IST
  const todayStart = new Date(istDate)
  todayStart.setHours(0, 0, 0, 0)

  /* 
   * WARNING: supabase 'created_at' is likely UTC. 
   * If we filter by created_at >= todayStart (which is an IST date object), 
   * comparison might be tricky depending on how node handles the TZ.
   * 
   * Safer approach for "Today's Moods":
   * Filter by the `mood_date` column if it exists and we just populated it with YYYY-MM-DD string.
   * BUT `mood_date` is a Date/String column? The insert used `mood_date: todayStr`.
   * The selection uses `created_at` in the original code.
   * 
   * Let's stick to the user's requested logic for defining "today" boundaries but apply it to filter.
   * Since we just changed insert to use correct `mood_date`, using that column is best if possible.
   * However, `getTodayMoods` was using `created_at`.
   * Let's use the calculated timestamp for `created_at` filter as a fallback or primary if `mood_date` isn't reliable for *time* precision (it is date only).
   * 
   * Actually, for "Today's moods", we just need moods from the current day in IST.
   * Converting the `todayStart` (IST 00:00) back to UTC for the query is the standard way.
   * `todayStart.toISOString()` will convert that specific moment to UTC string.
   */

  const { data: moods } = await supabase
    .from('moods')
    .select('*, mood:emoji, note:mood_text, profiles(display_name, avatar_url)')
    .eq('couple_id', profile.couple_id)
    .gte('created_at', todayStart.toISOString())
    .order('created_at', { ascending: false })

  return moods
}

export async function getMoodHistory(days: number = 7) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('couple_id')
    .eq('id', user.id)
    .single()

  if (!profile?.couple_id) return null

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data: moods } = await supabase
    .from('moods')
    .select('*, mood:emoji, note:mood_text, profiles(display_name, avatar_url)')
    .eq('couple_id', profile.couple_id)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false })

  return moods
}
