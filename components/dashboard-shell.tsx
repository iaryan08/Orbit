'use client'

import { useAppMode } from './app-mode-context'
import { LunaraLayout } from './lunara/lunara-layout'
import { ConnectionSync } from './connection-sync'

export function DashboardShell({ children, lunaraData }: { children: React.ReactNode, lunaraData?: any }) {
    const { mode } = useAppMode()

    // userId and coupleId are already in lunaraData — no extra auth call needed
    const userId = lunaraData?.profile?.id
    const coupleId = lunaraData?.profile?.couple_id

    return (
        <>
            {/* ConnectionSync piggybacks on the shared couple channel — no extra WS */}
            {userId && coupleId && (
                <ConnectionSync coupleId={coupleId} userId={userId} />
            )}
            {mode === 'lunara' ? <LunaraLayout initialData={lunaraData} /> : children}
        </>
    )
}
