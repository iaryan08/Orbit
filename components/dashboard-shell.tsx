'use client'

import dynamic from 'next/dynamic'
import { useAppMode } from './app-mode-context'

const LunaraLayout = dynamic(
    () => import('./lunara/lunara-layout').then(mod => mod.LunaraLayout),
    { ssr: false, loading: () => null }
)

export function DashboardShell({ children, lunaraData }: { children: React.ReactNode, lunaraData?: any }) {
    const { mode } = useAppMode()

    return (
        <>
            {mode === 'lunara' ? <LunaraLayout initialData={lunaraData} /> : children}
        </>
    )
}
