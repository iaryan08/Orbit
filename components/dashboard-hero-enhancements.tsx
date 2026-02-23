'use client'

import { useEffect, useState } from 'react'
import { QuickCreateButtons } from '@/components/quick-create-buttons'
import { WeatherBadge } from '@/components/weather-badge'
import { PartnerStatus } from '@/components/partner-status'
import { PartnerAvatarHeartbeat } from '@/components/partner-avatar-heartbeat'
import { MapPin } from 'lucide-react'

export function DashboardHeroEnhancements({
    hasPartner,
    partnerProfile,
    coupleId,
    userLatitude
}: {
    hasPartner: boolean
    partnerProfile: any
    coupleId?: string | null
    userLatitude?: number | null
}) {
    const [ready, setReady] = useState(false)

    useEffect(() => {
        const run = () => setReady(true)
        const idle = (window as any).requestIdleCallback as ((cb: () => void, opts?: { timeout: number }) => number) | undefined

        if (idle) {
            const id = idle(run, { timeout: 3000 })
            return () => {
                const cancel = (window as any).cancelIdleCallback as ((idleId: number) => void) | undefined
                if (cancel) cancel(id)
            }
        }

        const timer = window.setTimeout(run, 1200)
        return () => window.clearTimeout(timer)
    }, [])

    if (!ready) {
        return (
            <div className="min-h-[84px] md:min-h-[96px]" aria-hidden="true">
                <div className="h-9" />
                <div className="h-11 mt-3 rounded-2xl border border-white/10 bg-white/5" />
            </div>
        )
    }

    return (
        <div className="space-y-4 min-h-[84px] md:min-h-[96px]">
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                {hasPartner && partnerProfile && (
                    <WeatherBadge
                        lat={partnerProfile.latitude}
                        lon={partnerProfile.longitude}
                        city={partnerProfile.city || partnerProfile.display_name}
                    />
                )}
                {!userLatitude && (
                    <div className="flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                        <MapPin className="w-3 h-3" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Enable Your Location</span>
                    </div>
                )}
            </div>
            <QuickCreateButtons />
        </div>
    )
}
