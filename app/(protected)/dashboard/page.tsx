import {
    fetchCoreDashboardData
} from '@/lib/actions/consolidated'
import { getDashboardPolaroids, deletePolaroid } from '@/lib/actions/polaroids'
import { getDoodle, saveDoodle } from '@/lib/actions/doodles'
import { DashboardShell } from '@/components/dashboard-shell'
import { ScrollReveal } from '@/components/scroll-reveal'
import { QuickCreateButtons } from '@/components/quick-create-buttons'
import { IntimacyAlert } from '@/components/intimacy-alert'
import { MoodCheckIn } from '@/components/mood-check-in'
import { PartnerMood } from '@/components/partner-mood'
import { WeatherBadge } from '@/components/weather-badge'
import { PartnerStatus } from '@/components/partner-status'
import { PartnerAvatarHeartbeat } from '@/components/partner-avatar-heartbeat'
import {
    BucketListWrapper,
    OnThisDayWrapper,
    DailyContentWrapper,
    DashboardSkeleton
} from '@/components/dashboard-wrappers'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { MapPin, Sparkles } from 'lucide-react'

// Dynamic imports for heavy content components to reduce initial JS payload
const StackedPolaroids = dynamic(() => import('@/components/stacked-polaroids').then(mod => mod.StackedPolaroids), {
    loading: () => <DashboardSkeleton className="h-[400px]" />
})
const SharedDoodle = dynamic(() => import('@/components/shared-doodle').then(mod => mod.SharedDoodle), {
    loading: () => <DashboardSkeleton className="h-[400px] lg:h-[340px]" />
})
const RelationshipStats = dynamic(() => import('@/components/relationship-stats').then(mod => mod.RelationshipStats), {
    loading: () => <DashboardSkeleton className="h-32" />
})
const DistanceTimeWidget = dynamic(() => import('@/components/distance-time-widget').then(mod => mod.DistanceTimeWidget), {
    loading: () => <DashboardSkeleton className="h-48" />
})

export default async function DashboardPage() {
    return (
        <Suspense fallback={<DashboardLoadingSkeleton />}>
            <AsyncDashboardContent />
        </Suspense>
    )
}

async function AsyncDashboardContent() {
    // 1. Fetch Core Data (Fast Path for First Paint)
    const result = await fetchCoreDashboardData()
    if (!result.success || !result.data) return null

    const {
        profile,
        partnerProfile,
        couple,
        userTodayMoods,
        partnerTodayMoods,
        memoriesCount,
        lettersCount
    } = result.data

    const coupleId = couple?.id
    const hasPartner = !!couple

    // 2. Parallel fetch for media/assets, injecting coupleId to avoid redundant profile lookups
    const [{ userPolaroid, partnerPolaroid }, doodle] = await Promise.all([
        getDashboardPolaroids(coupleId),
        getDoodle(coupleId)
    ])

    return (
        <DashboardShell lunaraData={result.data}>
            <div className="max-w-7xl mx-auto space-y-12 pt-24 pb-12 px-6 md:px-8">
                {/* Refined Welcome Header */}
                <ScrollReveal className="space-y-4 text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-amber-200/90 text-[10px] uppercase tracking-[0.3em] font-bold backdrop-blur-md text-glow-gold">
                        <Sparkles className="w-3 h-3 text-amber-400/80" />
                        Moonbetweenus
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
                            {hasPartner && (
                                <div className="relative z-10">
                                    <PartnerAvatarHeartbeat partnerProfile={partnerProfile} coupleId={coupleId} />
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col items-center lg:items-start space-y-0.5">
                            <div className="flex items-center gap-2">
                                <p className="text-rose-100/70 uppercase text-xs tracking-[0.2em] whitespace-nowrap">
                                    {hasPartner ? (
                                        <>Connected with <span className="text-rose-300 font-bold">{partnerProfile?.display_name || 'Partner'}</span></>
                                    ) : (
                                        "Waiting for partner"
                                    )}
                                </p>
                                {hasPartner && <PartnerStatus partnerId={partnerProfile?.id} />}
                            </div>

                            <div className="flex items-center justify-center lg:justify-start">
                                {hasPartner && partnerProfile && (
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

                {/* Core Stats & Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 md:mt-12">
                    <RelationshipStats
                        couple={couple}
                        lettersCount={lettersCount}
                        memoriesCount={memoriesCount}
                    />

                    <IntimacyAlert
                        lunaraData={result.data}
                        partnerProfile={partnerProfile}
                    />

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
                                userPolaroid={userPolaroid}
                                partnerPolaroid={partnerPolaroid}
                                partnerName={partnerProfile?.display_name || 'Partner'}
                                onDelete={async (id: string) => {
                                    'use server'
                                    await deletePolaroid(id)
                                }}
                            />
                        </ScrollReveal>

                        <ScrollReveal className="lg:col-span-1 h-full" delay={0.25}>
                            <div className="h-full">
                                <DistanceTimeWidget userProfile={profile} partnerProfile={partnerProfile} />
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
                            <>
                                <Suspense fallback={null}>
                                    <OnThisDayWrapper
                                        coupleId={coupleId}
                                        partnerName={partnerProfile?.display_name || 'Partner'}
                                    />
                                </Suspense>

                                <Suspense fallback={null}>
                                    <BucketListWrapper coupleId={coupleId} />
                                </Suspense>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </DashboardShell>
    )
}

function DashboardLoadingSkeleton() {
    return (
        <div className="max-w-7xl mx-auto space-y-12 pt-24 pb-12 px-6 md:px-8">
            <div className="space-y-4">
                <DashboardSkeleton className="h-10 w-32 mx-auto lg:mx-0" />
                <DashboardSkeleton className="h-24 w-full md:w-2/3 mx-auto lg:mx-0" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <DashboardSkeleton className="h-32" />
                <DashboardSkeleton className="h-32" />
                <DashboardSkeleton className="h-32" />
                <DashboardSkeleton className="h-32" />
                <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <DashboardSkeleton className="lg:col-span-1 h-[400px]" />
                    <DashboardSkeleton className="lg:col-span-1 h-[400px]" />
                    <DashboardSkeleton className="lg:col-span-1 h-[400px]" />
                    <DashboardSkeleton className="lg:col-span-1 h-[400px]" />
                </div>
            </div>
        </div>
    )
}
