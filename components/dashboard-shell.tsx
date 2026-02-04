'use client'

import { useAppMode } from './app-mode-context'
import { LunaraLayout } from './lunara/lunara-layout'
import { motion, AnimatePresence } from 'framer-motion'

export function DashboardShell({ children, lunaraData }: { children: React.ReactNode, lunaraData?: any }) {
    const { mode } = useAppMode()

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
