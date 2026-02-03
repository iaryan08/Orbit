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
}

const AppModeContext = createContext<AppModeContextType | undefined>(undefined)

export function AppModeProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const [mode, setMode] = useState<AppMode>('moon')
    const [mounted, setMounted] = useState(false)

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
            setActiveLunaraTab
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
