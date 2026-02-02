'use client'

import { useAppMode } from './app-mode-context'
import { LunaraDashboard } from './lunara-dashboard'

export function DashboardShell({ children }: { children: React.ReactNode }) {
    const { mode } = useAppMode()

    if (mode === 'lunara') {
        return <LunaraDashboard />
    }

    return <>{children}</>
}
