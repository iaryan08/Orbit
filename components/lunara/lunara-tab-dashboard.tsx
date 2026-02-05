'use client'

import React from 'react'
import { Moon, Calendar, Sparkles, Plus, Activity, Heart, Info, Loader2, Settings, Bell, Flame } from 'lucide-react'
import { differenceInDays, addDays, format, startOfDay } from 'date-fns'
import { motion } from 'framer-motion'
import { cn, getTodayIST } from '@/lib/utils'
import { ScrollReveal } from '@/components/scroll-reveal'
import { Button } from '@/components/ui/button'
import { LunaraSettings } from '../lunara-settings'
import { logPeriodStart, logSymptoms } from '@/lib/actions/auth'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { CycleCalendar } from './cycle-calendar'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip'

export function LunaraTabDashboard({ data }: { data: any }) {
    const { profile, userCycle, partnerCycle, cycleLogs, currentDateIST } = data
    // Local state for immediate updates
    const [cycleProfile, setCycleProfile] = React.useState<any>(
        profile.gender === 'female' ? userCycle : partnerCycle
    )
    const [showSettings, setShowSettings] = React.useState(false)
    const [isLogging, setIsLogging] = React.useState(false)

    // Find partner libido for the alert
    const partnerId = profile.partner_id
    const partnerLog = cycleLogs?.find((l: any) => l.user_id === partnerId && l.log_date === (currentDateIST || getTodayIST()))
    const partnerLibido = partnerLog?.sex_drive

    // Find the LATEST log for the person being tracked (within 24h rolling window)
    const trackedUserId = profile.gender === 'female' ? profile.id : profile.partner_id
    // cycleLogs is already filtered by 24h updated_at and sorted DESC in server action
    const latestLog = cycleLogs?.find((l: any) => l.user_id === trackedUserId)

    const [selectedSymptoms, setSelectedSymptoms] = React.useState<string[]>(
        latestLog?.symptoms || []
    )
    const [isSavingSymptoms, setIsSavingSymptoms] = React.useState(false)
    const [showCustomInput, setShowCustomInput] = React.useState(false)
    const [customValue, setCustomValue] = React.useState('')
    const { toast } = useToast()
    const router = useRouter()

    React.useEffect(() => {
        setCycleProfile(profile.gender === 'female' ? userCycle : partnerCycle)
        // Sync symptoms if fresh data comes in
        if (latestLog) {
            setSelectedSymptoms(latestLog.symptoms || [])
        }
    }, [userCycle, partnerCycle, profile.gender, latestLog])

    const getCycleDay = () => {
        if (!cycleProfile?.last_period_start) return null
        const start = startOfDay(new Date(cycleProfile.last_period_start))
        const today = startOfDay(new Date())
        const diff = differenceInDays(today, start)
        const cycleLength = cycleProfile.avg_cycle_length || 28
        return (diff % cycleLength) + 1
    }

    const getPhaseInfo = (day: number) => {
        const phases = [
            {
                name: "Menstrual Phase",
                color: "text-rose-400",
                female: [
                    "Your body is working hard. Prioritize deep rest, warm teas, and iron-rich meals.",
                    "Focus on your inner world. It's okay to decline social invites. Magnesium is your best friend today.",
                    "Gentle heat and restorative movements will soothe you. Honor your need for boundaries and softness."
                ],
                male: [
                    "Comfort is everything. Keep her environment warm and have her favorite snacks ready.",
                    "Offer gentle physical comfort without expectations. Think hot water bottles and soft blankets.",
                    "Patience is your superpower today. Listen deeply and provide a steady, grounding presence."
                ]
            },
            {
                name: "Follicular Phase",
                color: "text-emerald-400",
                female: [
                    "A surge of creativity and optimism is blooming. Perfect time to start a new project.",
                    "Harness your rising ambition. Your brain is primed for learning and socializing.",
                    "You're feeling a fresh wave of energy. Try a new workout or a bold creative challenge today."
                ],
                male: [
                    "She's feeling a fresh wave of energy. Surprise her with an active date—a hike or a new restaurant.",
                    "Match her rising optimism. Be her biggest cheerleader as she starts new projects or ideas.",
                    "Social energy is high. Suggest a double date or a fun evening out with friends."
                ]
            },
            {
                name: "Ovulatory Phase",
                color: "text-amber-400",
                female: [
                    "You're at your most vibrant and magnetic. Use this peak energy for important social events.",
                    "Your communication is at its most persuasive and clear. Be open about your deepest desires.",
                    "You're radiating confidence. This is a great time for deep connection and bold moves."
                ],
                male: [
                    "This is her most magnetic phase. Compliment her sincerely and plan a romantic evening.",
                    "Match her peak energy with quality presence and passion. She's feeling vibrant and seen.",
                    "Confidence is peaking. Major romance points for compliments and high-energy quality time."
                ]
            },
            {
                name: "Luteal Phase",
                color: "text-indigo-400",
                female: [
                    "The season of grounding. Honor your need for nesting and restorative, gentle movement.",
                    "Prioritize self-care and protein-rich meals to help stabilize your mood as energy dips.",
                    "Peaceful boundaries are vital now. Create a relaxing environment and finish up pending tasks."
                ],
                male: [
                    "Patience and emotional safety are vital now. Take over household chores without being asked.",
                    "Listen without trying to 'fix' things. Provide a steady, grounding presence as her energy shifts.",
                    "Be extra gentle today. Physical comfort and a listening ear go a long way in this phase."
                ]
            }
        ]

        if (day <= 5) return phases[0]
        if (day <= 13) return phases[1]
        if (day === 14 || day === 15) return phases[2]
        return phases[3]
    }


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

    const toggleSymptom = async (symptom: string) => {
        if (profile.gender !== 'female') return

        const newSymptoms = selectedSymptoms.includes(symptom)
            ? selectedSymptoms.filter(s => s !== symptom)
            : [...selectedSymptoms, symptom]

        setSelectedSymptoms(newSymptoms)
        setIsSavingSymptoms(true)

        try {
            const result = await logSymptoms(newSymptoms)
            if (!result.success) {
                toast({ title: "Update Failed", variant: "destructive" })
                // Revert on failure
                setSelectedSymptoms(selectedSymptoms)
            } else {
                router.refresh()
            }
        } catch (e) {
            console.error(e)
            setSelectedSymptoms(selectedSymptoms)
        } finally {
            setIsSavingSymptoms(false)
        }
    }

    const handleAddCustomSymptom = async () => {
        if (!customValue.trim()) return
        const symptom = customValue.trim()
        if (!selectedSymptoms.includes(symptom)) {
            const newSymptoms = [...selectedSymptoms, symptom]
            setSelectedSymptoms(newSymptoms)
            setIsSavingSymptoms(true)
            const result = await logSymptoms(newSymptoms)
            if (!result.success) {
                toast({ title: "Update Failed", variant: "destructive" })
                setSelectedSymptoms(selectedSymptoms)
            } else {
                router.refresh()
            }
            setIsSavingSymptoms(false)
        }
        setCustomValue('')
        setShowCustomInput(false)
    }

    const getPregnancyChance = (day: number) => {
        // Based on a standard 28-day cycle approximation
        if (day === 14) return { level: "Very High", color: "text-rose-500" }
        if (day >= 12 && day <= 15) return { level: "High", color: "text-rose-400" }
        if (day >= 10 && day <= 17) return { level: "Medium", color: "text-amber-400" }
        return { level: "Low", color: "text-emerald-400" }
    }

    const triggerHaptic = () => {
        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(10)
        }
    }


    const currentDay = getCycleDay()
    const phase = currentDay ? getPhaseInfo(currentDay) : null
    const chance = currentDay ? getPregnancyChance(currentDay) : { level: "—", color: "text-white/20" }

    // Logic for frequently refreshing advice
    const getInsightContent = () => {
        if (!phase) return "Stay synced and supportive."

        // Use current date to pick an index (0, 1, or 2)
        const now = new Date()
        const index = now.getDate() % 3

        return profile.gender === 'female' ? phase.female[index] : phase.male[index]
    }

    const dailyInsight = getInsightContent()

    const nextPeriodDate = cycleProfile?.last_period_start
        ? addDays(new Date(cycleProfile.last_period_start),
            (Math.floor(differenceInDays(new Date(), new Date(cycleProfile.last_period_start)) / (cycleProfile.avg_cycle_length || 28)) + 1) * (cycleProfile.avg_cycle_length || 28)
        )
        : null

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
        <div className="space-y-8 pb-20">
            {/* Libido Alert (Only if High) - High Priority */}
            {partnerLibido === 'very_high' && (
                <ScrollReveal className="w-full" delay={0}>
                    <div className="glass-card p-6 bg-gradient-to-r from-orange-600/30 to-red-600/30 border-orange-500/50 flex items-center justify-between relative overflow-hidden group shadow-[0_0_30px_rgba(234,88,12,0.2)]">
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-600/10 animate-pulse" />
                        {/* Fire particles effect overlay */}
                        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-overlay" />

                        <div className="relative z-10 flex w-full items-center gap-6 justify-center md:justify-start text-center md:text-left">
                            <div className="relative shrink-0">
                                <div className="absolute inset-0 bg-orange-500/40 blur-xl rounded-full animate-pulse" />
                                <div className="p-3 rounded-full bg-orange-500/20 border border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.6)] relative z-10">
                                    <Flame className="w-8 h-8 text-orange-500 drop-shadow-[0_0_10px_rgba(255,165,0,0.8)] animate-pulse" fill="currentColor" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-1 drop-shadow-md">Intense Passion Alert</h3>
                                <p className="text-white/90 italic font-medium text-sm">
                                    {profile?.gender === 'female' ? "He's feeling a burning desire for you right now." : "She's feeling a burning desire for you right now."}
                                </p>
                            </div>
                        </div>
                    </div>
                </ScrollReveal>
            )}
            {/* 1. Main Cycle Widget (Hero - Day Count) */}
            <ScrollReveal className="w-full">
                <div className="glass-card p-6 sm:p-10 flex flex-col items-center justify-center relative overflow-hidden group border-purple-500/20 bg-purple-950/20 transition-all hover:bg-purple-900/10 shadow-xl">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-50" />

                    {profile?.gender === 'female' && (
                        <button
                            onClick={() => setShowSettings(true)}
                            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:bg-purple-500/20 transition-all scale-90 sm:scale-100"
                        >
                            <Settings className="w-4 h-4" />
                        </button>
                    )}

                    <div className="relative w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-4 border-dashed border-purple-500/10 animate-spin-slow" />
                        <div className="absolute inset-4 rounded-full border-2 border-purple-500/20" />

                        <div className="flex flex-col items-center text-center space-y-1 sm:space-y-2 relative z-10">
                            <Moon className={cn("w-8 h-8 sm:w-12 sm:h-12 mb-1 sm:mb-2", phase?.color || "text-purple-300")} />
                            <span className="text-4xl sm:text-5xl font-bold text-white">
                                {profile?.gender === 'female'
                                    ? (currentDay ? `Day ${currentDay}` : 'Rhythm')
                                    : (currentDay && (cycleProfile?.sharing_enabled || cycleProfile?.privacy_level !== 'hidden')
                                        ? `Day ${currentDay}`
                                        : 'Support Mode')}
                            </span>
                            {cycleProfile?.last_period_start && (
                                <span className="text-[9px] sm:text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] pt-1">
                                    {format(new Date(cycleProfile.last_period_start), "MMM dd, yyyy")}
                                </span>
                            )}
                            <span className={cn("text-[8px] sm:text-[10px] uppercase tracking-[0.2em] font-bold", phase?.color || "text-purple-300/60")}>
                                {(profile?.gender === 'female' || cycleProfile?.sharing_enabled) && phase?.name
                                    ? phase.name
                                    : 'Partner Sync'}
                            </span>
                        </div>
                    </div>

                    <div className="mt-6 sm:mt-8 flex gap-4">
                        {profile?.gender === 'female' && (
                            <motion.button
                                onClick={handleLogPeriod}
                                whileTap={{ scale: 0.92 }}
                                onTapStart={triggerHaptic}
                                disabled={isLogging}
                                className="px-5 py-2 sm:px-6 sm:py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-200 text-[10px] sm:text-xs font-bold uppercase tracking-widest cursor-pointer hover:bg-purple-500/20 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-purple-500/5"
                            >
                                {isLogging && <Loader2 className="w-3 h-3 animate-spin" />}
                                Log Period
                            </motion.button>
                        )}
                    </div>
                </div>
            </ScrollReveal>

            {/* 2. Horizontal Calendar "Flo-style" Strip */}
            <ScrollReveal delay={0.1}>
                <div className="glass-card py-6 bg-purple-950/20 border-purple-500/20 shadow-xl shadow-purple-500/5">
                    <CycleCalendar cycleProfile={cycleProfile} />
                </div>
            </ScrollReveal>

            {/* 3. Insights Grid: Merged for Clarity and Freshness */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* 1. Log Symptoms Card */}
                <ScrollReveal delay={0.2}>
                    <div className="glass-card p-6 bg-purple-950/20 border-purple-500/20 h-full flex flex-col items-start relative overflow-hidden group hover:bg-purple-900/10 transition-all duration-500">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-300">
                                <Bell className="w-4 h-4" />
                            </div>
                            <h4 className="text-sm font-bold text-white/90 leading-tight">
                                {profile.gender === 'female' ? "How are you feeling?" : "How She's Feeling"}
                            </h4>
                        </div>

                        {profile.gender === 'female' ? (
                            <>
                                <div className="flex flex-wrap gap-2.5 mb-6">
                                    {["Cramps", "Fatigue", "Back Pain", "Headache", "Mood Swings", ...selectedSymptoms.filter(s => !["Cramps", "Fatigue", "Back Pain", "Headache", "Mood Swings"].includes(s))].map(s => (
                                        <motion.button
                                            key={s}
                                            onClick={() => toggleSymptom(s)}
                                            whileTap={{ scale: 0.9 }}
                                            onTapStart={triggerHaptic}
                                            className={cn(
                                                "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border",
                                                selectedSymptoms.includes(s)
                                                    ? "bg-purple-500/20 border-purple-400/50 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                                                    : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
                                            )}
                                        >
                                            {s}
                                        </motion.button>
                                    ))}
                                </div>

                                {showCustomInput ? (
                                    <div className="flex items-center gap-2 mb-4 w-full h-10">
                                        <input
                                            autoFocus
                                            type="text"
                                            value={customValue}
                                            onChange={(e) => setCustomValue(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddCustomSymptom()}
                                            className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 text-xs text-white outline-none focus:border-purple-500/40 transition-all h-full"
                                            placeholder="Enter symptom..."
                                        />
                                        <button
                                            onClick={handleAddCustomSymptom}
                                            className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center hover:bg-purple-400 transition-all shrink-0"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="mt-auto pt-4 border-t border-white/5 w-full flex items-center justify-between">
                                        <button
                                            onClick={() => setShowCustomInput(true)}
                                            className="text-[10px] text-white/40 font-bold uppercase tracking-widest hover:text-white/80 transition-all flex items-center gap-2"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            {isSavingSymptoms ? 'Syncing...' : 'Add custom symptom'}
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col">
                                {latestLog?.symptoms?.length > 0 ? (
                                    <div className="flex flex-wrap gap-2.5">
                                        {latestLog.symptoms.map((s: string) => (
                                            <div key={s} className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-purple-500/20 border border-purple-400/50 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                                                {s}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-white/40 italic my-auto">
                                        She hasn't logged any symptoms in the last 24h.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </ScrollReveal>

                {/* 2. Pregnancy Chance Card */}
                <ScrollReveal delay={0.25}>
                    <div className="glass-card p-6 bg-purple-950/20 border-purple-500/20 h-full flex flex-col justify-center items-center text-center shadow-lg group hover:bg-purple-900/10 transition-all duration-500">
                        <Activity className="w-6 h-6 text-rose-400 mb-4 group-hover:scale-110 transition-transform" />
                        <h3 className="text-[10px] uppercase tracking-widest font-bold text-white/60 mb-1">Pregnancy Chance</h3>

                        <div className="relative mt-2 mb-4">
                            <span className={cn("text-4xl font-black uppercase tracking-tighter", chance.color)}>
                                {chance.level}
                            </span>
                            <div className="flex gap-1.5 justify-center mt-3">
                                <span className={cn("w-2 h-2 rounded-full transition-all duration-500 bg-white/10", chance.level === 'Low' && "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]")} />
                                <span className={cn("w-2 h-2 rounded-full transition-all duration-500 bg-white/10", chance.level === 'Medium' && "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]")} />
                                <span className={cn("w-2 h-2 rounded-full transition-all duration-500 bg-white/10", chance.level === 'High' && "bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.6)]")} />
                                <span className={cn("w-2 h-2 rounded-full transition-all duration-500 bg-white/10", chance.level === 'Very High' && "bg-rose-600 shadow-[0_0_15px_rgba(225,29,72,0.8)] scale-125")} />
                            </div>
                        </div>
                    </div>
                </ScrollReveal>

                {/* 3. Merged Daily Insight Card (Spans 2 columns) */}
                <ScrollReveal delay={0.3} className="lg:col-span-2">
                    <div className="glass-card p-8 bg-purple-950/20 border-purple-500/20 h-full relative overflow-hidden flex flex-col justify-center shadow-lg hover:bg-purple-900/10 transition-colors group">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                            {profile.gender === 'female' ? <Sparkles className="w-16 h-16 text-purple-300" /> : <Heart className="w-16 h-16 text-rose-400" />}
                        </div>
                        <h3 className="text-[10px] uppercase tracking-widest font-bold text-white/60 mb-4 flex items-center gap-2">
                            {profile.gender === 'female' ? "DAILY ADVICE" : "HOW YOU CAN HELP"}
                        </h3>
                        <p className="text-base sm:text-xl text-purple-50 font-medium italic font-serif leading-relaxed">
                            "{dailyInsight}"
                        </p>
                        <div className="mt-6 flex items-center gap-2">
                            <div className="w-8 h-1 bg-purple-500/40 rounded-full" />
                        </div>
                    </div>
                </ScrollReveal>
            </div>
        </div>
    )
}
