'use client'

import { useAppMode } from './app-mode-context'
import { LunaraLayout } from './lunara/lunara-layout'
import { ConnectionSync } from './connection-sync'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export function DashboardShell({ children, lunaraData }: { children: React.ReactNode, lunaraData?: any }) {
    const { mode } = useAppMode()
    const supabase = createClient()
    const coupleId = lunaraData?.profile?.couple_id
    const [userIdState, setUserIdState] = useState<string | null>(null)
    const [enableSync, setEnableSync] = useState(false)

    useEffect(() => {
        const getUserId = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) setUserIdState(user.id)
        }
        getUserId()
    }, [supabase.auth])

    useEffect(() => {
        if (!coupleId || !userIdState) return

        const schedule = () => setEnableSync(true)
        const idle = (window as any).requestIdleCallback as ((cb: () => void, opts?: { timeout: number }) => number) | undefined

        if (idle) {
            const id = idle(schedule, { timeout: 3500 })
            return () => {
                const cancel = (window as any).cancelIdleCallback as ((idleId: number) => void) | undefined
                if (cancel) cancel(id)
            }
        }

        const timer = window.setTimeout(schedule, 1500)
        return () => window.clearTimeout(timer)
    }, [coupleId, userIdState])

    return (
        <>
            {enableSync && userIdState && coupleId && (
                <ConnectionSync coupleId={coupleId} userId={userIdState} />
            )}
            {mode === 'lunara' ? <LunaraLayout initialData={lunaraData} /> : children}
        </>
    )
}
