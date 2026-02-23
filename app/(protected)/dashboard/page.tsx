import {
    getCoreDashboardData
} from '@/lib/actions/consolidated'
import { deletePolaroid } from '@/lib/actions/polaroids'
import { saveDoodle } from '@/lib/actions/doodles'
import { DashboardShell } from '@/components/dashboard-shell'
import { ScrollReveal } from '@/components/scroll-reveal'
import { MoodCheckIn } from '@/components/mood-check-in'
import { PartnerMood } from '@/components/partner-mood'
import { DashboardHeroEnhancements } from '@/components/dashboard-hero-enhancements'
import { PartnerAvatarHeartbeat } from '@/components/partner-avatar-heartbeat'
import {
    CoupleMomentsWrapper,
    DailyContentWrapper,
    DashboardSkeleton
} from '@/components/dashboard-wrappers'
import { Suspense } from 'react'
import { StackedPolaroids } from '@/components/stacked-polaroids'
import { SharedDoodle } from '@/components/shared-doodle'
import { DistanceTimeWidget } from '@/components/distance-time-widget'
import { Sparkles, Flame, Heart, Image as ImageIcon, PenLine } from 'lucide-react'

export default async function DashboardPage() {
    return <AsyncDashboardContent />
}

export const dynamic = 'force-dynamic'

