'use client'

import { useAppMode } from './app-mode-context'
import { LunaraLayout } from './lunara/lunara-layout'
import { motion, AnimatePresence } from 'framer-motion'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function DashboardShell({ children, lunaraData }: { children: React.ReactNode, lunaraData?: any }) {
    const { mode } = useAppMode()
    const router = useRouter()
    const supabase = createClient()
    const coupleId = lunaraData?.profile?.couple_id

    useEffect(() => {
        if (!coupleId) return

        const channel = supabase
            .channel('dashboard-realtime-sync')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', filter: `couple_id=eq.${coupleId}` },
                () => {
                    console.log('Realtime update received in Shell, refreshing...')
                    router.refresh()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [router, coupleId])

    return (
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
    )
}
