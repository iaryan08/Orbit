'use client'

import React from 'react'
import { Moon, Calendar } from 'lucide-react'
import { differenceInDays, addDays, format, startOfDay } from 'date-fns'
import { cn, getTodayIST } from '@/lib/utils'
import { ScrollReveal } from '@/components/scroll-reveal'
import { Button } from '@/components/ui/button'
import { Loader2, Settings } from 'lucide-react'
import { LunaraSettings } from '../lunara-settings'
import { logPeriodStart } from '@/lib/actions/auth'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

export function LunaraTabDashboard({ data }: { data: any }) {
    const { profile, userCycle, partnerCycle } = data
    // Local state for immediate updates
    const [cycleProfile, setCycleProfile] = React.useState<any>(
        profile.gender === 'female' ? userCycle : partnerCycle
    )
    const [showSettings, setShowSettings] = React.useState(false)
    const [isLogging, setIsLogging] = React.useState(false)
    const { toast } = useToast()
    const router = useRouter()

    React.useEffect(() => {
        setCycleProfile(profile.gender === 'female' ? userCycle : partnerCycle)
    }, [userCycle, partnerCycle, profile.gender])

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

    const currentDay = getCycleDay()
    const phase = currentDay ? getPhaseInfo(currentDay) : null
    const nextPeriodDate = cycleProfile?.last_period_start
        ? addDays(new Date(cycleProfile.last_period_start),
            (Math.floor(differenceInDays(new Date(), new Date(cycleProfile.last_period_start)) / (cycleProfile.avg_cycle_length || 28)) + 1) * (cycleProfile.avg_cycle_length || 28)
        )
        : null

    const handleLogPeriod = async () => {
        setIsLogging(true)
        try {
            const result = await logPeriodStart()
            if (result.success) {
                const today = getTodayIST()
                setCycleProfile((prev: any) => ({ ...prev, last_period_start: today }))
                toast({ title: "Period Logged", variant: "success" })
                router.refresh()
            } else {
                toast({ title: "Log Failed", variant: "destructive" })
            }
        } finally {
            setIsLogging(false)
        }
    }

    if (showSettings) {
        return (
            <LunaraSettings
                initialData={cycleProfile}
                onBack={() => setShowSettings(false)}
                onSave={(newData) => {
                    setCycleProfile((prev: any) => ({ ...prev, ...newData }))
                    setShowSettings(false)
                    router.refresh()
                }}
            />
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Main Cycle Widget */}
            <ScrollReveal className="lg:col-span-2 row-span-2" delay={0.1}>
                <div className="glass-card p-10 flex flex-col items-center justify-center h-full relative overflow-hidden group border-purple-500/20 bg-purple-950/20 transition-all hover:bg-purple-900/20">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-50" />

                    {profile?.gender === 'female' && (
                        <button
                            onClick={() => setShowSettings(true)}
                            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:bg-purple-500/20 transition-all"
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
                                    : (currentDay && (cycleProfile?.sharing_enabled || cycleProfile?.privacy_level !== 'hidden')
                                        ? `Day ${currentDay}`
                                        : 'Support Mode')}
                            </span>
                            {cycleProfile?.last_period_start && (
                                <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] pt-1">
                                    {format(new Date(cycleProfile.last_period_start), "MMM dd, yyyy")}
                                </span>
                            )}
                            <span className={cn("text-[10px] uppercase tracking-[0.2em] font-bold", phase?.color || "text-purple-300/60")}>
                                {(profile?.gender === 'female' || cycleProfile?.sharing_enabled) && phase?.name
                                    ? phase.name
                                    : 'Partner Sync'}
                            </span>
                        </div>
                    </div>

                    <div className="mt-8 flex gap-4">
                        {profile?.gender === 'female' && (
                            <button
                                onClick={handleLogPeriod}
                                disabled={isLogging}
                                className="px-6 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-200 text-xs font-bold uppercase tracking-widest cursor-pointer hover:bg-purple-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {isLogging && <Loader2 className="w-3 h-3 animate-spin" />}
                                Log Period
                            </button>
                        )}
                    </div>
                </div>
            </ScrollReveal>

            {/* Quick Stats / Next Period */}
            <ScrollReveal className="lg:col-span-1" delay={0.2}>
                <div className="glass-card p-6 bg-purple-900/10 border-purple-500/10 h-full flex flex-col justify-center">
                    <Calendar className="w-6 h-6 text-purple-400 mb-4" />
                    <span className="block text-2xl font-bold text-white">
                        {nextPeriodDate ? format(nextPeriodDate, "MMM dd") : "—"}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest font-bold text-white/30">Next Period</span>
                    <div className="mt-4 pt-4 border-t border-purple-500/10">
                        <span className="text-[10px] text-purple-200/50">Likely Ovulation: {nextPeriodDate ? format(addDays(nextPeriodDate, -14), "MMM dd") : "—"}</span>
                    </div>
                </div>
            </ScrollReveal>

            {/* Daily Phase Insight  */}
            <ScrollReveal className="lg:col-span-1" delay={0.3}>
                <div className="glass-card p-6 bg-black/40 border-white/5 h-full relative overflow-hidden flex flex-col justify-center">
                    <h3 className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-3">Daily Rhythm</h3>
                    <p className="text-lg text-purple-50 italic font-serif leading-relaxed">
                        {phase?.advice || "Track to unlock personalized insights."}
                    </p>
                </div>
            </ScrollReveal>
        </div>
    )
}