async function AsyncDashboardContent() {
    // 1. Fetch ALL Core Data (consolidated into one parallel batch)
    // This eliminates layout shift/flicker by having everything ready before first paint.
    const result = await getCoreDashboardData()
    if (!result.success || !result.data) return null

    const {
        profile,
        partnerProfile,
        couple,
        userTodayMoods,
        partnerTodayMoods,
        memoriesCount,
        lettersCount,
        polaroids,
        doodle
    } = result.data

    const coupleId = couple?.id
    const hasPartner = !!couple
    const startDate = couple?.anniversary_date || couple?.paired_at
    const daysTogether = startDate
        ? Math.floor((new Date().getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0
    const today = result.data.currentDateIST
    const pId = partnerProfile?.id
    const pLog = result.data.cycleLogs?.find((l: any) => l.user_id === pId && l.log_date === today)
    const showIntimacyAlert = pLog?.sex_drive === 'very_high'

    return (
        <DashboardShell lunaraData={result.data}>
            <div className="max-w-7xl mx-auto space-y-6 md:space-y-12 pt-16 md:pt-24 pb-28 md:pb-12 px-6 md:px-8">
                {/* Refined Welcome Header */}
                <ScrollReveal className="space-y-1 md:space-y-2 text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 md:gap-3 px-3 md:px-5 py-1 md:py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-[0_0_20px_rgba(251,191,36,0.1)] group hover:bg-white/10 hover:border-white/20 transition-all duration-500">
                        <Sparkles className="w-3 md:w-4 h-3 md:h-4 text-amber-400/80 animate-pulse-slow" />
                        <span className="text-amber-200/90 text-[10px] uppercase tracking-[0.3em] font-bold text-glow-gold">
                            MOONBETWEENUS
                        </span>
                    </div>
                    <h1 className="hidden md:block text-3xl md:text-7xl space-y-2 md:space-y-0 text-rose-50 leading-tight tracking-tight">
                        <span className="font-serif italic font-light opacity-90 block md:inline">Always Together </span>
                        <span className="font-pinyon text-5xl md:text-9xl bg-gradient-to-r from-amber-200 via-rose-300 to-orange-300 bg-clip-text text-transparent drop-shadow-sm lowercase md:-ml-4">
                            Forever
                        </span>
                    </h1>
                    <div className="flex flex-col md:flex-row items-center md:items-center gap-3 md:gap-4 pt-2 md:pt-4 justify-center lg:justify-start">
                        <PartnerAvatarHeartbeat
                            uProfile={profile}
                            partnerProfile={partnerProfile}
                            coupleId={coupleId || ""}
                        />
                        <div className="flex flex-col items-center md:items-start justify-center">
                            <p className="text-rose-100/60 text-[10px] md:text-[12px] tracking-[0.1em] font-medium whitespace-nowrap">
                                {hasPartner ? (
                                    <>
                                        <span className="font-serif italic mr-1 text-[11px] md:text-[13px]">Connected with</span>
                                        <span className="font-pinyon text-[18px] md:text-[24px] text-rose-300/90 lowercase leading-none">
                                            {partnerProfile?.display_name}
                                        </span>
                                    </>
                                ) : (
                                    "Waiting for partner"
                                )}
                            </p>
                        </div>
                    </div>
                    <DashboardHeroEnhancements
                        hasPartner={hasPartner}
                        partnerProfile={partnerProfile}
                        coupleId={coupleId}
                        userLatitude={profile?.latitude}
                    />
                </ScrollReveal>

                {/* Core Stats & Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 md:mt-12">
                    <div className="lg:col-span-4">
                        <div className="glass-card p-4 md:p-6 flex flex-row items-center justify-between gap-4 md:gap-8 relative overflow-hidden min-h-[100px]">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500/30 via-amber-500/30 to-rose-500/30 opacity-50" />
                            <div className="flex items-center gap-3 md:gap-5 flex-1">
                                <Heart className="w-10 h-10 md:w-12 md:h-12 text-rose-500/80" fill="currentColor" />
                                <div className="flex flex-col">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl md:text-5xl font-bold text-rose-50 tracking-tighter leading-none">{daysTogether}</span>
                                        <span className="text-xs md:text-sm text-rose-100/50 font-serif italic">Days</span>
                                    </div>
                                    <p className="text-[8px] md:text-[10px] uppercase text-white/30 tracking-widest font-bold">Since Start</p>
                                </div>
                            </div>
                            <div className="h-10 w-px bg-white/10 shrink-0" />
                            <div className="flex flex-col gap-4 flex-1 justify-center items-start pl-4 md:pl-8">
                                <div className="flex items-center gap-3">
                                    <PenLine className="w-4 h-4 text-rose-300/50" />
                                    <span className="text-xl md:text-2xl font-bold text-white/90 leading-none">{lettersCount}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <ImageIcon className="w-4 h-4 text-amber-300/50" />
                                    <span className="text-xl md:text-2xl font-bold text-white/90 leading-none">{memoriesCount}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {showIntimacyAlert && (
                        <div className="lg:col-span-4 glass-card p-4 bg-gradient-to-r from-orange-600/30 to-red-600/30 border-orange-500/50 flex items-center justify-between relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-600/10" />
                            <div className="flex items-center gap-5 relative z-10 w-full md:justify-start">
                                <Flame className="w-6 h-6 text-orange-500" fill="currentColor" />
                                <div>
                                    <h3 className="text-base font-bold text-white leading-tight">Intense Passion Alert</h3>
                                    <p className="text-xs text-orange-100/90 font-medium">
                                        {partnerProfile?.display_name || 'Partner'} is feeling a burning desire for you right now.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Secondary Widgets Grid */}
                    <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-2 auto-rows-min">
                        {/* Top Row: Moods & Polaroids */}
                        <ScrollReveal className="lg:col-span-1" delay={0.1}>
                            <div className="glass-card p-1.5 h-full">
                                <PartnerMood
                                    partnerName={partnerProfile?.display_name || 'Partner'}
                                    partnerAvatar={partnerProfile?.avatar_url}
                                    moods={partnerTodayMoods}
                                    coupleId={coupleId}
                                />
                            </div>
                        </ScrollReveal>

                        <ScrollReveal className="lg:col-span-1" delay={0.15}>
                            <div className="glass-card p-1.5 h-full">
                                <MoodCheckIn hasPartner={hasPartner} userMoods={userTodayMoods} />
                            </div>
                        </ScrollReveal>

                        <ScrollReveal className="lg:col-span-1" delay={0.2}>
                            <StackedPolaroids
                                userPolaroid={polaroids?.userPolaroid || null}
                                partnerPolaroid={polaroids?.partnerPolaroid || null}
                                partnerName={partnerProfile?.display_name || 'Partner'}
                                onDelete={async (id: string) => {
                                    'use server'
                                    await deletePolaroid(id)
                                }}
                            />
                        </ScrollReveal>

                        <ScrollReveal className="lg:col-span-1 h-full" delay={0.25}>
                            <div className="h-full">
                                <DistanceTimeWidget uProfile={profile} partnerProfile={partnerProfile} />
                            </div>
                        </ScrollReveal>

                        {/* Middle Row: Content & Creativity */}
                        <ScrollReveal className="lg:col-span-2" delay={0.3}>
                            <div className="h-[400px] lg:h-[340px]">
                                <SharedDoodle
                                    savedPath={doodle?.path_data}
                                    onSave={async (path) => {
                                        'use server'
                                        await saveDoodle(path)
                                    }}
                                />
                            </div>
                        </ScrollReveal>

                        <Suspense fallback={<DashboardSkeleton className="lg:col-span-2 h-[400px] lg:h-[340px]" />}>
                            <DailyContentWrapper />
                        </Suspense>

                        {/* Dynamic Content: Bucket List & On This Day */}
                        {hasPartner && coupleId && (
                            <Suspense fallback={null}>
                                <CoupleMomentsWrapper
                                    coupleId={coupleId}
                                    partnerName={partnerProfile?.display_name || 'Partner'}
                                />
                            </Suspense>
                        )}
                    </div>
                </div>
            </div>
        </DashboardShell>
    )
}
