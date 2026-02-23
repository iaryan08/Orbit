'use client'

import { useState, useRef, useCallback } from 'react'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCoupleChannel } from '@/hooks/use-couple-channel'
import { sendHeartbeat as triggerHeartbeatPush } from '@/lib/actions/notifications'

interface PartnerAvatarProps {
    partnerProfile: any
    uProfile?: any
    coupleId: string
    className?: string
}

export function PartnerAvatarHeartbeat({ partnerProfile, uProfile, coupleId, className }: PartnerAvatarProps) {
    const [isReceiving, setIsReceiving] = useState(false)
    const [isSending, setIsSending] = useState(false)
    const [isPressing, setIsPressing] = useState(false)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    const handleVibrate = useCallback(() => {
        setIsReceiving(true)
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([400, 200, 400])
        }
        if (document.visibilityState === 'hidden' && Notification.permission === 'granted') {
            new Notification('Heartbeat Received', {
                body: 'Your partner is thinking of you right now ❤️',
                icon: '/icon-192x192.png',
                tag: 'heartbeat',
            })
        }
        setTimeout(() => setIsReceiving(false), 3000)
    }, [])

    const { sendVibrate } = useCoupleChannel({
        coupleId,
        userId: uProfile?.id || '',
        onVibrate: handleVibrate,
    })

    const handlePressStart = () => {
        setIsPressing(true)
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(20)
        timeoutRef.current = setTimeout(() => handleSendHeartbeat(), 600)
    }

    const handlePressEnd = () => {
        setIsPressing(false)
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
        }
    }

    const handleSendHeartbeat = async () => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([100, 50, 100])
        setIsSending(true)
        await sendVibrate()
        await triggerHeartbeatPush()
        setTimeout(() => setIsSending(false), 2000)
    }

    if (!partnerProfile) {
        return (
            <div className={cn('w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-background bg-secondary/20 flex items-center justify-center ring-2 ring-white/10 overflow-hidden shadow-xl', className)}>
                <div className="w-full h-full flex items-center justify-center bg-cyan-500/20 text-cyan-200 font-bold text-xs">P</div>
            </div>
        )
    }

    const isActive = isReceiving || isSending

    return (
        <div
            className={cn('relative flex items-center', uProfile ? '-space-x-4' : '')}
            onPointerDown={handlePressStart}
            onPointerUp={handlePressEnd}
            onPointerLeave={handlePressEnd}
            onTouchStart={handlePressStart}
            onTouchEnd={handlePressEnd}
            onContextMenu={(e) => e.preventDefault()}
        >
            {/* User Avatar */}
            {uProfile && (
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-background bg-primary/20 flex items-center justify-center ring-2 ring-white/10 overflow-hidden shadow-xl relative z-0">
                    {uProfile.avatar_url
                        ? <img src={uProfile.avatar_url} className="w-full h-full object-cover" alt="You" />
                        : <div className="w-full h-full flex items-center justify-center bg-rose-500/20 text-rose-200 font-bold text-xs">{uProfile.display_name?.charAt(0) || 'U'}</div>
                    }
                </div>
            )}

            {/* Partner Avatar */}
            <div className="relative">
                {/* CSS ripples — no Framer Motion, no JS on idle */}
                {isActive && (
                    <>
                        <span className="absolute inset-0 rounded-full bg-rose-500/30 animate-ping" />
                        <span className="absolute inset-0 rounded-full bg-rose-500/15 animate-ping [animation-delay:0.3s]" />
                    </>
                )}

                <div
                    className={cn(
                        'relative z-10 w-10 h-10 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center overflow-hidden shadow-xl cursor-pointer select-none bg-secondary/20 transition-all duration-300',
                        isActive
                            ? 'border-rose-400 ring-4 ring-rose-500/50 scale-110 shadow-[0_0_20px_rgba(244,63,94,0.5)]'
                            : isPressing
                                ? 'border-background ring-2 ring-white/10 scale-95'
                                : 'border-background ring-2 ring-white/10 scale-100'
                    )}
                >
                    {partnerProfile?.avatar_url
                        ? <img src={partnerProfile.avatar_url} className="w-full h-full object-cover pointer-events-none" alt="Partner" />
                        : <div className="w-full h-full flex items-center justify-center bg-cyan-500/20 text-cyan-200 font-bold text-xs pointer-events-none">{partnerProfile?.display_name?.charAt(0) || 'P'}</div>
                    }
                    {isActive && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Heart className="w-5 h-5 text-rose-400 fill-rose-500" />
                        </div>
                    )}
                </div>

                {/* Press tip — CSS only */}
                {isPressing && !isSending && (
                    <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap z-20 pointer-events-none text-[9px] font-bold uppercase tracking-widest text-rose-200 bg-black/60 px-2 py-0.5 rounded-full border border-rose-500/20">
                        Hold to Send Love
                    </span>
                )}
            </div>
        </div>
    )
}
