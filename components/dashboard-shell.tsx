'use client'

import { useAppMode } from './app-mode-context'
import { LunaraLayout } from './lunara/lunara-layout'

export function DashboardShell({ children, lunaraData }: { children: React.ReactNode, lunaraData?: any }) {
    const { mode } = useAppMode()

    if (mode === 'lunara') {
        return <LunaraLayout initialData={lunaraData} />
    }

    return <>{children}</>
}
