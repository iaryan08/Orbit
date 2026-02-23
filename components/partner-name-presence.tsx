'use client'

import { useState, useCallback } from 'react'
import { useCoupleChannel } from '@/hooks/use-couple-channel'
import { cn } from '@/lib/utils'

export function PartnerNamePresence({
    hasPartner,
    partnerProfile,
    coupleId,
    userId,
}: {
    hasPartner: boolean
    partnerProfile: any
    coupleId?: string | null
    userId?: string | null
}) {
    const [isOnline, setIsOnline] = useState(false)

    const handlePresence = useCallback((onlineIds: string[]) => {
        setIsOnline(onlineIds.length > 0)
    }, [])

    // Piggybacks on the shared registry — zero extra WebSocket connections!
    useCoupleChannel({
        coupleId: coupleId || '',
        userId: userId || '',
        onPresenceChange: handlePresence
    })

    if (!hasPartner) {
        return (
            <p className="text-rose-100/60 text-[10px] md:text-[12px] tracking-[0.1em] font-medium whitespace-nowrap">
                Waiting for partner
            </p>
        )
    }

    return (
        <div className="flex flex-col items-center md:items-start">
            <p className="text-rose-100/60 text-[10px] md:text-[12px] tracking-[0.1em] font-medium whitespace-nowrap flex items-end">
                <span className="font-serif italic mr-1.5 text-[11px] md:text-[13px] pb-0.5">Connected with</span>
                <span className="flex items-start">
                    <span className="font-pinyon text-[26px] md:text-[32px] text-rose-300/90 capitalize leading-none">
                        {partnerProfile?.display_name}
                    </span>
                    {isOnline && (
                        <span className="relative flex h-2 w-2 ml-1 mt-1">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                        </span>
                    )}
                </span>
            </p>
        </div>
    )
}
