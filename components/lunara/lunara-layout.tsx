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

export function LunaraLayout() {
    const [activeTab, setActiveTab] = React.useState<'dashboard' | 'insights' | 'partner'>('dashboard')
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

            {/* Navigation Tabs (Floating Dock) */}
            <div
                className={cn(
                    "fixed z-50 transition-all duration-700 ease-in-out",
                    "bottom-6 left-1/2 -translate-x-1/2", // Mobile/Default
                    scrolled
                        ? "md:top-1/2 md:bottom-auto md:left-8 md:-translate-y-1/2 md:translate-x-0" // Vertical left
                        : "md:bottom-auto md:top-8 md:left-1/2 md:-translate-x-1/2" // Horizontal top
                )}
            >
                <div
                    onMouseLeave={() => setHoveredTab(null)}
                    className={cn(
                        "glass-card flex items-center gap-1 p-1.5 rounded-full border shadow-2xl ring-1 ring-white/5 border-purple-500/30 bg-black/60 backdrop-blur-3xl transition-all duration-700 ease-in-out",
                        scrolled ? "md:flex-col md:py-4 md:px-2 md:rounded-[40px]" : "md:flex-row md:rounded-full md:p-1.5"
                    )}
                >
                    <TooltipProvider delayDuration={0}>
                        {/* Bell with Separator */}
                        <div className="flex items-center gap-1 pr-2">
                            <NotificationBell />
                            <div className={cn(
                                "bg-white/10 w-px h-6 mx-2 transition-all duration-300",
                                scrolled ? "md:w-6 md:h-px md:my-2 md:mx-0" : "md:w-px md:h-6 md:mx-2"
                            )} />
                        </div>

                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id
                            return (
                                <Tooltip key={tab.id}>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={() => setActiveTab(tab.id as any)}
                                            onMouseEnter={() => setHoveredTab(tab.id)}
                                            className={cn(
                                                "relative p-3 rounded-full flex items-center justify-center transition-all duration-300",
                                                isActive ? "text-white" : "text-white/40 hover:text-white"
                                            )}
                                        >
                                            <AnimatePresence>
                                                {(isActive || hoveredTab === tab.id) && (
                                                    <motion.div
                                                        layoutId="lunara-tab-bg"
                                                        className="absolute inset-0 bg-purple-500/25 border border-purple-400/30 shadow-[0_0_20px_rgba(168,85,247,0.3)] rounded-full"
                                                        style={{ opacity: isActive ? 1 : 0.6 }}
                                                        initial={{ opacity: 0, scale: 0.85 }}
                                                        animate={{ opacity: isActive ? 1 : 0.6, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.85 }}
                                                        transition={{
                                                            type: "spring",
                                                            bounce: 0.35,
                                                            stiffness: 180,
                                                            damping: 22,
                                                        }}
                                                    />
                                                )}
                                            </AnimatePresence>
                                            <tab.icon className={cn(
                                                "w-5 h-5 relative z-10 transition-all duration-300",
                                                isActive ? "text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)] scale-110" : "group-hover:scale-110"
                                            )} />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent
                                        side={scrolled ? "right" : "bottom"}
                                        sideOffset={22}
                                        className="bg-black/90 text-white border-white/10 rounded-2xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest backdrop-blur-xl z-[60]"
                                    >
                                        <p>{tab.label}</p>
                                    </TooltipContent>
                                </Tooltip>
                            )
                        })}
                    </TooltipProvider>
                </div>
            </div>

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
