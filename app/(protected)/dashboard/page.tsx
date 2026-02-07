import { createClient } from '@/lib/supabase/server'

import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heart, PenLine, ImageIcon, Gamepad2, Calendar, Sparkles, Flame, MapPin, Camera } from 'lucide-react'
import Link from 'next/link'
import type { MoodType } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { DashboardShell } from '@/components/dashboard-shell'
import { ScrollReveal } from '@/components/scroll-reveal'
import { QuickCreateButtons } from '@/components/quick-create-buttons'

// Dynamic Imports with Loading Skeletons
const MoodCheckIn = dynamic<{ hasPartner: boolean; userMoods?: any[] }>(() => import('@/components/mood-check-in').then(mod => mod.MoodCheckIn), {
    ssr: true,
    loading: () => <div className="h-64 rounded-3xl bg-white/5 animate-pulse" />
})
const PartnerMood = dynamic(() => import('@/components/partner-mood').then(mod => mod.PartnerMood), {
    ssr: true,
    loading: () => <div className="h-40 rounded-3xl bg-white/5 animate-pulse" />
})
const CouplePairing = dynamic(() => import('@/components/couple-pairing').then(mod => mod.CouplePairing), { ssr: true })
const DailyContent = dynamic(() => import('@/components/daily-content').then(mod => mod.DailyContent), {
    ssr: true,
    loading: () => <div className="h-64 rounded-3xl bg-white/5 animate-pulse" />
})
const OnThisDay = dynamic(() => import('@/components/on-this-day').then(mod => mod.OnThisDay), { ssr: true })
const SharedBucketList = dynamic(() => import('@/components/shared-bucket-list').then(mod => mod.SharedBucketList), {
    ssr: true,
    loading: () => <div className="h-64 rounded-3xl bg-white/5 animate-pulse" />
})
const WeatherBadge = dynamic(() => import('@/components/weather-badge').then(mod => mod.WeatherBadge), { ssr: true })
const DistanceTimeWidget = dynamic(() => import('@/components/distance-time-widget').then(mod => mod.DistanceTimeWidget), {
    ssr: true,
    loading: () => <div className="h-32 rounded-3xl bg-white/5 animate-pulse" />
})
const PartnerStatus = dynamic(() => import('@/components/partner-status').then(mod => mod.PartnerStatus), { ssr: true })
const PartnerAvatarHeartbeat = dynamic(() => import('@/components/partner-avatar-heartbeat').then(mod => mod.PartnerAvatarHeartbeat), { ssr: true })

import { getDashboardPolaroids, deletePolaroid } from '@/lib/actions/polaroids'
import { getDoodle, saveDoodle } from '@/lib/actions/doodles'
import { PolaroidCard } from '@/components/polaroid-card'
import { StackedPolaroids } from '@/components/stacked-polaroids'
import { SharedDoodle } from '@/components/shared-doodle'
import { fetchDashboardData } from '@/lib/actions/consolidated'

