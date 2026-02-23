'use client'

import { useAppMode } from './app-mode-context'
import { LunaraLayout } from './lunara/lunara-layout'
import { motion, AnimatePresence } from 'framer-motion'
import { ConnectionSync } from './connection-sync'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function DashboardShell({ children, lunaraData }: { children: React.ReactNode, lunaraData?: any }) {
    const { mode } = useAppMode()
    const router = useRouter()
    const supabase = createClient()
    const coupleId = lunaraData?.profile?.couple_id
    const [userIdState, setUserIdState] = useState<string | null>(null)

    useEffect(() => {
        const getUserId = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) setUserIdState(user.id)
        }
        getUserId()
    }, [supabase.auth])

    // Aggressive global refresh removed to prevent performance-killing render loops. 
    // Real-time updates are now handled surgically by specific widgets (e.g. PartnerMood).
    useEffect(() => {
        if (!coupleId) return

        console.log('[DashboardShell] Global realtime listener deactivated for performance.')
    }, [coupleId])

    return (
        <>
            {userIdState && coupleId && (
                <ConnectionSync coupleId={coupleId} userId={userIdState} />
            )}
            <AnimatePresence mode="wait">
                {mode === 'lunara' ? (
                    <motion.div
                        key="lunara"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <LunaraLayout initialData={lunaraData} />
                    </motion.div>
                ) : (
                    <motion.div
                        key="moon"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
