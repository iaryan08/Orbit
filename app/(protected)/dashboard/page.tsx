import { createClient } from '@/lib/supabase/server'

import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heart, PenLine, ImageIcon, Gamepad2, Calendar, Sparkles, Flame } from 'lucide-react'
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

import { fetchDashboardData } from '@/lib/actions/consolidated'

export default async function DashboardPage() {
    // 1. Fetch Consolidated Data (Pre-loading for both modes)
    const result = await fetchDashboardData()
    if (!result.success || !result.data) return null
    const lunaraData = result.data
    const {
        profile,
        partnerProfile,
        couple,
        userTodayMoods,
        partnerTodayMoods,
        memoriesCount,
        lettersCount,
        onThisDayMemories,
        onThisDayMilestones
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
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-background bg-secondary/20 flex items-center justify-center ring-2 ring-white/10 overflow-hidden shadow-xl">
                                {partnerProfile?.avatar_url ? (
                                    <img src={partnerProfile.avatar_url} className="w-full h-full object-cover" alt="Partner" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-cyan-500/20 text-cyan-200 font-bold text-xs">
                                        {partnerProfile?.display_name?.charAt(0) || "P"}
                                    </div>
                                )}
                            </div>

                        </div>
                        <p className="text-rose-100/70 uppercase text-xs tracking-[0.2em]">
                            Connected with <span className="text-rose-300 font-bold">{partnerProfile?.display_name || 'Partner'}</span>
                        </p>
                    </div>

                    <QuickCreateButtons />
                </ScrollReveal>

                {/* Unified Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mt-8 md:mt-12">

                    {/* Heat Alert (Conditional) */}
                    {(() => {
                        const today = result.data.currentDateIST // Use server-provided date
                        const pId = partnerProfile?.id
                        const pLog = result.data.cycleLogs?.find((l: any) => l.user_id === pId && l.log_date === today)
                        if (pLog?.sex_drive === 'very_high') {
                            return (
                                <ScrollReveal className="lg:col-span-4" delay={0}>
                                    <div className="glass-card p-6 bg-gradient-to-r from-orange-600/30 to-red-600/30 border-orange-500/50 flex items-center justify-between relative overflow-hidden group shadow-[0_0_30px_rgba(234,88,12,0.2)]">
                                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-600/10 animate-pulse" />

                                        {/* Fire particles effect overlay (simulated with dots) */}
                                        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-overlay" />

                                        <div className="flex items-center gap-5 relative z-10 w-full justify-center text-center md:text-left md:justify-start">
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-orange-500/40 blur-xl rounded-full animate-pulse" />
                                                <div className="p-3 rounded-full bg-orange-500/20 border border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.6)] relative z-10">
                                                    <Flame className="w-8 h-8 text-orange-500 drop-shadow-[0_0_10px_rgba(255,165,0,0.8)] animate-pulse" fill="currentColor" />
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-white leading-tight drop-shadow-md">Intense Passion Alert</h3>
                                                <p className="text-sm text-orange-100/90 font-medium">
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

                    {/* Big Widget: Together Counter (Reference Weather Style) */}
                    <ScrollReveal className="lg:col-span-2" delay={0.1}>
                        <div className="glass-card p-6 md:p-10 flex flex-col md:flex-row gap-6 md:gap-10 items-center justify-center h-full relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-cyan-500 opacity-50" />
                            <div className="flex items-center gap-4 md:gap-6">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-rose-500/10 rounded-full" />
                                    <Heart className="w-16 h-16 md:w-24 md:h-24 text-rose-300/80 relative z-10" fill="currentColor" />
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-end gap-1">
                                        <span className="text-6xl md:text-8xl font-bold leading-none text-rose-50 tracking-tighter">
                                            {(() => {
                                                const startDate = couple?.anniversary_date || couple?.paired_at;
                                                if (!startDate) return 0;
                                                return Math.floor(
                                                    (new Date().getTime() - new Date(startDate).getTime()) /
                                                    (1000 * 60 * 60 * 24)
                                                );
                                            })()}
                                        </span>
                                        <span className="text-xl md:text-2xl text-rose-100/50 pb-1 md:pb-2 font-serif italic">Days</span>
                                    </div>
                                    <p className="text-white/60 flex items-center gap-2 uppercase tracking-[0.3em] text-[10px] font-bold pt-2">
                                        <Calendar className="w-3 h-3 text-amber-400/60" />
                                        Since {(() => {
                                            const startDate = couple?.anniversary_date || couple?.paired_at;
                                            return startDate ? new Date(startDate).toLocaleDateString() : 'Today';
                                        })()}
                                    </p>
                                </div>
                            </div>
                            <div className="h-20 w-px bg-white/10 hidden md:block" />
                            <div className="flex flex-col gap-6">
                                <div className="flex items-center gap-4 group/item">
                                    <div className="w-10 h-10 rounded-2xl bg-rose-500/5 flex items-center justify-center group-hover/item:bg-rose-500/10 transition-colors">
                                        <PenLine className="w-5 h-5 text-rose-300/70" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold leading-none text-white/90">{lettersCount}</p>
                                        <p className="text-[10px] uppercase text-white/30 tracking-widest font-bold mt-1">Letters</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 group/item">
                                    <div className="w-10 h-10 rounded-2xl bg-amber-500/5 flex items-center justify-center group-hover/item:bg-amber-500/10 transition-colors">
                                        <ImageIcon className="w-5 h-5 text-amber-300/70" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold leading-none text-white/90">{memoriesCount}</p>
                                        <p className="text-[10px] uppercase text-white/30 tracking-widest font-bold mt-1">Memories</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>

                    {/* Daily Inspiration / Challenge */}
                    <ScrollReveal className="lg:col-span-2" delay={0.1}>
                        <div className="glass-card p-8 flex flex-col justify-between relative overflow-hidden group h-full">
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/5 rounded-full" />
                            <DailyContent />
                        </div>
                    </ScrollReveal>

                    {/* Current Mood (Partner) */}
                    <ScrollReveal className="lg:col-span-1" delay={0.2}>
                        <div className="glass-card p-2 relative group overflow-hidden h-full">
                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500/5 rounded-full" />
                            <PartnerMood
                                partnerName={partnerProfile?.display_name || 'Partner'}
                                partnerAvatar={partnerProfile?.avatar_url}
                                moods={partnerTodayMoods}
                            />
                        </div>
                    </ScrollReveal>



                    {/* Your Interaction Center */}
                    <ScrollReveal className={cn("lg:col-span-2", (onThisDayMemories.length > 0 || onThisDayMilestones.length > 0) ? "lg:col-span-1" : "lg:col-span-2")} delay={0.5}>
                        <div className="glass-card p-2 h-full">
                            <MoodCheckIn hasPartner={hasPartner} userMoods={userTodayMoods} />
                        </div>
                    </ScrollReveal>

                    {/* On This Day (Conditional) */}
                    {(onThisDayMemories.length > 0 || onThisDayMilestones.length > 0) && (
                        <ScrollReveal className="lg:col-span-1" delay={0.55}>
                            <OnThisDay memories={onThisDayMemories} milestones={onThisDayMilestones} />
                        </ScrollReveal>
                    )}
                </div>
            </div>
        </DashboardShell>
    )
}