export default async function DashboardPage() {
    // 1. Fetch Consolidated Data (Pre-loading for both modes)
    const result = await fetchDashboardData()
    if (!result.success || !result.data) return null
    const lunaraData = result.data

    // 2. Fetch Personal Atmospheric Elements
    const [{ userPolaroid, partnerPolaroid }, doodle] = await Promise.all([
        getDashboardPolaroids(),
        getDoodle()
    ])

    const {
        profile,
        partnerProfile,
        couple,
        userTodayMoods,
        partnerTodayMoods,
        memoriesCount,
        lettersCount,
        onThisDayMemories,
        onThisDayMilestones,
        bucketList
    } = result.data

    const hasPartner = !!couple

    // Quick actions for dashboard
    const quickActions = [
        { href: '/letters', icon: PenLine, label: 'Write Letter', color: 'text-pink-500' },
        { href: '/memories', icon: ImageIcon, label: 'Add Memory', color: 'text-amber-500' },
        { href: '/intimacy', icon: Heart, label: 'Intimacy', color: 'text-rose-500' },
        // { href: '/games', icon: Gamepad2, label: 'Play Game', color: 'text-emerald-500' },
    ]

    if (!hasPartner) {
        return (
            <div className="max-w-2xl mx-auto space-y-8 py-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-serif font-semibold">Welcome to Your Love Space</h1>
                    <p className="text-muted-foreground">
                        Connect with your partner to unlock all features
                    </p>
                </div>
                <CouplePairing userPairCode={couple?.couple_code} />
            </div>
        )
    }

    return (
        <DashboardShell lunaraData={lunaraData}>
            <div className="max-w-7xl mx-auto space-y-12 pt-24 pb-12 px-6 md:px-8">
                {/* Refined Welcome Header */}
                <ScrollReveal className="space-y-4 text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-amber-200/90 text-[10px] uppercase tracking-[0.3em] font-bold backdrop-blur-md text-glow-gold">
                        <Sparkles className="w-3 h-3 text-amber-400/80" />
                        MoonBetweenUs
                    </div>
                    <h1 className="hidden md:block text-4xl md:text-7xl font-romantic text-rose-50 leading-[1.1] tracking-wide">
                        Always Together
                        <br />
                        <span className="bg-gradient-to-r from-amber-200 via-rose-300 to-orange-300 bg-clip-text text-transparent drop-shadow-sm">
                            Forever
                        </span>
                    </h1>
                    <div className="flex flex-col lg:flex-row items-center gap-4 pt-4">
                        <div className="flex -space-x-4">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-background bg-primary/20 flex items-center justify-center ring-2 ring-white/10 overflow-hidden shadow-xl">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} className="w-full h-full object-cover" alt="You" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-rose-500/20 text-rose-200 font-bold text-xs">
                                        {profile?.display_name?.charAt(0) || "U"}
                                    </div>
                                )}
                            </div>
                            <div className="relative z-10">
                                <PartnerAvatarHeartbeat partnerProfile={partnerProfile} coupleId={couple?.id} />
                            </div>

                        </div>
                        <div className="flex flex-col items-center lg:items-start space-y-0.5">
                            <div className="flex items-center gap-2">
                                <p className="text-rose-100/70 uppercase text-xs tracking-[0.2em] lg:whitespace-normal whitespace-nowrap">
                                    Connected with <br className="hidden lg:block" />
                                    <span className="text-rose-300 font-bold lg:text-lg lg:tracking-[0.1em]">{partnerProfile?.display_name || 'Partner'}</span>
                                </p>
                                <PartnerStatus partnerId={partnerProfile?.id} />
                            </div>

                            <div className="flex items-center justify-center lg:justify-start">
                                {partnerProfile && (
                                    <WeatherBadge
                                        lat={partnerProfile.latitude}
                                        lon={partnerProfile.longitude}
                                        city={partnerProfile.city || partnerProfile.display_name}
                                    />
                                )}
                                {!profile?.latitude && (
                                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 animate-pulse">
                                        <MapPin className="w-3 h-3" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Enable Your Location</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <QuickCreateButtons />
                </ScrollReveal>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 md:mt-12">

                    {/* 1. PRIMARY STATS: Together Counter (Priority #1) */}
                    {(() => {
                        const startDate = couple?.anniversary_date || couple?.paired_at;
                        const daysTogether = startDate
                            ? Math.floor((new Date().getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
                            : 0;

                        return (
                            <ScrollReveal className="lg:col-span-4" delay={0}>
                                <div className="glass-card p-4 md:p-6 flex flex-row items-center justify-between gap-4 md:gap-8 relative overflow-hidden group min-h-[100px]">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500/30 via-amber-500/30 to-rose-500/30 opacity-50" />

                                    {/* Days Together */}
                                    <div className="flex items-center gap-3 md:gap-5 flex-1">
                                        <div className="relative shrink-0">
                                            <Heart className="w-10 h-10 md:w-12 md:h-12 text-rose-500/80" fill="currentColor" />
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-3xl md:text-5xl font-bold text-rose-50 tracking-tighter leading-none">
                                                    {daysTogether}
                                                </span>
                                                <span className="text-xs md:text-sm text-rose-100/50 font-serif italic">Days</span>
                                            </div>
                                            <p className="text-[8px] md:text-[10px] uppercase text-white/30 tracking-widest font-bold">Since Start</p>
                                        </div>
                                    </div>

                                    <div className="h-10 w-px bg-white/10 shrink-0" />

                                    {/* Letters & Memories Stacked (One below other) */}
                                    <div className="flex flex-col gap-4 flex-1 justify-center items-start pl-4 md:pl-8">
                                        <div className="flex items-center gap-3">
                                            <PenLine className="w-4 h-4 text-rose-300/50" />
                                            <div className="flex flex-col">
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-xl md:text-2xl font-bold text-white/90 leading-none">{lettersCount}</span>
                                                    <span className={cn(
                                                        "text-[9px] uppercase text-white/20 tracking-widest font-bold",
                                                        daysTogether > 999 && "hidden md:inline"
                                                    )}>Letters</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <ImageIcon className="w-4 h-4 text-amber-300/50" />
                                            <div className="flex flex-col">
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-xl md:text-2xl font-bold text-white/90 leading-none">{memoriesCount}</span>
                                                    <span className={cn(
                                                        "text-[9px] uppercase text-white/20 tracking-widest font-bold",
                                                        daysTogether > 999 && "hidden md:inline"
                                                    )}>Memories</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </ScrollReveal>
                        );
                    })()}

                    {/* 2. DYNAMIC LAYER: Heat Alert */}
                    {(() => {
                        const today = result.data.currentDateIST
                        const pId = partnerProfile?.id
                        const pLog = result.data.cycleLogs?.find((l: any) => l.user_id === pId && l.log_date === today)
                        if (pLog?.sex_drive === 'very_high') {
                            return (
                                <ScrollReveal className="lg:col-span-4" delay={0.05}>
                                    <div className="glass-card p-4 bg-gradient-to-r from-orange-600/30 to-red-600/30 border-orange-500/50 flex items-center justify-between relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-600/10 animate-pulse" />
                                        <div className="flex items-center gap-5 relative z-10 w-full md:justify-start">
                                            <Flame className="w-6 h-6 text-orange-500 animate-pulse" fill="currentColor" />
                                            <div>
                                                <h3 className="text-base font-bold text-white leading-tight">Intense Passion Alert</h3>
                                                <p className="text-xs text-orange-100/90 font-medium">
                                                    {partnerProfile?.display_name || 'Partner'} is feeling a burning desire for you right now.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </ScrollReveal>
                            )
                        }
                        return null
                    })()}

                    {/* 3. ATMOSPHERE LAYER: Polaroid & Doodle (Fixed Gap) */}
                    {/* 3. ATMOSPHERE LAYER: Partner Mood, Your Mood, Polaroid & Doodle */}
                    <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-2">
                        {/* 1. Partner Mood - FIRST */}
                        <ScrollReveal className="lg:col-span-1" delay={0.1}>
                            <div className="glass-card p-1.5 h-full">
                                <PartnerMood
                                    partnerName={partnerProfile?.display_name || 'Partner'}
                                    partnerAvatar={partnerProfile?.avatar_url}
                                    moods={partnerTodayMoods}
                                />
                            </div>
                        </ScrollReveal>

                        {/* 2. Your Mood - SECOND */}
                        <ScrollReveal className="lg:col-span-1" delay={0.15}>
                            <div className="glass-card p-1.5 h-full">
                                <MoodCheckIn hasPartner={hasPartner} userMoods={userTodayMoods} />
                            </div>
                        </ScrollReveal>

                        {/* Polaroid - Center Column */}
                        <ScrollReveal className="lg:col-span-1" delay={0.15}>
                            <StackedPolaroids
                                userPolaroid={userPolaroid}
                                partnerPolaroid={partnerPolaroid}
                                partnerName={partnerProfile?.display_name || 'Partner'}
                                onDelete={async (id: string) => {
                                    'use server'
                                    await deletePolaroid(id)
                                }}
                            />
                        </ScrollReveal>

                        {/* Doodle - Right Column */}
                        <ScrollReveal className="lg:col-span-1 h-full" delay={0.2}>
                            <SharedDoodle
                                savedPath={doodle?.path_data}
                                onSave={async (path) => {
                                    'use server'
                                    await saveDoodle(path)
                                }}
                            />
                        </ScrollReveal>
                    </div>





                    {/* 4. CONTENT LAYER: Daily Inspiration & Distance Widget */}
                    <ScrollReveal className="lg:col-span-2" delay={0.3}>
                        <div className="glass-card p-4 md:p-5 flex flex-col justify-between relative overflow-hidden group h-full">
                            <DailyContent />
                        </div>
                    </ScrollReveal>

                    <ScrollReveal className="lg:col-span-2" delay={0.35}>
                        <DistanceTimeWidget userProfile={profile} partnerProfile={partnerProfile} />
                    </ScrollReveal>

                    {/* MEMORY & FUTURE LAYER: On This Day & Bucket List */}
                    <ScrollReveal className="lg:col-span-2" delay={0.4}>
                        <div className="h-full min-h-[400px]">
                            <OnThisDay
                                memories={onThisDayMemories}
                                milestones={onThisDayMilestones}
                                partnerName={partnerProfile?.display_name || 'Partner'}
                            />
                        </div>
                    </ScrollReveal>



                    <ScrollReveal className="lg:col-span-2" delay={0.45}>
                        <div className="h-full min-h-[400px]">
                            <SharedBucketList initialItems={bucketList} />
                        </div>
                    </ScrollReveal>
                </div>
            </div>
        </DashboardShell>
    )
}
