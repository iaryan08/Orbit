'use client'

import { useState, useCallback, useRef } from 'react'
import { Sparkles } from 'lucide-react'
import { useCoupleChannel } from '@/hooks/use-couple-channel'

export function ConnectionSync({ coupleId, userId }: { coupleId: string; userId: string }) {
    const [showFlash, setShowFlash] = useState(false)
    const wasOnlineRef = useRef(false)

    const handlePresence = useCallback((onlineIds: string[]) => {
        const partnerIsOnline = onlineIds.length > 0
        // Only flash when partner first comes online
        if (partnerIsOnline && !wasOnlineRef.current) {
            setShowFlash(true)
            setTimeout(() => setShowFlash(false), 2000)
        }
        wasOnlineRef.current = partnerIsOnline
    }, [])

    // Piggybacks on the shared channel — zero extra connections
    useCoupleChannel({ coupleId, userId, onPresenceChange: handlePresence })

    if (!showFlash) return null

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center animate-fade-in">
            <div className="relative px-6 py-3 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center gap-3 shadow-2xl">
                <Sparkles className="w-5 h-5 text-amber-300" />
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-white">Partner Connected</span>
            </div>
        </div>
    )
}
