'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Plus, Minus, ChevronDown, ChevronUp } from 'lucide-react'
import { ScrollReveal } from '@/components/scroll-reveal'
import { cn } from '@/lib/utils'

interface DashboardWelcomeProps {
    profile: any
    partnerProfile: any
}

export function DashboardWelcome({ profile, partnerProfile }: DashboardWelcomeProps) {
    const [isExpanded, setIsExpanded] = useState(true)

    return (
        <ScrollReveal className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-amber-200/90 text-[10px] uppercase tracking-[0.3em] font-bold backdrop-blur-md text-glow-gold">
                    <Sparkles className="w-3 h-3 text-amber-400/80" />
                    MoonBetweenUs
                </div>

                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white transition-all hover:bg-white/10 flex items-center gap-2 group"
                >
                    <span className="text-[10px] uppercase tracking-widest font-bold hidden sm:inline opacity-0 group-hover:opacity-100 transition-opacity">
                        {isExpanded ? 'Minimize' : 'Expand'}
                    </span>
                    {isExpanded ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="space-y-4 text-center lg:text-left pt-2">
                            <h1 className="hidden md:block text-4xl md:text-7xl font-romantic text-rose-50 leading-[1.1] tracking-wide text-glow-rose">
                                Always Together
                                <br />
                                <span className="bg-gradient-to-r from-amber-200 via-rose-300 to-orange-300 bg-clip-text text-transparent drop-shadow-sm">
                                    Forever
                                </span>
                            </h1>
                            <div className="flex flex-col lg:flex-row items-center gap-4 pt-4">
                                <div className="flex -space-x-4">
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-background bg-primary/20 flex items-center justify-center ring-2 ring-white/10 overflow-hidden shadow-xl">
                                        {profile?.avatar_url ? (
                                            <img src={profile.avatar_url} className="w-full h-full object-cover" alt="You" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-rose-500/20 text-rose-200 font-bold text-xs">
                                                {profile?.display_name?.charAt(0) || "U"}
                                            </div>
                                        )}
                                    </div>
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-background bg-secondary/20 flex items-center justify-center ring-2 ring-white/10 overflow-hidden shadow-xl">
                                        {partnerProfile?.avatar_url ? (
                                            <img src={partnerProfile.avatar_url} className="w-full h-full object-cover" alt="Partner" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-cyan-500/20 text-cyan-200 font-bold text-xs">
                                                {partnerProfile?.display_name?.charAt(0) || "P"}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <p className="text-rose-100/70 uppercase text-xs tracking-[0.2em] font-medium">
                                    Connected with <span className="text-rose-50 font-bold">{partnerProfile?.display_name || 'Partner'}</span>
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </ScrollReveal>
    )
}
