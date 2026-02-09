'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'

export function ConnectionSync({ coupleId, userId }: { coupleId: string, userId: string }) {
    const [isPartnerPresent, setIsPartnerPresent] = useState(false)
    const [showFlash, setShowFlash] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        if (!coupleId || !userId) return

        const channel = supabase.channel(`presence-${coupleId}`, {
            config: {
                presence: {
                    key: userId,
                },
            },
        })

        const handleSync = () => {
            const state = channel.presenceState()
            const presences = Object.values(state).flat() as any[]

            // Check if partner is online (anyone in the same couple channel with a different ID)
            const partner = presences.find(p => p.user_id !== userId)

            if (partner && !isPartnerPresent) {
                // Partner just joined or we just detected them!
                setShowFlash(true)
                setTimeout(() => setShowFlash(false), 2000)
            }

            setIsPartnerPresent(!!partner)
        }

        channel
            .on('presence', { event: 'sync' }, handleSync)
            .on('presence', { event: 'join' }, handleSync)
            .on('presence', { event: 'leave' }, handleSync)
            .subscribe(async (status: string) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        user_id: userId,
                        online_at: new Date().toISOString(),
                    })
                }
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [coupleId, userId])

    return (
        <AnimatePresence>
            {showFlash && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center"
                >
                    {/* The "Flash" Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.4, 0] }}
                        transition={{ duration: 1.5, times: [0, 0.2, 1] }}
                        className="absolute inset-0 bg-white"
                    />

                    {/* Visual Indicator */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 1.1, opacity: 0 }}
                        className="relative px-6 py-3 rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center gap-3 shadow-2xl"
                    >
                        <div className="relative">
                            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                            <div className="absolute inset-0 blur-md bg-amber-400/50 animate-pulse" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-white">
                            Partner Connected
                        </span>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
