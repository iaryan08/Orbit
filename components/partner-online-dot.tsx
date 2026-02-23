'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'

interface PartnerOnlineDotProps {
    coupleId: string
    userId: string       // current user's id (to track ourselves)
    partnerId: string    // partner's id (to detect their presence)
}

export function PartnerOnlineDot({ coupleId, userId, partnerId }: PartnerOnlineDotProps) {
    const [isOnline, setIsOnline] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        if (!coupleId || !partnerId) return

        const channel = supabase.channel(`presence-dot-${coupleId}`, {
            config: { presence: { key: userId } }
        })

        const checkOnline = () => {
            const state = channel.presenceState()
            const online = Object.entries(state).some(([key, presences]) => {
                return key !== userId &&
                    (presences as any[]).some((p: any) => p.user_id === partnerId)
            })
            setIsOnline(online)
        }

        channel
            .on('presence', { event: 'sync' }, checkOnline)
            .on('presence', { event: 'join' }, checkOnline)
            .on('presence', { event: 'leave' }, checkOnline)
            .subscribe(async (status: string) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        user_id: userId,
                        online_at: new Date().toISOString()
                    })
                }
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [coupleId, userId, partnerId])

    return (
        <AnimatePresence>
            {isOnline && (
                <motion.span
                    key="dot"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                    title="Online now"
                    className="inline-block w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.7)] relative -top-0.5 ml-1.5 shrink-0"
                />
            )}
        </AnimatePresence>
    )
}
