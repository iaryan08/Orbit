'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { MoodType } from '@/lib/constants'

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

  const { error } = await supabase
    .from('moods')
    .insert({
      user_id: user.id,
      couple_id: profile.couple_id,
      emoji: mood,
      mood_text: note || null,
      mood_date: new Date().toISOString().split('T')[0]
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

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data: moods } = await supabase
    .from('moods')
    .select('*, mood:emoji, note:mood_text, profiles(display_name, avatar_url)')
    .eq('couple_id', profile.couple_id)
    .gte('created_at', today.toISOString())
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
