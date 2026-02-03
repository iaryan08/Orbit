import { createClient } from '@/lib/supabase/server'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heart, PenLine, ImageIcon, Gamepad2, Calendar, Sparkles } from 'lucide-react'
import Link from 'next/link'
import type { MoodType } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { DashboardShell } from '@/components/dashboard-shell'
import { ScrollReveal } from '@/components/scroll-reveal'

// Dynamic Imports with Loading Skeletons
const MoodCheckIn = dynamic(() => import('@/components/mood-check-in').then(mod => mod.MoodCheckIn), {
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

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // 1. Initial Profile Fetch
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (!profile) return null

    // 2. Parallel fetching for couple-dependent data
    let couple = null
    let partnerProfile = null
    let partnerTodayMoods: any[] = []
    let memoriesCount = 0
    let lettersCount = 0
    let onThisDayMemories = []
    let onThisDayMilestones = []

    if (profile.couple_id) {
        // First get couple data
        const { data: coupleData } = await supabase
            .from('couples')
            .select('*')
            .eq('id', profile.couple_id)
            .single()

        couple = coupleData

        if (couple) {
            const partnerId = couple.user1_id === user.id ? couple.user2_id : couple.user1_id
            const now = new Date()
            // Adjust for IST (India) timezone specifically for the server component
            const istDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))

            const month = istDate.getMonth() + 1
            const day = istDate.getDate()

            const todayStart = new Date(istDate)
            todayStart.setHours(0, 0, 0, 0)
            todayStart.setHours(todayStart.getHours() - 5)
            todayStart.setMinutes(todayStart.getMinutes() - 30)

            // Fetch all dependent data in parallel
            const [partnerRes, moodsRes, memCountRes, letCountRes, memoriesRes, milestonesRes] = await Promise.all([
                partnerId ? supabase.from('profiles').select('*').eq('id', partnerId).single() : Promise.resolve({ data: null }),
                partnerId ? supabase.from('moods').select('*, mood:emoji, note:mood_text').eq('user_id', partnerId).gte('created_at', todayStart.toISOString()).order('created_at', { ascending: false }) : Promise.resolve({ data: [] }),
                supabase.from('memories').select('*', { count: 'exact', head: true }).eq('couple_id', profile.couple_id),
                supabase.from('love_letters').select('*', { count: 'exact', head: true }).eq('couple_id', profile.couple_id),
                supabase.from('memories').select('*').eq('couple_id', profile.couple_id),
                supabase.from('milestones').select('*').eq('couple_id', profile.couple_id)
            ])

            partnerProfile = partnerRes.data
            partnerTodayMoods = moodsRes.data || []
            memoriesCount = memCountRes.count || 0
            lettersCount = letCountRes.count || 0

            const milestones = milestonesRes.data || []
            const memories = memoriesRes.data || []

            // Filter for On This Day (Memories & Milestones)
            // Filter for On This Day (Memories & Milestones)
            const isToday = (dateStr: string) => {
                if (!dateStr) return false
                // Handle YYYY-MM-DD string directly to avoid timezone issues with Date() parsing
                const [y, m, d] = dateStr.split('T')[0].split('-').map(Number)
                // Match Month and Day (m is 1-indexed from split)
                return m === month && d === day
            }

            if (memories) {
                onThisDayMemories = memories.filter(m => isToday(m.memory_date))
            }

            if (milestones) {
                onThisDayMilestones = milestones.filter(m => isToday(m.milestone_date))
            }
        }
    }

    const hasPartner = !!couple?.user2_id

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
        <DashboardShell>
            <div className="max-w-7xl mx-auto space-y-12 pt-4 pb-24 px-6 md:px-8">
                {/* Refined Welcome Header */}
                <ScrollReveal className="space-y-4 text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-amber-200/90 text-[10px] uppercase tracking-[0.3em] font-bold backdrop-blur-md text-glow-gold">
                        <Sparkles className="w-3 h-3 text-amber-400/80" />
                        MoonBetweenUs
                    </div>
                    <h1 className="hidden md:block text-4xl md:text-7xl font-romantic text-rose-50 leading-[1.1] tracking-wide text-glow-rose">
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
                        <p className="text-rose-100/70 uppercase text-xs tracking-[0.2em] font-medium">
                            Connected with <span className="text-rose-50 font-bold">{partnerProfile?.display_name || 'Partner'}</span>
                        </p>
                    </div>
                </ScrollReveal>

                {/* Unified Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mt-8 md:mt-12">

                    {/* Big Widget: Together Counter (Reference Weather Style) */}
                    <ScrollReveal className="lg:col-span-2" delay={0.1}>
                        <div className="glass-card p-6 md:p-10 flex flex-col md:flex-row gap-6 md:gap-10 items-center justify-center h-full relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-cyan-500 opacity-50" />
                            <div className="flex items-center gap-4 md:gap-6">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-rose-500/10 blur-3xl rounded-full" />
                                    <Heart className="w-16 h-16 md:w-24 md:h-24 text-rose-300/80 relative z-10 animate-pulse-slow" fill="currentColor" />
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
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 blur-[120px] rounded-full" />
                            <DailyContent />
                        </div>
                    </ScrollReveal>

                    {/* Current Mood (Partner) */}
                    <ScrollReveal className="lg:col-span-1" delay={0.2}>
                        <div className="glass-card p-2 relative group overflow-hidden h-full">
                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500/10 blur-3xl rounded-full" />
                            <PartnerMood
                                partnerName={partnerProfile?.display_name || 'Partner'}
                                partnerAvatar={partnerProfile?.avatar_url}
                                moods={partnerTodayMoods}
                            />
                        </div>
                    </ScrollReveal>

                    {/* Quick Actions (Floating Pill Grid) */}
                    <ScrollReveal className="lg:col-span-1 glass-card hidden" delay={0.3}>
                        <div className=" p-6 flex flex-col justify-between h-full bg-black/20">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-white/50 uppercase tracking-[0.2em] text-[10px] font-bold">Quick Interaction</h3>
                                <Sparkles className="w-4 h-4 text-amber-400/30" />
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 glass-card">
                                {quickActions.map((action, i) => (
                                    <Link
                                        key={action.href}
                                        href={action.href}
                                        className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all hover:translate-x-1 group"
                                    >
                                        <div className={cn(
                                            "w-8 h-8 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110",
                                            action.color.replace('text-', 'bg-').replace('500', '500/20')
                                        )}>
                                            <action.icon className={cn("w-4 h-4", action.color)} />
                                        </div>
                                        <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">{action.label.split(' ')[1] || action.label}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </ScrollReveal>

                    {/* Your Interaction Center */}
                    <ScrollReveal className={cn("lg:col-span-2", (onThisDayMemories.length > 0 || onThisDayMilestones.length > 0) ? "lg:col-span-1" : "lg:col-span-2")} delay={0.5}>
                        <div className="glass-card p-2 h-full">
                            <MoodCheckIn hasPartner={hasPartner} />
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
