'use client'

import { QuickCreateButtons } from '@/components/quick-create-buttons'
import { WeatherBadge } from '@/components/weather-badge'
import { MapPin } from 'lucide-react'

/**
 * No longer deferred — renders immediately.
 * The requestIdleCallback delay was causing CLS (content jumping in after 1-3s)
 * and contributing to LCP by holding back layout.
 */
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
    return (
        <div className="space-y-3 md:space-y-4">
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
