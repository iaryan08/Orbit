'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const PushNotificationManager = dynamic(() => import('@/components/PushNotificationManager'), {
    ssr: false
})

export function DeferredPushManager() {
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

        const timer = window.setTimeout(run, 2500)
        return () => window.clearTimeout(timer)
    }, [])

    if (!ready) return null
    return <PushNotificationManager />
}
