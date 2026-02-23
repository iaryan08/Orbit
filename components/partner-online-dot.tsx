'use client'

import { useState, useCallback } from 'react'
import { useCoupleChannel } from '@/hooks/use-couple-channel'

interface PartnerOnlineDotProps {
    coupleId: string
    userId: string
    partnerId: string
}

export function PartnerOnlineDot({ coupleId, userId, partnerId }: PartnerOnlineDotProps) {
    const [isOnline, setIsOnline] = useState(false)

    const handlePresence = useCallback((onlineIds: string[]) => {
        setIsOnline(onlineIds.includes(partnerId))
    }, [partnerId])

    // Shares the same channel as PartnerAvatarHeartbeat — no extra connection
    useCoupleChannel({
        coupleId,
        userId,
        onPresenceChange: handlePresence,
    })

    if (!isOnline) return null

    return (
        <span
            title="Online now"
            className="inline-block w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.7)] relative -top-0.5 ml-1.5 shrink-0 transition-opacity duration-300"
        />
    )
}
