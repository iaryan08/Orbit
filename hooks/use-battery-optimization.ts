'use client'

import { useState, useEffect } from 'react'

/**
 * Hook to pause expensive operations (animations, realtime, heavy sync)
 * when the tab is not visible. Essential for battery life and mobile performance.
 */
export function useBatteryOptimization() {
    const [isVisible, setIsVisible] = useState(true)

    useEffect(() => {
        if (typeof document === 'undefined') return

        const handleVisibilityChange = () => {
            setIsVisible(!document.hidden)

            if (document.hidden) {
                console.log('[BatteryOptimization] App backgrounded. Pausing expensive tasks.')
            } else {
                console.log('[BatteryOptimization] App foregrounded. Resuming tasks.')
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)

        // Initial check
        setIsVisible(!document.hidden)

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [])

    return { isVisible }
}
