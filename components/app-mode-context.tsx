'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

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

export function AppModeProvider({
    children,
    initialProfile,
    initialCoupleId
}: AppModeProviderProps) {
    const router = useRouter()
    const [mode, setMode] = useState<AppMode>('moon')
    const [mounted, setMounted] = useState(false)
    const [profile] = useState(initialProfile || null)
    const [coupleId] = useState(initialCoupleId || null)

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
        router.push('/dashboard')
    }

    const [activeLunaraTab, setActiveLunaraTab] = useState<'dashboard' | 'insights' | 'partner'>('dashboard')

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
