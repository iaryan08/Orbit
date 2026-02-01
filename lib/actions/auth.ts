'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function signUp(prevState: any, formData: FormData) {
  const supabase = await createClient()
  const headersList = await headers()
  const origin = headersList.get('origin') || ''

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const displayName = formData.get('displayName') as string

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${origin}/dashboard`,
      data: {
        display_name: displayName,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/auth/sign-up-success')
}

export async function signIn(prevState: any, formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // Provide user-friendly error messages
    if (error.message.includes('Invalid login credentials') || error.code === 'invalid_credentials') {
      return { error: 'Invalid email or password. Please try again.' }
    }
    if (error.message.includes('Email not confirmed')) {
      return { error: 'Please verify your email before logging in. Check your inbox for the confirmation link.' }
    }
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  // Fetch couple and partner info in parallel if paired
  let couple = null
  let partner = null

  if (profile.couple_id) {
    const { data: coupleData } = await supabase
      .from('couples')
      .select('*')
      .eq('id', profile.couple_id)
      .single()

    couple = coupleData

    if (couple) {
      const partnerId = couple.user1_id === user.id ? couple.user2_id : couple.user1_id
      if (partnerId) {
        const { data: partnerData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', partnerId)
          .single()
        partner = partnerData
      }
    }
  }

  return { ...profile, couple, partner }
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const displayName = formData.get('displayName') as string
  const avatarUrl = formData.get('avatarUrl') as string

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: displayName,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function createCouple(partnerEmail: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Find partner by email
  const { data: partner } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', (await supabase.from('auth.users').select('id').eq('email', partnerEmail).single()).data?.id)
    .single()

  if (!partner) {
    return { error: 'Partner not found. Make sure they have signed up first.' }
  }

  // Generate unique pair code
  const pairCode = Math.random().toString(36).substring(2, 8).toUpperCase()

  // Create couple
  const { data: couple, error } = await supabase
    .from('couples')
    .insert({
      user1_id: user.id,
      user2_id: partner.id,
      pair_code: pairCode,
      anniversary_date: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  // Update both profiles
  await supabase
    .from('profiles')
    .update({ couple_id: couple.id })
    .in('id', [user.id, partner.id])

  return { success: true, couple }
}

export async function generatePairCode() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Check if user already has a couple
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('couple_id')
    .eq('id', user.id)
    .single()

  if (existingProfile?.couple_id) {
    // Get existing couple code
    const { data: existingCouple } = await supabase
      .from('couples')
      .select('couple_code')
      .eq('id', existingProfile.couple_id)
      .single()

    return { success: true, pairCode: existingCouple?.couple_code }
  }

  // Generate unique pair code
  const pairCode = Math.random().toString(36).substring(2, 8).toUpperCase()

  // Create couple with only user1_id (waiting for partner)
  const { data: couple, error } = await supabase
    .from('couples')
    .insert({
      user1_id: user.id,
      couple_code: pairCode,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  // Update user profile with couple_id
  await supabase
    .from('profiles')
    .update({ couple_id: couple.id })
    .eq('id', user.id)

  return { success: true, pairCode }
}

export async function joinCouple(pairCode: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const trimmedCode = pairCode.trim().toUpperCase()

  const { data: result, error } = await supabase.rpc('join_couple_by_code', {
    code: trimmedCode,
    joining_user_id: user.id
  })

  if (error) {
    // If the function doesn't exist, we might get an error here.
    // In dev it should be fine if we run the migration.
    return { error: error.message }
  }

  // RPC returns a JSON object with success/error/couple fields
  const response = result as any

  if (!response.success) {
    return { error: response.error }
  }

  revalidatePath('/dashboard')
  return { success: true, couple: response.couple }
}
