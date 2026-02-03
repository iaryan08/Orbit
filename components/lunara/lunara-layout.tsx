'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, LayoutDashboard, Heart, BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { fetchDashboardData } from '@/lib/actions/consolidated'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { LunaraTabDashboard } from './lunara-tab-dashboard'
import { LunaraTabPartner } from './lunara-tab-partner'
import { LunaraTabInsights } from './lunara-tab-insights'
import { ScrollReveal } from '@/components/scroll-reveal'
import { NotificationBell } from '@/components/notification-bell'
import { useAppMode } from '@/components/app-mode-context'

export function LunaraLayout() {
    const { activeLunaraTab: activeTab } = useAppMode()
    const [hoveredTab, setHoveredTab] = React.useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [data, setData] = React.useState<any>(null)
    const supabase = createClient()

    useEffect(() => {
        let channel: any = null

        const loadData = async () => {
            const result = await fetchDashboardData()
            if (result.success && result.data) {
                setData(result.data)
                setLoading(false)

                // Setup Realtime Subs
                if (result.data.profile.couple_id && !channel) {
                    const coupleId = result.data.profile.couple_id
                    channel = supabase
                        .channel('lunara-layout-updates')
                        .on('postgres_changes', { event: '*', schema: 'public', table: 'cycle_profiles', filter: `couple_id=eq.${coupleId}` }, loadData)
                        .on('postgres_changes', { event: '*', schema: 'public', table: 'cycle_logs', filter: `couple_id=eq.${coupleId}` }, loadData)
                        .on('postgres_changes', { event: '*', schema: 'public', table: 'support_logs', filter: `couple_id=eq.${coupleId}` }, loadData)
                        .subscribe()
                }
            } else {
                console.error("Failed to load Lunara data:", result.error)
                setLoading(false)
            }
        }

        loadData()

        return () => {
            if (channel) supabase.removeChannel(channel)
        }
    }, [])

    // Scroll detection
    const [scrolled, setScrolled] = useState(false)
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 40)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                <p className="text-purple-200/40 uppercase tracking-widest text-[10px] font-bold">Synchronising with the moon...</p>
            </div>
        )
    }

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'insights', label: 'Insights', icon: BookOpen },
        { id: 'partner', label: 'Partner', icon: Heart },
    ]

    return (
        <div className="max-w-7xl mx-auto space-y-8 pt-12 pb-40 px-6 md:px-8">
            {/* Header Area */}
            <ScrollReveal className="space-y-4 text-center lg:text-left relative">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-200/90 text-[10px] uppercase tracking-[0.3em] font-bold backdrop-blur-md shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                            <Sparkles className="w-3 h-3 text-purple-400" />
                            Lunara {activeTab === 'dashboard' ? 'Sync' : activeTab === 'insights' ? 'Discover' : 'Together'}
                        </div>
                        <h1 className="hidden md:block text-4xl md:text-6xl font-serif text-white leading-[1.1] tracking-tight">
                            {activeTab === 'dashboard' && 'Your Natural Rhythm'}
                            {activeTab === 'insights' && 'Wellness & Intimacy'}
                            {activeTab === 'partner' && 'Sync & Support'}
                        </h1>
                    </div>
                </div>
            </ScrollReveal>

            {/* Internal Navigation Tabs Removed - Using Global DashboardHeader */}

            {/* Tab Content */}
            <div className="min-h-[500px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        {activeTab === 'dashboard' && <LunaraTabDashboard data={data} />}
                        {activeTab === 'partner' && <LunaraTabPartner data={data} />}
                        {activeTab === 'insights' && <LunaraTabInsights coupleId={data.profile.couple_id} />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
}
