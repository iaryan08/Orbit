'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type AppMode = 'moon' | 'lunara'

interface AppModeContextType {
    mode: AppMode
    setMode: (mode: AppMode) => void
    toggleMode: () => void
}

const AppModeContext = createContext<AppModeContextType | undefined>(undefined)

export function AppModeProvider({ children }: { children: React.ReactNode }) {
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
    }

    return (
        <AppModeContext.Provider value={{ mode, setMode: handleSetMode, toggleMode }}>
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
