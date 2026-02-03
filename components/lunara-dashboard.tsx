'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Moon, Sparkles, Calendar, Settings, Bell, Info, ShieldCheck, Heart } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ScrollReveal } from '@/components/scroll-reveal'
import { LunaraOnboarding } from './lunara-onboarding'
import { createClient } from '@/lib/supabase/client'
import { saveLunaraOnboarding, toggleLunaraSharing, logPeriodStart, logSymptoms } from '@/lib/actions/auth'
import { fetchDashboardData } from '@/lib/actions/consolidated'
import { getTodayIST } from '@/lib/utils'
import { Loader2, Share2, Shield, UserCheck } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { LunaraSettings } from './lunara-settings'
import { SupportModal } from './support-modal'
import { differenceInDays, addDays, format, startOfDay } from 'date-fns'
import { cn } from '@/lib/utils'

import { NotificationBell } from './notification-bell'

export function LunaraDashboard() {
    const [loading, setLoading] = React.useState(true)
    const [profile, setProfile] = React.useState<any>(null)
    const [cycleProfile, setCycleProfile] = React.useState<any>(null)
    const [partnerProfile, setPartnerProfile] = React.useState<any>(null)
    const [partnerId, setPartnerId] = React.useState<string | null>(null)
    const [cycleLogs, setCycleLogs] = React.useState<any[]>([])
    const [supportLogs, setSupportLogs] = React.useState<any[]>([])
    const [showSettings, setShowSettings] = React.useState(false)
    const [showSupportModal, setShowSupportModal] = React.useState(false)
    const [isSyncing, setIsSyncing] = React.useState(false)
    const [isLogging, setIsLogging] = React.useState(false)
    const [sharedSymptoms, setSharedSymptoms] = React.useState<string[]>([])
    const supabase = createClient()


    React.useEffect(() => {
        let channel: any = null

        const loadData = async () => {
            // Use consolidated fetch
            const result = await fetchDashboardData()
            if (result.success && result.data) {
                const d = result.data
                setProfile(d.profile)
                setPartnerProfile(d.partnerProfile)
                setCycleProfile(d.userCycle)
                setCycleLogs(d.cycleLogs)
                setSupportLogs(d.supportLogs)
                setPartnerId(d.profile.partner_id)

                // Handle partner cycle separately if needed or if it returns mixed data
                // The consolidated action returns 'partnerCycle' explicitly
                // But existing code expects 'cycleProfile' to be the one we show? 
                // Logic in original: if female, show hers. if male, show partner's.

                if (d.profile.gender === 'female') {
                    setCycleProfile(d.userCycle)
                } else {
                    setCycleProfile(d.partnerCycle)
                }

                // Log for today
                const today = d.currentDateIST
                const todaysLog = d.cycleLogs?.find((l: any) => l.log_date === today)
                if (todaysLog?.symptoms) {
                    setSharedSymptoms(todaysLog.symptoms)
                } else {
                    setSharedSymptoms([])
                }

                setLoading(false)

                // Setup Subs if we have couple_id
                if (d.profile.couple_id && !channel) {
                    channel = supabase
                        .channel('lunara-changes-consolidated')
                        .on('postgres_changes', { event: '*', schema: 'public', table: 'cycle_profiles', filter: `couple_id=eq.${d.profile.couple_id}` }, loadData)
                        .on('postgres_changes', { event: '*', schema: 'public', table: 'cycle_logs', filter: `couple_id=eq.${d.profile.couple_id}` }, loadData)
                        .on('postgres_changes', { event: '*', schema: 'public', table: 'support_logs', filter: `couple_id=eq.${d.profile.couple_id}` }, loadData)
                        .subscribe()
                }
            } else {
                console.error("Failed to load dashboard data:", result.error)
                setLoading(false)
            }
        }

        loadData()

        return () => {
            if (channel) supabase.removeChannel(channel)
        }
    }, [])

    const getCycleDay = () => {
        if (!cycleProfile?.last_period_start) return null
        const start = startOfDay(new Date(cycleProfile.last_period_start))
        const today = startOfDay(new Date())
        const diff = differenceInDays(today, start)
        const cycleLength = cycleProfile.avg_cycle_length || 28
        return (diff % cycleLength) + 1
    }

    const getPhaseInfo = (day: number) => {
        if (day <= 5) return { name: "Menstrual Phase", color: "text-rose-400", advice: "Rest and warmth are key today." }
        if (day <= 13) return { name: "Follicular Phase", color: "text-emerald-400", advice: "You're likely feeling more energetic." }
        if (day === 14 || day === 15) return { name: "Ovulatory Phase", color: "text-amber-400", advice: "Energy and mood are at their peak." }
        return { name: "Luteal Phase", color: "text-indigo-400", advice: "Focus on gentle self-care and winding down." }
    }

    const getSuggestedSymptoms = (day: number) => {
        if (day <= 5) return ["Cramps", "Fatigue", "Back pain", "Headache"]
        if (day <= 13) return ["Energetic", "Positive", "Clean skin", "High libido"]
        if (day === 14 || day === 15) return ["Ovulation pain", "Bloating", "Tender breasts", "Peak energy"]
        return ["Mood swings", "Cravings", "Bloating", "Anxiety", "Tiredness"]
    }

    const getPartnerAdvice = (day: number) => {
        if (day <= 5) return "She likely needs physical comfort. Think hot water bottles, her favorite snacks, and gentle support."
        if (day <= 13) return "She's in her high-energy phase! Great time to try new things together or plan a creative date."
        if (day === 14 || day === 15) return "She's at her most outgoing. Perfect for social activities or a nice night out."
        return "She might be more sensitive to stress now. Extra patience and a listening ear go a long way today."
    }

    const currentDay = getCycleDay()
    const phase = currentDay ? getPhaseInfo(currentDay) : null
    const nextPeriodDate = cycleProfile?.last_period_start
        ? addDays(new Date(cycleProfile.last_period_start),
            (Math.floor(differenceInDays(new Date(), new Date(cycleProfile.last_period_start)) / (cycleProfile.avg_cycle_length || 28)) + 1) * (cycleProfile.avg_cycle_length || 28)
        )
        : null

    const { toast } = useToast()
    const router = useRouter()

    const handleOnboardingComplete = async (onboardingData: any) => {
        setLoading(true)
        try {
            const result = await saveLunaraOnboarding(onboardingData)
            if (result.success) {
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    const { data } = await supabase.from('cycle_profiles').select('*').eq('user_id', user.id).single()
                    console.log('LunaraDashboard refetched cycle:', data)
                    setCycleProfile(data)
                    toast({
                        title: "Sync Complete",
                        description: "Your Lunara cycle is now synchronized.",
                        variant: "success"
                    })
                    router.refresh()
                }
            } else {
                toast({
                    title: "Sync Failed",
                    description: result.error || "Please try again later.",
                    variant: "destructive"
                })
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "An unexpected error occurred.",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const handleToggleSharing = async (enabled: boolean) => {
        setIsSyncing(true)
        try {
            const result = await toggleLunaraSharing(enabled)
            if (result.success) {
                setCycleProfile((prev: any) => ({ ...prev, sharing_enabled: enabled }))
                toast({
                    title: enabled ? "Partner Sync Enabled" : "Sharing Paused",
                    description: enabled
                        ? "Your partner can now see your cycle status."
                        : "Your cycle data is now private.",
                    variant: enabled ? "success" : "default"
                })
            }
        } catch (error) {
            console.error('Error toggling sharing:', error)
        } finally {
            setIsSyncing(false)
        }
    }

    const handleLogPeriod = async () => {
        setIsLogging(true)
        try {
            const result = await logPeriodStart()
            if (result.success) {
                // Update local state for immediate feedback
                const today = getTodayIST()
                setCycleProfile((prev: any) => ({ ...prev, last_period_start: today }))

                toast({
                    title: "Period Logged",
                    description: "Your cycle starting today has been recorded.",
                    variant: "success"
                })
            } else {
                toast({
                    title: "Log Failed",
                    description: result.error || "Could not log period.",
                    variant: "destructive"
                })
            }
        } catch (error) {
            console.error('Error logging period:', error)
        } finally {
            setIsLogging(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                <p className="text-purple-200/40 uppercase tracking-widest text-[10px] font-bold">Synchronising with the moon...</p>
            </div>
        )
    }

    // Show onboarding ONLY if female and not completed
    if (profile?.gender === 'female' && !cycleProfile?.onboarding_completed) {
        return <LunaraOnboarding onComplete={handleOnboardingComplete} />
    }

    // Show specialized Lunara settings
    if (showSettings) {
        return (
            <LunaraSettings
                initialData={cycleProfile}
                onBack={() => setShowSettings(false)}
                onSave={async (newData) => {
                    // 1. Optimistic Update
                    setCycleProfile((prev: any) => ({
                        ...prev,
                        ...newData,
                        avg_cycle_length: parseInt(newData.cycleLength),
                        avg_period_length: parseInt(newData.periodLength),
                        sharing_enabled: newData.sharingEnabled,
                        last_period_start: newData.lastPeriodStart ? format(newData.lastPeriodStart, 'yyyy-MM-dd') : null
                    }))
                    setShowSettings(false)

                    // 2. Force Refresh to ensure server state is consistent
                    router.refresh()

                    // 3. Explicitly reload dashboard data to ensure we have the DB state
                    // (Small delay to allow DB propagation if needed, though server action should handle it)
                    setTimeout(() => {
                        const loadData = async () => {
                            const result = await fetchDashboardData()
                            if (result.success && result.data) {
                                setCycleProfile((prev: any) => ({ ...prev, ...result.data.userCycle }))
                            }
                        }
                        loadData()
                    }, 500)
                }}
            />
        )
    }

    return (
        <div className="max-w-7xl mx-auto space-y-12 pt-12 pb-40 px-6 md:px-8">

            {/* Lunara Brand Header */}
            <ScrollReveal className="space-y-4 text-center lg:text-left relative">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-200/90 text-[10px] uppercase tracking-[0.3em] font-bold backdrop-blur-md shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                            <Sparkles className="w-3 h-3 text-purple-400" />
                            Lunara Sync
                        </div>
                        <h1 className="text-4xl md:text-7xl font-serif text-white leading-[1.1] tracking-tight">
                            Your Natural
                            <br />
                            <span className="bg-gradient-to-r from-purple-300 via-indigo-300 to-purple-200 bg-clip-text text-transparent drop-shadow-sm italic">
                                Flow & Rhythm
                            </span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-4 justify-center md:justify-end">

                        {profile?.gender === 'female' && (
                            <Button
                                variant="ghost"
                                onClick={() => setShowSettings(true)}
                                className="hidden md:flex group relative items-center gap-2 px-6 py-6 rounded-2xl bg-purple-950/20 border border-purple-500/20 text-purple-200 hover:text-white hover:bg-purple-900/40 transition-all shadow-xl"
                            >
                                <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500 text-purple-400" />
                                <div className="text-left">
                                    <p className="text-[10px] uppercase tracking-widest font-bold opacity-50">Manage</p>
                                    <p className="text-sm font-bold">Cycle Settings</p>
                                </div>
                            </Button>
                        )}
                    </div>
                </div>

            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Main Cycle Widget */}
                <ScrollReveal className="lg:col-span-2 row-span-2" delay={0.1}>
                    <div className="glass-card p-10 flex flex-col items-center justify-center h-full relative overflow-hidden group border-purple-500/20 bg-purple-950/20">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-50" />

                        {/* Settings gear icon - mobile only, in card top-right */}
                        {profile?.gender === 'female' && (
                            <button
                                onClick={() => setShowSettings(true)}
                                className="md:hidden absolute top-4 right-4 z-10 p-2 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30 transition-all"
                            >
                                <Settings className="w-4 h-4" />
                            </button>
                        )}

                        <div className="relative w-64 h-64 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full border-4 border-dashed border-purple-500/10 animate-spin-slow" />
                            <div className="absolute inset-4 rounded-full border-2 border-purple-500/20" />

                            <div className="flex flex-col items-center text-center space-y-2 relative z-10">
                                <Moon className={cn("w-12 h-12 mb-2", phase?.color || "text-purple-300")} />
                                <span className="text-5xl font-bold text-white">
                                    {profile?.gender === 'female'
                                        ? (currentDay ? `Day ${currentDay}` : 'Rhythm')
                                        : (currentDay && cycleProfile?.sharing_enabled
                                            ? `Day ${currentDay}`
                                            : 'Support Mode')}
                                </span>
                                {cycleProfile?.last_period_start && (
                                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] -mt-1">
                                        Last: {format(new Date(cycleProfile.last_period_start), "MMM dd, yyyy")}
                                    </span>
                                )}
                                <span className={cn("text-[10px] uppercase tracking-[0.2em] font-bold", phase?.color || "text-purple-300/60")}>
                                    {(profile?.gender === 'female' || cycleProfile?.sharing_enabled) && phase?.name
                                        ? phase.name
                                        : (profile?.gender === 'female' ? 'Calculating...' : 'Partner Sync Active')}
                                </span>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-4">
                            {profile?.gender === 'female' ? (
                                <button
                                    onClick={handleLogPeriod}
                                    disabled={isLogging}
                                    className="px-6 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-200 text-xs font-bold uppercase tracking-widest cursor-pointer hover:bg-purple-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isLogging && <Loader2 className="w-3 h-3 animate-spin" />}
                                    Log Period
                                </button>
                            ) : (
                                <div
                                    onClick={() => setShowSupportModal(true)}
                                    className="px-6 py-2 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-200 text-xs font-bold uppercase tracking-widest cursor-pointer hover:bg-rose-500/20 transition-all shadow-lg active:scale-95 duration-200"
                                >
                                    How to Support
                                </div>
                            )}
                        </div>

                        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full" />
                    </div>
                </ScrollReveal>

                {/* Daily Supportive Insight */}
                <ScrollReveal className="lg:col-span-2" delay={0.2}>
                    <div className="glass-card p-8 bg-black/40 border-white/5 h-full relative overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                            <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">
                                {profile?.gender === 'female' ? 'Daily Insight' : 'Partner Advice'}
                            </span>
                            <ShieldCheck className="w-4 h-4 text-purple-400/50" />
                        </div>
                        <p className="text-xl text-purple-50 italic font-serif leading-relaxed">
                            {profile?.gender === 'female'
                                ? (phase?.advice || '"Track your daily wellness to get personalized cycle insights and tips."')
                                : (currentDay && cycleProfile?.sharing_enabled
                                    ? getPartnerAdvice(currentDay)
                                    : '"When your partner shares her cycle info, you\'ll see tailored tips here on how to support her."')
                            }
                        </p>
                    </div>
                </ScrollReveal>

                {/* Quick Stats */}
                <ScrollReveal className="lg:col-span-1" delay={0.3}>
                    <div className="glass-card p-6 bg-purple-900/10 border-purple-500/10 h-full">
                        <Calendar className="w-6 h-6 text-purple-400 mb-4" />
                        <span className="block text-2xl font-bold text-white">
                            {nextPeriodDate ? format(nextPeriodDate, "MMM dd") : "—"}
                        </span>
                        <span className="text-[10px] uppercase tracking-widest font-bold text-white/30">Next Period</span>
                    </div>
                </ScrollReveal>



                {/* Partner Symptoms / Recent Logs */}
                <ScrollReveal className="lg:col-span-1" delay={0.45}>
                    <div className="glass-card p-6 bg-purple-900/10 border-purple-500/10 h-full">
                        <Bell className="w-6 h-6 text-purple-400 mb-4" />
                        <span className="block text-lg font-bold text-white uppercase tracking-tight">
                            {profile?.gender === 'female' ? 'Your Logs' : 'Her Status'}
                        </span>
                        <div className="mt-2 space-y-1">
                            {profile?.gender === 'female' ? (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {currentDay && getSuggestedSymptoms(currentDay).map(s => {
                                        const isShared = sharedSymptoms.includes(s)
                                        return (
                                            <button
                                                key={s}
                                                onClick={async () => {
                                                    const newSymptoms = sharedSymptoms.includes(s)
                                                        ? sharedSymptoms.filter(sym => sym !== s)
                                                        : [...sharedSymptoms, s]

                                                    setSharedSymptoms(newSymptoms) // Optimistic update
                                                    const result = await logSymptoms(newSymptoms) // Server sync

                                                    if (result.error) {
                                                        toast({
                                                            title: "Save Failed",
                                                            description: "Could not save symptoms. Please try again.",
                                                            variant: "destructive"
                                                        })
                                                        // Revert optimistic update? Optional, but safer to leave for now as it might succeed next time.
                                                    }
                                                }}
                                                className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tight transition-all active:scale-95 ${isShared
                                                    ? 'bg-purple-500/30 border-2 border-purple-400 text-purple-200 shadow-[0_0_8px_rgba(168,85,247,0.4)]'
                                                    : 'bg-purple-500/5 border border-purple-500/20 text-purple-300/50'
                                                    }`}
                                            >
                                                {s}
                                            </button>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {sharedSymptoms.length > 0 ? (
                                        sharedSymptoms.map(s => (
                                            <span key={s} className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-[9px] text-purple-200 font-bold uppercase tracking-tight">
                                                {s}
                                            </span>
                                        ))
                                    ) : (
                                        <p className="text-[10px] text-purple-200/20 uppercase font-bold">No symptoms shared yet</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollReveal>
            </div>

            {/* Support History Section */}
            <ScrollReveal className="w-full" delay={0.5}>
                <div className="glass-card p-8 bg-rose-950/10 border-rose-500/10 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-rose-500/10">
                                <Heart className="w-5 h-5 text-rose-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Support History</h3>
                                <p className="text-xs text-rose-300/50 uppercase tracking-widest font-bold">Recent gestures of love</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {supportLogs.length > 0 ? supportLogs.map((log: any) => (
                            <div key={log.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] text-rose-400 uppercase font-bold tracking-tighter">
                                        {log.category || 'Support'}
                                    </span>
                                    <span className="text-[10px] text-zinc-600 font-bold">
                                        {format(new Date(log.log_date), "MMM d")}
                                    </span>
                                </div>
                                <p className="text-sm text-zinc-300 group-hover:text-white transition-colors">
                                    {log.supporter_id === profile?.id ? 'You' : 'Partner'} {log.action_text}
                                </p>
                            </div>
                        )) : (
                            <div className="col-span-full py-8 text-center border-2 border-dashed border-white/5 rounded-3xl">
                                <p className="text-sm text-zinc-600 italic">No support actions logged yet. Start small today.</p>
                            </div>
                        )}
                    </div>
                </div>
            </ScrollReveal>

            {/* Coming Soon Message */}
            <div className="text-center py-10 opacity-30">
                <p className="text-sm italic tracking-widest uppercase">Deep body insights & Log history coming soon</p>
            </div>

            <SupportModal
                isOpen={showSupportModal}
                onClose={async () => {
                    setShowSupportModal(false)
                    // Refresh logs - Use couple_id for consistency with initial fetch
                    const { data: logs } = await supabase
                        .from('support_logs')
                        .select('*')
                        .eq('couple_id', profile?.couple_id)
                        .order('created_at', { ascending: false })
                        .limit(6)
                    setSupportLogs(logs || [])
                }}
                phase={phase?.name || "Support"}
                day={currentDay || 1}
                partnerName={profile?.gender === 'female' ? (partnerProfile?.display_name || 'Partner') : (partnerProfile?.display_name || 'Partner')}
                partnerId={profile?.gender === 'female' ? profile.id : (partnerId || '')}
            />
        </div>
    )
}


