'use client'

import { useAppMode } from './app-mode-context'
import { LunaraLayout } from './lunara/lunara-layout'

export function DashboardShell({ children }: { children: React.ReactNode }) {
    const { mode } = useAppMode()

    if (mode === 'lunara') {
        return <LunaraLayout />
    }

    return <>{children}</>
}
