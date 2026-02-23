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
            setTimeout(() => setShowFlash(false), 500)
        }
        wasOnlineRef.current = partnerIsOnline
    }, [])

    // Piggybacks on the shared channel — zero extra connections
    useCoupleChannel({ coupleId, userId, onPresenceChange: handlePresence })

    if (!showFlash) return null

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center bg-black/40 backdrop-blur-md animate-in fade-in duration-150">
            <div className="relative px-8 py-4 rounded-full bg-black/60 border border-white/20 flex items-center gap-3 shadow-[0_0_50px_rgba(251,191,36,0.2)] animate-in zoom-in-95 slide-in-from-bottom-5 duration-150">
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                <span className="text-sm font-bold uppercase tracking-[0.25em] text-white">Partner Connected</span>
            </div>
        </div>
    )
}
