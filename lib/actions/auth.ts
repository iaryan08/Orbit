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
  const gender = formData.get('gender') as string

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${origin}/dashboard`,
      data: {
        display_name: displayName,
        gender: gender,
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

export async function fetchUnreadCounts() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { memories: 0, letters: 0 }

  const { data: profile } = await supabase
    .from('profiles')
    .select('couple_id, last_viewed_memories_at, last_viewed_letters_at')
    .eq('id', user.id)
    .single()

  if (!profile?.couple_id) return { memories: 0, letters: 0 }

  // Count new memories
  const { count: memoriesCount } = await supabase
    .from('memories')
    .select('*', { count: 'exact', head: true })
    .eq('couple_id', profile.couple_id)
    .gt('created_at', profile.last_viewed_memories_at || new Date(0).toISOString())

  // Count new letters (from partner only)
  // We need to verify if the letter is from the partner, but checking couple_id + sender != me is best
  const { count: lettersCount } = await supabase
    .from('love_letters')
    .select('*', { count: 'exact', head: true })
    .eq('couple_id', profile.couple_id)
    .neq('sender_id', user.id)
    .gt('created_at', profile.last_viewed_letters_at || new Date(0).toISOString())
  // Ensure we don't count locked letters that shouldn't be visible yet? 
  // Actually, notification should probably appear even if locked, "you have a letter waiting"
  // But user requirement says "new entry". Let's stick to created_at logic.

  return {
    memories: memoriesCount || 0,
    letters: lettersCount || 0
  }
}

export async function markAsViewed(type: 'memories' | 'letters') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return

  const field = type === 'memories' ? 'last_viewed_memories_at' : 'last_viewed_letters_at'

  await supabase
    .from('profiles')
    .update({
      [field]: new Date().toISOString()
    })
    .eq('id', user.id)

  revalidatePath('/dashboard', 'layout')
}

export async function refreshDashboard() {
  revalidatePath('/dashboard', 'layout')
}



export async function deleteMemory(memoryId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // 1. Fetch the memory to get image URLs for cleanup
  const { data: memory, error: fetchError } = await supabase
    .from('memories')
    .select('image_urls, couple_id')
    .eq('id', memoryId)
    .single()

  if (fetchError || !memory) {
    return { error: fetchError?.message || 'Memory not found' }
  }

  // 2. Cleanup storage files if they exist
  if (memory.image_urls && memory.image_urls.length > 0) {
    try {
      // Extract paths from URLs
      // Supabase URLs are usually https://[project].supabase.co/storage/v1/object/public/memories/[path]
      const paths = memory.image_urls.map((url: string) => {
        const parts = url.split('/storage/v1/object/public/memories/');
        return parts.length > 1 ? parts[1] : null;
      }).filter(Boolean);

      if (paths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('memories')
          .remove(paths);

        if (storageError) {
          console.error('Error deleting storage files:', storageError);
          // We continue anyway to delete the DB record, or should we stop?
          // Usually better to delete DB record even if storage cleanup fails partially
        }
      }
    } catch (err) {
      console.error('Unexpected error during storage cleanup:', err);
    }
  }

  // 3. Delete the database record
  const { error } = await supabase
    .from('memories')
    .delete()
    .eq('id', memoryId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard', 'layout')
  return { success: true }
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

export async function saveLunaraOnboarding(onboardingData: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('cycle_profiles')
    .upsert({
      user_id: user.id,
      last_period_start: onboardingData.lastPeriodStart,
      avg_cycle_length: parseInt(onboardingData.cycleLength),
      avg_period_length: parseInt(onboardingData.periodLength),
      contraception: onboardingData.contraception,
      trying_to_conceive: onboardingData.tryingToConceive === 'yes',
      regularity: onboardingData.regularity,
      typical_symptoms: onboardingData.symptoms,
      tracking_goals: onboardingData.trackingGoals,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard', 'layout')
  return { success: true }
}

