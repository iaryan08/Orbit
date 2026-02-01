import React from "react"
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardHeader } from '@/components/dashboard-header'
import { RealtimeObserver } from '@/components/realtime-observer'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get couple info separately
  let couple = null
  if (profile?.couple_id) {
    const { data: coupleData } = await supabase
      .from('couples')
      .select('*')
      .eq('id', profile.couple_id)
      .single()
    couple = coupleData
  }

  // Get partner info if paired
  let partnerProfile = null
  let daysTogetherCount = 0

  if (profile?.couple_id && couple) {
    // Find partner (the other user in the couple)
    const partnerId = couple.user1_id === user.id ? couple.user2_id : couple.user1_id

    if (partnerId) {
      const { data: partner } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', partnerId)
        .single()

      partnerProfile = partner
    }

    // Calculate days together
    if (couple.paired_at) {
      const startDate = new Date(couple.paired_at)
      const today = new Date()
      daysTogetherCount = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    }
  }

  return (
    <div className="min-h-screen bg-transparent pb-10 md:pb-0">
      <RealtimeObserver coupleId={profile?.couple_id || null} />
      <DashboardHeader
        userName={profile?.display_name || user.email?.split('@')[0] || 'User'}
        userAvatar={profile?.avatar_url}
        partnerName={partnerProfile?.display_name}
        daysTogetherCount={daysTogetherCount}
      />
      <main className="container mx-auto px-4 py-6 pt-32">
        {children}
      </main>
    </div>
  )
}
