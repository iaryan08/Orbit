'use client'

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'

type AppMode = 'moon' | 'lunara'

interface AppModeContextType {
    mode: AppMode
    setMode: (mode: AppMode) => void
    toggleMode: () => void
    activeLunaraTab: 'dashboard' | 'insights' | 'partner'
    setActiveLunaraTab: (tab: 'dashboard' | 'insights' | 'partner') => void
    profile: any | null
    coupleId: string | null
}

const AppModeContext = createContext<AppModeContextType | undefined>(undefined)

interface AppModeProviderProps {
    children: React.ReactNode
    initialProfile?: any
    initialCoupleId?: string | null
}

const MIN_SWIPE_DISTANCE = 50

export function AppModeProvider({
    children,
    initialProfile,
    initialCoupleId
}: AppModeProviderProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [mode, setMode] = useState<AppMode>('moon')
    const [mounted, setMounted] = useState(false)
    const [profile] = useState(initialProfile || null)
    const [coupleId] = useState(initialCoupleId || null)
    const [activeLunaraTab, setActiveLunaraTab] = useState<'dashboard' | 'insights' | 'partner'>('dashboard')

    // Gesture State Refs
    const touchStartRef = useRef<{ x: number, y: number } | null>(null)
    const touchEndRef = useRef<{ x: number, y: number } | null>(null)
    const stateRef = useRef({ mode, activeLunaraTab, pathname })

    useEffect(() => {
        stateRef.current = { mode, activeLunaraTab, pathname }
    }, [mode, activeLunaraTab, pathname])

    // Initialize Mode
    useEffect(() => {
        const savedMode = localStorage.getItem('app-mode') as AppMode
        if (savedMode && (savedMode === 'moon' || savedMode === 'lunara')) {
            setMode(savedMode)
        }
        setMounted(true)
    }, [])

    const handleSetMode = (newMode: AppMode) => {
        setMode(newMode)
        localStorage.setItem('app-mode', newMode)
    }

    const toggleMode = () => {
        const newMode = mode === 'moon' ? 'lunara' : 'moon'
        handleSetMode(newMode)
        if (pathname && !pathname.startsWith('/dashboard')) {
            router.push('/dashboard')
        }
    }

    // Gesture Event Listeners
    useEffect(() => {
        const onTouchStart = (e: TouchEvent) => {
            touchEndRef.current = null
            touchStartRef.current = {
                x: e.targetTouches[0].clientX,
                y: e.targetTouches[0].clientY
            }
        }

        const onTouchMove = (e: TouchEvent) => {
            touchEndRef.current = {
                x: e.targetTouches[0].clientX,
                y: e.targetTouches[0].clientY
            }
        }

        const onTouchEnd = () => {
            if (!touchStartRef.current || !touchEndRef.current) return

            const xDistance = touchStartRef.current.x - touchEndRef.current.x
            const yDistance = touchStartRef.current.y - touchEndRef.current.y

            const isHorizontalSwipe = Math.abs(xDistance) > Math.abs(yDistance)
            const isSignificantSwipe = Math.abs(xDistance) > MIN_SWIPE_DISTANCE

            if (isHorizontalSwipe && isSignificantSwipe) {
                const { mode, activeLunaraTab, pathname } = stateRef.current
                const isLeftSwipe = xDistance > 0
                const isRightSwipe = xDistance < 0

                // Moon Routes List
                const moonRoutes = ['/dashboard', '/letters', '/memories', '/intimacy']
                // Check if current page is a known Moon route
                const moonIndex = moonRoutes.indexOf(pathname)

                // PRIORITY 1: Moon Navigation (Works if we are on a Moon Page, regardless of "mode" setting)
                if (moonIndex !== -1) {
                    if (isLeftSwipe && moonIndex < moonRoutes.length - 1) {
                        router.push(moonRoutes[moonIndex + 1])
                    } else if (isRightSwipe && moonIndex > 0) {
                        router.push(moonRoutes[moonIndex - 1])
                    }
                    return // Handled
                }

                // PRIORITY 2: Lunara Navigation (Only on Dashboard when in Lunara Mode)
                if (mode === 'lunara' && pathname === '/dashboard') {
                    const lunaraTabs = ['dashboard', 'insights', 'partner'] as const
                    const currentIndex = lunaraTabs.indexOf(activeLunaraTab)

                    if (currentIndex === -1) return

                    if (isLeftSwipe && currentIndex < lunaraTabs.length - 1) {
                        setActiveLunaraTab(lunaraTabs[currentIndex + 1])
                    } else if (isRightSwipe && currentIndex > 0) {
                        setActiveLunaraTab(lunaraTabs[currentIndex - 1])
                    }
                }
            }
        }

        window.addEventListener('touchstart', onTouchStart, { passive: true })
        window.addEventListener('touchmove', onTouchMove, { passive: true })
        window.addEventListener('touchend', onTouchEnd)

        return () => {
            window.removeEventListener('touchstart', onTouchStart)
            window.removeEventListener('touchmove', onTouchMove)
            window.removeEventListener('touchend', onTouchEnd)
        }
    }, [router]) // Dependencies are handled via stateRef to prevent listener churn

    return (
        <AppModeContext.Provider value={{
            mode,
            setMode: handleSetMode,
            toggleMode,
            activeLunaraTab,
            setActiveLunaraTab,
            profile,
            coupleId
        }}>
            {children}
        </AppModeContext.Provider>
    )
}

export function useAppMode() {
    const context = useContext(AppModeContext)
    if (context === undefined) {
        throw new Error('useAppMode must be used within an AppModeProvider')
    }
    return context
}
