'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const DashboardHeader = dynamic(
    () => import('@/components/dashboard-header').then(mod => mod.DashboardHeader),
    { ssr: false }
)

interface DeferredDashboardHeaderProps {
    userName: string
    userAvatar?: string | null
    partnerName?: string | null
    daysTogetherCount?: number
    coupleId?: string | null
}

export function DeferredDashboardHeader(props: DeferredDashboardHeaderProps) {
    const [ready, setReady] = useState(false)

    useEffect(() => {
        const run = () => setReady(true)
        const idle = (window as any).requestIdleCallback as ((cb: () => void, opts?: { timeout: number }) => number) | undefined

        if (idle) {
            const id = idle(run, { timeout: 5000 })
            return () => {
                const cancel = (window as any).cancelIdleCallback as ((idleId: number) => void) | undefined
                if (cancel) cancel(id)
            }
        }

        const timer = window.setTimeout(run, 1800)
        return () => window.clearTimeout(timer)
    }, [])

    if (!ready) return <div className="h-20" />
    return <DashboardHeader {...props} />
}
