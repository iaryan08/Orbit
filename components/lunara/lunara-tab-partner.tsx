'use client'

import React from 'react'
import { Heart, Bell, Activity, Sparkles } from 'lucide-react'
import { format, differenceInDays, startOfDay } from 'date-fns'
import { useRouter } from 'next/navigation'
import { ScrollReveal } from '@/components/scroll-reveal'
import { logSexDrive, logSupportAction, logSymptoms } from '@/lib/actions/auth'
import { getTodayIST } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { SupportModal } from '../support-modal'
import { motion, AnimatePresence } from 'framer-motion'
import { LibidoMeter } from './libido-meter'
import { LibidoSlider } from './libido-slider'

export function LunaraTabPartner({ data }: { data: any }) {
    const router = useRouter()
    const { profile, partnerProfile, supportLogs, cycleLogs, userCycle, partnerCycle, currentDateIST } = data
    // Determine which cycle to show for specific stats
    // Logic: If I am male, I want to see Her cycle stats (partnerCycle).
    // If I am female, I want to see My cycle stats? Or maybe Partner tab is about THEM?
    // User Request: "Partner" tab.
    // I. Tips for Menstrual Health/ Insights [what male can do for her & female have to do]
    // II. You Logs/ Symptoms [what you're feeling] -> Wait, "You Logs" sounds like MY logs.
    // III. Support history
    // IV. Your & Partner Sex Drive

    // Let's interpret "Partner" tab as "Connection & Sync" tab.
    // It shows:
    // 1. Tips for supporting each other (based on HER cycle).
    // 2. MY symptoms (logging).
    // 3. Support History.
    // 4. Sex Drive (Connection).

    const [sharedSymptoms, setSharedSymptoms] = React.useState<string[]>([])
    const [mySexDrive, setMySexDrive] = React.useState<string | null>(null)
    const [partnerSexDrive, setPartnerSexDrive] = React.useState<string | null>(null)
    const [showSupportModal, setShowSupportModal] = React.useState(false)
    const { toast } = useToast()

    // relevant cycle logic
    const isFemale = profile.gender === 'female'
    const herCycle = isFemale ? userCycle : partnerCycle
    const herProfile = isFemale ? profile : partnerProfile
    const myName = profile.display_name
    const partnerName = partnerProfile?.display_name || 'Partner'

    // Calculate Cycle Day
    const getCycleDay = () => {
        if (!herCycle?.last_period_start) return null
        const start = startOfDay(new Date(herCycle.last_period_start))
        const today = startOfDay(new Date())
        const diff = differenceInDays(today, start)
        const cycleLength = herCycle.avg_cycle_length || 28
        return (diff % cycleLength) + 1
    }
    const currentDay = getCycleDay()

    // Tips for Support (Male View)
    const getSupportAdvice = (day: number) => {
        if (day <= 5) return `During her period, ${partnerName} might appreciate extra rest and comfort. A warm tea or taking over chores would mean a lot today.`
        if (day <= 13) return `${partnerName} is in her follicular phase—energy is rising! Plan something active or a surprise date.`
        if (day === 14 || day === 15) return `She's likely ovulating. This is her peak social and energetic time—make the most of it together!`
        return `She's in her luteal phase. Extra patience and listening are key. Maybe surprise her with her favorite comfort food?`
    }

    // Tips for Wellness (Female View)
    const getWellnessAdvice = (day: number) => {
        if (day <= 5) return "Be gentle with yourself. Focus on hydration, slow movement, and early nights. Your body is doing hard work."
        if (day <= 13) return "Your creative energy is peaking! It's a great time to start new projects or have deep conversations."
        if (day === 14 || day === 15) return "You're at your most outgoing—embrace it. Great time for social connections and feeling confident."
        return "You might feel more introspective. Prioritize self-care and communicate your needs clearly to your partner."
    }

    // Sync state with incoming props data (Realtime updates from parent)
    React.useEffect(() => {
        // cycleLogs is already filtered by 24h updated_at and sorted DESC in server action

        // Update My Logs
        const myLog = cycleLogs?.find((l: any) => l.user_id === profile.id)
        if (myLog) {
            setSharedSymptoms(myLog.symptoms || [])
            setMySexDrive(myLog.sex_drive || null)
        } else {
            setSharedSymptoms([])
            setMySexDrive(null)
        }

        // Update Partner Logs
        const partnerLog = cycleLogs?.find((l: any) => l.user_id === partnerProfile?.id)
        if (partnerLog) {
            setPartnerSexDrive(partnerLog.sex_drive || null)
        } else {
            setPartnerSexDrive(null)
        }
    }, [data, cycleLogs, profile.id, partnerProfile?.id])

    const getSuggestedSymptoms = (day: number) => {
        if (!isFemale) return ["Stressed", "Happy", "Tired", "Energetic", "Calm", "Anxious", "Inspired"]
        if (day <= 5) return ["Cramps", "Fatigue", "Back pain", "Headache", "Mood swings"]
        if (day <= 13) return ["Energetic", "Positive", "Clean skin", "High libido", "Happy"]
        if (day === 14 || day === 15) return ["Ovulation pain", "Bloating", "Tender breasts", "Peak energy"]
        return ["Mood swings", "Cravings", "Bloating", "Anxiety", "Tiredness"]
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto px-4">
            {/* Header: Personalized based on Role */}
            <ScrollReveal>
                <div className="flex flex-col gap-2">
                    <h2 className="text-3xl md:text-4xl font-serif text-white">
                        {isFemale ? "Your Wellness & Sync" : `Supporting ${partnerName}`}
                    </h2>
                    <p className="hidden md:block text-sm text-purple-300/60 uppercase tracking-widest font-bold">
                        {isFemale ? "Syncing with your natural rhythm" : "Being there for her every step of the way"}
                    </p>
                </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Daily Insight Section */}
                <ScrollReveal delay={0.1}>
                    <div className="glass-card p-8 bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.1)] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Sparkles className="w-12 h-12 text-white" />
                        </div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md">
                                <Activity className="w-5 h-5 text-purple-300" />
                            </div>
                            <h3 className="text-lg font-bold text-white">Daily {isFemale ? "Wellness" : "Support"} Tip</h3>
                        </div>
                        <p className="text-lg text-white/90 font-medium leading-relaxed">
                            {herCycle ? (currentDay ? (isFemale ? getWellnessAdvice(currentDay) : getSupportAdvice(currentDay)) : "Syncing cycle...") : "Connect with your partner for insights."}
                        </p>

                        {!isFemale && (
                            <button
                                onClick={() => setShowSupportModal(true)}
                                className="mt-8 px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-bold uppercase tracking-widest text-indigo-300 hover:text-white transition-all w-full flex items-center justify-center gap-2"
                            >
                                <Heart className="w-4 h-4 fill-indigo-300/20" />
                                Log Support Action
                            </button>
                        )}
                    </div>
                </ScrollReveal>

                {/* 2. Sex Drive Tracker */}
                <ScrollReveal delay={0.2}>
                    <div className="glass-card p-8 bg-black/40 border-white/5 h-full relative overflow-hidden flex flex-col">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2.5 rounded-2xl bg-orange-500/10">
                                <Activity className="w-5 h-5 text-orange-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white">Libido</h3>
                        </div>

                        <div className="flex-1 flex flex-col justify-between space-y-8">
                            {/* Visual Meter (CSS Animated) - Showing PARTNER'S Level */}
                            <div className="py-4">
                                <LibidoMeter level={partnerSexDrive} />
                                <div className="text-center mt-4 mb-2 relative z-10">
                                    <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/30">
                                        {isFemale ? partnerName : "Her"} Level
                                    </span>
                                    {partnerSexDrive && (
                                        <div className={cn("text-xs font-black uppercase tracking-widest mt-1",
                                            partnerSexDrive === 'low' ? "text-green-500" :
                                                partnerSexDrive === 'medium' ? "text-yellow-500" :
                                                    partnerSexDrive === 'high' ? "text-orange-500" : "text-red-500"
                                        )}>
                                            {partnerSexDrive.replace('_', ' ')}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold uppercase tracking-widest text-white/40">Your Level</span>
                                    {mySexDrive && <span className={cn("text-[10px] font-black uppercase tracking-tighter",
                                        mySexDrive === 'low' ? "text-green-500" :
                                            mySexDrive === 'medium' ? "text-yellow-500" :
                                                mySexDrive === 'high' ? "text-orange-500" : "text-red-500"
                                    )}>{mySexDrive.replace('_', ' ')}</span>}
                                </div>
                                <div className="pt-2">
                                    <LibidoSlider
                                        key={mySexDrive}
                                        defaultValue={mySexDrive || 'medium'}
                                        onValueChange={async (val) => {
                                            setMySexDrive(val) // Optimistic update
                                            await logSexDrive(val) // Save to DB (Background)
                                            // No router.refresh() to avoid re-fetching
                                            toast({ title: "Libido Updated", className: "bg-zinc-800 text-white border-zinc-700" })
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Partner Profile Section Removed - Redundant */}
                        </div>
                    </div>
                </ScrollReveal>

                {/* 3. Her Feelings / Symptom Tracker */}
                <ScrollReveal delay={0.3} className="md:col-span-2">
                    <div className="glass-card p-8 border-white/5 bg-zinc-900/20">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-2xl bg-purple-500/10">
                                    <Bell className="w-5 h-5 text-purple-400" />
                                </div>
                                <h3 className="text-lg font-bold text-white">
                                    {isFemale ? `How are you feeling, ${profile.first_name || 'Female'}?` : `How is ${partnerName} feeling?`}
                                </h3>
                            </div>
                        </div>

                        {isFemale ? (
                            <div className="flex flex-wrap gap-2.5">
                                {[...getSuggestedSymptoms(currentDay || 1), ...sharedSymptoms.filter(s => !getSuggestedSymptoms(currentDay || 1).includes(s))].map(s => {
                                    const isShared = sharedSymptoms.includes(s)
                                    return (
                                        <button
                                            key={s}
                                            onClick={async () => {
                                                const newSymptoms = sharedSymptoms.includes(s) ? sharedSymptoms.filter(sym => sym !== s) : [...sharedSymptoms, s]
                                                setSharedSymptoms(newSymptoms)
                                                await logSymptoms(newSymptoms)
                                            }}
                                            className={cn(
                                                "px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border",
                                                isShared ? 'bg-purple-500/20 border-purple-400/50 text-purple-200' : 'bg-white/5 border-white/5 text-white/30 hover:bg-white/10'
                                            )}
                                        >
                                            {s}
                                        </button>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2.5">
                                {(() => {
                                    const latestPartnerLog = cycleLogs?.find((l: any) => l.user_id === partnerProfile?.id)
                                    return latestPartnerLog?.symptoms?.length > 0 ? (
                                        latestPartnerLog.symptoms.map((s: string) => (
                                            <div key={s} className="px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-purple-500/20 border border-purple-400/50 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                                                {s}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-[10px] text-white/20 uppercase font-bold">No symptoms shared yet</p>
                                    )
                                })()}
                            </div>
                        )}
                    </div>
                </ScrollReveal>

                {/* 4. Support History Section */}
                <ScrollReveal delay={0.4} className="md:col-span-2">
                    <div className="glass-card p-8 border-rose-500/10 bg-rose-950/5">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <Heart className="w-5 h-5 text-rose-500" />
                                <h3 className="text-lg font-bold text-white">
                                    {isFemale ? "How He's Helping" : "Your Support History"}
                                </h3>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {supportLogs && supportLogs.length > 0 ? supportLogs.map((log: any) => {
                                const isMe = log.supporter_id === profile?.id
                                return (
                                    <div key={log.id} className="p-5 rounded-3xl bg-white/5 border border-white/5 hover:bg-purple-500/5 transition-all">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-[10px] text-rose-400 font-black uppercase tracking-widest">{log.category}</span>
                                            <span className="text-[10px] text-white/20">{format(new Date(log.log_date), "MMM d")}</span>
                                        </div>
                                        <p className="text-sm text-zinc-300 font-medium">
                                            {isMe ? "You" : partnerName} {log.action_text}
                                        </p>
                                    </div>
                                )
                            }) : (
                                <div className="col-span-full py-12 text-center border border-dashed border-white/10 rounded-[40px]">
                                    <p className="text-sm text-white/20 italic font-medium">No connection actions logged yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollReveal>
            </div>

            <SupportModal
                isOpen={showSupportModal}
                onClose={() => setShowSupportModal(false)}
                phase={herCycle ? "Luteal" : "Support"}
                day={currentDay || 1}
                partnerName={partnerName}
                partnerId={profile.partner_id}
            />
        </div>
    )
}
