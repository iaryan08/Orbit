'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export function PartnerStatus({ partnerId }: { partnerId: string | null }) {
    const [isOnline, setIsOnline] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        if (!partnerId) return

        const channel = supabase.channel('online-users', {
            config: {
                presence: {
                    key: 'online', // Use a generic key or user ID
                },
            },
        })

        const checkPresence = () => {
            const state = channel.presenceState()
            const onlineUsers = Object.values(state).flat() as any[]
            const isPartnerOnline = onlineUsers.some(u => u.user_id === partnerId)
            setIsOnline(isPartnerOnline)
        }

        channel
            .on('presence', { event: 'sync' }, checkPresence)
            .on('presence', { event: 'join' }, checkPresence)
            .on('presence', { event: 'leave' }, checkPresence)
            .subscribe(async (status: string) => {
                if (status === 'SUBSCRIBED') {
                    const { data: { user } } = await supabase.auth.getUser()
                    if (user) {
                        await channel.track({
                            user_id: user.id,
                            online_at: new Date().toISOString(),
                        })
                    }
                }
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [partnerId])

    return (
        <div className="relative flex items-center justify-center">
            <span className={cn(
                "w-2 h-2 rounded-full transition-colors duration-500",
                isOnline
                    ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                    : "bg-white/10"
            )} />
            {isOnline && (
                <span className="absolute w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-75" />
            )}
        </div>
    )
}
