'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

const NotificationBell = dynamic(
    () => import('@/components/notification-bell').then(mod => mod.NotificationBell),
    { ssr: false }
)

export function DeferredNotificationBell({ className }: { className?: string }) {
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

        const timer = window.setTimeout(run, 1500)
        return () => window.clearTimeout(timer)
    }, [])

    if (!ready) {
        return (
            <div className={cn('relative text-purple-200/70 rounded-full h-10 w-10 flex items-center justify-center', className)}>
                <Bell className="h-5 w-5" />
            </div>
        )
    }

    return <NotificationBell className={className} />
}
