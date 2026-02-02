'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Moon, Sparkles, Calendar, Settings, Bell, Info, ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollReveal } from '@/components/scroll-reveal'
import { LunaraOnboarding } from './lunara-onboarding'
import { createClient } from '@/lib/supabase/client'
import { saveLunaraOnboarding } from '@/lib/actions/auth'
import { Loader2 } from 'lucide-react'

export function LunaraDashboard() {
    const [loading, setLoading] = React.useState(true)
    const [profile, setProfile] = React.useState<any>(null)
    const [cycleProfile, setCycleProfile] = React.useState<any>(null)
    const supabase = createClient()

    React.useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const [profileRes, cycleRes] = await Promise.all([
                supabase.from('profiles').select('*').eq('id', user.id).single(),
                supabase.from('cycle_profiles').select('*').eq('id', user.id).single()
            ])

            setProfile(profileRes.data)
            setCycleProfile(cycleRes.data)
            setLoading(false)
        }
        fetchData()
    }, [])

    const handleOnboardingComplete = async (onboardingData: any) => {
        setLoading(true)
        const result = await saveLunaraOnboarding(onboardingData)
        if (result.success) {
            // Refresh local state or re-fetch
            const { data } = await supabase.from('cycle_profiles').select('*').eq('id', profile.id).single()
            setCycleProfile(data)
        }
        setLoading(false)
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                <p className="text-purple-200/40 uppercase tracking-widest text-[10px] font-bold">Synchronising with the moon...</p>
            </div>
        )
    }

    // Show onboarding ONLY if female and not completed
    if (profile?.gender === 'female' && !cycleProfile?.onboarding_completed) {
        return <LunaraOnboarding onComplete={handleOnboardingComplete} />
    }

    return (
        <div className="max-w-7xl mx-auto space-y-12 pt-12 pb-24 px-6 md:px-8">
            {/* Lunara Brand Header */}
            <ScrollReveal className="space-y-4 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-200/90 text-[10px] uppercase tracking-[0.3em] font-bold backdrop-blur-md shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    Lunara Sync
                </div>
                <h1 className="text-4xl md:text-7xl font-serif text-white leading-[1.1] tracking-tight">
                    Your Natural
                    <br />
                    <span className="bg-gradient-to-r from-purple-300 via-indigo-300 to-purple-200 bg-clip-text text-transparent drop-shadow-sm italic">
                        Flow & Rhythm
                    </span>
                </h1>
                <p className="text-purple-100/60 max-w-xl text-lg font-light leading-relaxed">
                    Track your cycle, understand your body, and connect with your partner through supportive insights.
                </p>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Main Cycle Widget Placeholder */}
                <ScrollReveal className="lg:col-span-2 row-span-2" delay={0.1}>
                    <div className="glass-card p-10 flex flex-col items-center justify-center h-full relative overflow-hidden group border-purple-500/20 bg-purple-950/20">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-50" />

                        <div className="relative w-64 h-64 flex items-center justify-center">
                            {/* Decorative rings */}
                            <div className="absolute inset-0 rounded-full border-4 border-dashed border-purple-500/10 animate-spin-slow" />
                            <div className="absolute inset-4 rounded-full border-2 border-purple-500/20" />

                            <div className="flex flex-col items-center text-center space-y-2 relative z-10">
                                <Moon className="w-12 h-12 text-purple-300 mb-2" />
                                <span className="text-5xl font-bold text-white">
                                    {profile?.gender === 'female' ? 'Day 14' : 'Partner Flow'}
                                </span>
                                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-purple-300/60">
                                    {profile?.gender === 'female' ? 'Follicular Phase' : 'Support Mode Active'}
                                </span>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-4">
                            <div className="px-6 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-200 text-xs font-bold uppercase tracking-widest cursor-pointer hover:bg-purple-500/20 transition-all">
                                {profile?.gender === 'female' ? 'Log Period' : 'How to Support'}
                            </div>
                        </div>

                        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full" />
                    </div>
                </ScrollReveal>

                {/* Daily Supportive Insight */}
                <ScrollReveal className="lg:col-span-2" delay={0.2}>
                    <div className="glass-card p-8 bg-black/40 border-white/5 h-full relative overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                            <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">
                                {profile?.gender === 'female' ? 'Daily Insight' : 'Partner Advice'}
                            </span>
                            <ShieldCheck className="w-4 h-4 text-purple-400/50" />
                        </div>
                        <p className="text-xl text-purple-50 italic font-serif leading-relaxed">
                            {profile?.gender === 'female'
                                ? '"You share your highest energy levels today. Perfect time for creative projects or an active outdoor date."'
                                : '"Your partner might be feeling more fatigued today. A warm meal or a gentle massage would mean the world to her."'
                            }
                        </p>
                    </div>
                </ScrollReveal>

                {/* Quick Stats */}
                <ScrollReveal className="lg:col-span-1" delay={0.3}>
                    <div className="glass-card p-6 bg-purple-900/10 border-purple-500/10 h-full">
                        <Calendar className="w-6 h-6 text-purple-400 mb-4" />
                        <span className="block text-2xl font-bold text-white">Feb 14</span>
                        <span className="text-[10px] uppercase tracking-widest font-bold text-white/30">Next Period</span>
                    </div>
                </ScrollReveal>

                {/* Privacy Stat */}
                <ScrollReveal className="lg:col-span-1" delay={0.4}>
                    <div className="glass-card p-6 bg-indigo-900/10 border-indigo-500/10 h-full">
                        <ShieldCheck className="w-6 h-6 text-indigo-400 mb-4" />
                        <span className="block text-lg font-bold text-white uppercase tracking-tight">Summary Only</span>
                        <span className="text-[10px] uppercase tracking-widest font-bold text-white/30">Sharing Mode</span>
                    </div>
                </ScrollReveal>
            </div>

            {/* Coming Soon Message */}
            <div className="text-center py-10 opacity-30">
                <p className="text-sm italic tracking-widest uppercase">Deep body insights & Log history coming soon</p>
            </div>
        </div>
    )
}
