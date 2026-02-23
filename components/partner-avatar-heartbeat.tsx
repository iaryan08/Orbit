'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

import { sendHeartbeat as triggerHeartbeatPush } from '@/lib/actions/notifications'

interface PartnerAvatarProps {
    partnerProfile: any
    uProfile?: any // Renamed to uProfile to avoid potential scope collisions
    coupleId: string
    className?: string
}

export function PartnerAvatarHeartbeat({ partnerProfile, uProfile, coupleId, className }: PartnerAvatarProps) {
    const [isReceiving, setIsReceiving] = useState(false)
    const [isSending, setIsSending] = useState(false)
    const [isPressing, setIsPressing] = useState(false)
    const [isPartnerOnline, setIsPartnerOnline] = useState(false)
    const supabase = createClient()
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const channelRef = useRef<any>(null)

    useEffect(() => {
        if (!coupleId) return

        // Track partner online presence
        const presenceChannel = supabase.channel(`presence-${coupleId}`, {
            config: { presence: { key: uProfile?.id || 'user' } }
        })

        presenceChannel
            .on('presence', { event: 'sync' }, () => {
                const state = presenceChannel.presenceState()
                const onlineKeys = Object.keys(state)
                // Partner is online if there's a key that isn't ours
                const partnerId = partnerProfile?.id
                const isOnline = partnerId
                    ? onlineKeys.some(k => {
                        const entries = state[k] as any[]
                        return entries?.some((e: any) => e.user_id === partnerId)
                    })
                    : onlineKeys.length > 1 || (onlineKeys.length === 1 && onlineKeys[0] !== (uProfile?.id || 'user'))
                setIsPartnerOnline(isOnline)
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }: any) => {
                if (key !== (uProfile?.id || 'user') || newPresences?.some((p: any) => p.user_id === partnerProfile?.id)) {
                    setIsPartnerOnline(true)
                }
            })
            .on('presence', { event: 'leave' }, () => {
                const state = presenceChannel.presenceState()
                const onlineKeys = Object.keys(state)
                const partnerId = partnerProfile?.id
                const isOnline = partnerId
                    ? onlineKeys.some(k => {
                        const entries = state[k] as any[]
                        return entries?.some((e: any) => e.user_id === partnerId)
                    })
                    : false
                setIsPartnerOnline(isOnline)
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED' && uProfile?.id) {
                    await presenceChannel.track({
                        user_id: uProfile.id,
                        online_at: new Date().toISOString()
                    })
                }
            })

        // Unique channel for touch events
        const touchChannel = supabase.channel(`touch-${coupleId}`)
        channelRef.current = touchChannel

        touchChannel
            .on('broadcast', { event: 'vibrate' }, (payload: any) => {
                // Trigger Visual
                setIsReceiving(true)

                // Trigger Haptics
                if (typeof navigator !== 'undefined' && navigator.vibrate) {
                    // Stronger double pulse
                    navigator.vibrate([400, 200, 400])
                }

                // Trigger Notification if Background
                if (document.visibilityState === 'hidden' && Notification.permission === 'granted') {
                    new Notification("Heartbeat Received", {
                        body: "Your partner is thinking of you right now ❤️",
                        icon: "/icon-192x192.png",
                        tag: 'heartbeat'
                    })
                }

                setTimeout(() => setIsReceiving(false), 3000)
            })
            .subscribe()

        return () => {
            supabase.removeChannel(presenceChannel)
            supabase.removeChannel(touchChannel)
        }
    }, [coupleId, uProfile?.id, partnerProfile?.id])

    const handlePressStart = () => {
        setIsPressing(true)
        // Immediate haptic kick
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(20)
        }
        timeoutRef.current = setTimeout(() => {
            handleSendHeartbeat()
        }, 600) // 600ms threshold for "Long Press"
    }

    const handlePressEnd = () => {
        setIsPressing(false)
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
        }
    }

    const handleSendHeartbeat = async () => {
        // Feedback for sender
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([100, 50, 100]) // Strong tactile confirmation
        }
        setIsSending(true)

        // 1. Real-time broadcast for when both are online
        if (channelRef.current) {
            await channelRef.current.send({
                type: 'broadcast',
                event: 'vibrate',
                payload: {}
            })
        }

        // 2. Background push for when partner is offline
        await triggerHeartbeatPush()

        setTimeout(() => setIsSending(false), 2000)
    }

    if (!partnerProfile) {
        return (
            <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-background bg-secondary/20 flex items-center justify-center ring-2 ring-white/10 overflow-hidden shadow-xl", className)}>
                <div className="w-full h-full flex items-center justify-center bg-cyan-500/20 text-cyan-200 font-bold text-xs">
                    P
                </div>
            </div>
        )
    }

    const isActive = isReceiving || isSending

    return (
        <div
            className={cn("relative flex items-center", uProfile ? "-space-x-4" : "")}
            onPointerDown={handlePressStart}
            onPointerUp={handlePressEnd}
            onPointerLeave={handlePressEnd}
            onTouchStart={handlePressStart}
            onTouchEnd={handlePressEnd}
            onContextMenu={(e) => e.preventDefault()}
        >
            {/* 1. User Avatar (Only in Duo mode) */}
            {uProfile && (
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-background bg-primary/20 flex items-center justify-center ring-2 ring-white/10 overflow-hidden shadow-xl relative z-0">
                    {uProfile.avatar_url ? (
                        <img src={uProfile.avatar_url} className="w-full h-full object-cover" alt="You" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-rose-500/20 text-rose-200 font-bold text-xs">
                            {uProfile.display_name?.charAt(0) || "U"}
                        </div>
                    )}
                </div>
            )}

            {/* 2. Partner Avatar (The Interactive One) */}
            <div className="relative">
                {/* Ripples */}
                <AnimatePresence>
                    {isActive && (
                        <>
                            <motion.div
                                initial={{ scale: 1, opacity: 0.8 }}
                                animate={{ scale: 2, opacity: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="absolute inset-0 rounded-full bg-rose-500/40 z-0"
                            />
                            <motion.div
                                initial={{ scale: 1, opacity: 0.8 }}
                                animate={{ scale: 1.5, opacity: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1.5, delay: 0.2, repeat: Infinity }}
                                className="absolute inset-0 rounded-full bg-rose-500/20 z-0"
                            />
                        </>
                    )}
                </AnimatePresence>

                <motion.div
                    className={cn(
                        "relative z-10 w-10 h-10 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center overflow-hidden shadow-xl transition-[border-color,ring,transform,box-shadow] duration-500 cursor-pointer select-none bg-secondary/20",
                        isActive
                            ? "border-rose-400 ring-4 ring-rose-500/50 scale-110 shadow-[0_0_25px_rgba(244,63,94,0.6)]"
                            : "border-background ring-2 ring-white/10"
                    )}
                    animate={isPressing ? { scale: 0.95 } : { scale: isActive ? 1.1 : 1 }}
                >
                    {partnerProfile?.avatar_url ? (
                        <img src={partnerProfile.avatar_url} className="w-full h-full object-cover pointer-events-none" alt="Partner" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-cyan-500/20 text-cyan-200 font-bold text-xs pointer-events-none">
                            {partnerProfile?.display_name?.charAt(0) || "P"}
                        </div>
                    )}

                    {/* Overlay Icon */}
                    <AnimatePresence>
                        {isActive && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]"
                            >
                                <Heart className="w-5 h-5 text-rose-400 fill-rose-500 animate-heartbeat" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Press Tip */}
                <AnimatePresence>
                    {isPressing && !isSending && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, x: "-50%" }}
                            animate={{ opacity: 1, y: 0, x: "-50%" }}
                            exit={{ opacity: 0 }}
                            className="absolute -bottom-8 left-1/2 whitespace-nowrap z-20 pointer-events-none"
                        >
                            <span className="text-[9px] font-bold uppercase tracking-widest text-rose-200 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-rose-500/20">
                                Hold to Send Love
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
