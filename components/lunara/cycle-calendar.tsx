'use client'

import React, { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { format, addDays, subDays, isSameDay, startOfDay, differenceInDays, isSameMonth } from 'date-fns'
import { cn } from '@/lib/utils'
import { Droplets, Sparkles, Baby, Info, Target, CalendarDays } from 'lucide-react'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'

// --- Types ---
interface CycleProfile {
    last_period_start: string | null
    period_ended_at?: string | null
    avg_cycle_length: number
    avg_period_length: number
}

interface CalendarProps {
    cycleProfile: CycleProfile
}

// --- Logic ---
function getDayStatus(date: Date, profile: CycleProfile) {
    if (!profile.last_period_start) return { phase: 'unknown', cycleDay: 0 }

    const lastPeriod = startOfDay(new Date(profile.last_period_start))
    const targetDate = startOfDay(date)
    const avgCycle = profile.avg_cycle_length || 28
    const avgPeriod = profile.avg_period_length || 5

    let diff = differenceInDays(targetDate, lastPeriod)
    let cycleDay = (diff % avgCycle) + 1
    if (cycleDay <= 0) cycleDay += avgCycle

    if (cycleDay <= avgPeriod) {
        // Distinguish between current/past period and future predicted periods
        const isFutureCycle = diff >= avgCycle

        if (isFutureCycle) {
            return { phase: 'predicted', cycleDay }
        }

        // If period ended early for THIS cycle, return follicular for subsequent days
        if (profile.period_ended_at && profile.last_period_start) {
            const periodEnd = startOfDay(new Date(profile.period_ended_at))
            const periodStart = startOfDay(new Date(profile.last_period_start))

            // Only apply if the end date is for the current cycle
            if (periodEnd >= periodStart && targetDate > periodEnd) {
                return { phase: 'follicular', cycleDay }
            }
        }
        return { phase: 'menstrual', cycleDay, intensity: 'high' }
    }

    const ovulationDay = avgCycle - 14
    const fertileStart = ovulationDay - 5
    const fertileEnd = ovulationDay + 1

    if (cycleDay === ovulationDay) return { phase: 'ovulation', cycleDay }
    if (cycleDay >= fertileStart && cycleDay <= fertileEnd) return { phase: 'fertile', cycleDay }
    if (cycleDay > fertileEnd) return { phase: 'luteal', cycleDay }

    return { phase: 'follicular', cycleDay }
}

export function CycleCalendar({ cycleProfile }: CalendarProps) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const today = new Date()

    const days = Array.from({ length: 90 }, (_, i) => {
        const d = subDays(today, 30 - i)
        return {
            date: d,
            status: getDayStatus(d, cycleProfile)
        }
    })

    const scrollToToday = () => {
        if (scrollRef.current) {
            const todayEl = scrollRef.current.querySelector('[data-today="true"]')
            if (todayEl) {
                todayEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
            }
        }
    }

    useEffect(() => {
        scrollToToday()
    }, [])

    return (
        <div className="w-full space-y-4">
            {/* Header Area */}
            {/* Header Area */}
            <div className="flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={scrollToToday}
                        className="p-1.5 sm:px-3 sm:py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-bold uppercase tracking-widest text-purple-200/60 hover:bg-purple-500/20 hover:text-purple-100 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/5 group"
                        title="Scroll to Today"
                    >
                        <span className="hidden sm:inline">Today</span>
                        <Target className="w-4 h-4 sm:hidden group-hover:text-purple-200 transition-colors" />
                    </button>
                    <h3 className="text-xs font-bold text-white/40 uppercase tracking-[0.2em] whitespace-nowrap">Cycle Calendar</h3>
                </div>

                <Popover>
                    <PopoverTrigger asChild>
                        <button className="p-2 rounded-full bg-white/5 border border-white/10 text-white/40 hover:bg-white/10 hover:text-white/60 transition-all outline-none">
                            <Info className="w-4 h-4" />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent side="bottom" align="end" className="bg-black/95 border border-white/10 p-4 shadow-2xl backdrop-blur-xl z-[100] min-w-[200px] rounded-2xl">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">Menstrual Phase</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.5)]" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-teal-400">Fertile Window</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-teal-400 border border-white/20 shadow-[0_0_10px_rgba(45,212,191,0.5)]" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-teal-400">Ovulation Day</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Predicted Period</span>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            {/* Horizontal Scroll Area */}
            <div
                ref={scrollRef}
                className="flex items-center overflow-x-auto gap-3 py-6 sm:py-10 px-4 snap-x snap-mandatory scrollbar-hide mask-fade-sides"
            >
                {days.map((day, i) => {
                    const isToday = isSameDay(day.date, today)
                    const { phase, cycleDay } = day.status
                    const isNewMonth = i === 0 || !isSameMonth(day.date, days[i - 1].date)

                    return (
                        <React.Fragment key={i}>
                            {isNewMonth && (
                                <div className="flex flex-col items-center justify-center gap-1.5 px-3 snap-center shrink-0">
                                    <div className="w-px h-6 sm:h-8 bg-purple-500/20" />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-300/40 whitespace-nowrap hidden md:block rotate-180" style={{ writingMode: 'vertical-rl' }}>
                                        {format(day.date, 'MMMM')}
                                    </span>
                                    <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-purple-300/30 whitespace-nowrap md:hidden">
                                        {format(day.date, 'MMM')}
                                    </span>
                                    <div className="w-px h-6 sm:h-8 bg-purple-500/20" />
                                </div>
                            )}

                            <motion.div
                                data-today={isToday}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.01 }}
                                className={cn(
                                    "min-w-[4rem] sm:min-w-[4.5rem] h-20 sm:h-24 rounded-[1.5rem] sm:rounded-[2rem] flex flex-col items-center justify-center gap-1 sm:gap-1.5 relative snap-center transition-all duration-300 border shrink-0",
                                    isToday
                                        ? "bg-purple-500/20 border-purple-500/30 ring-1 ring-purple-500/20 scale-105 z-10 shadow-2xl shadow-purple-500/20"
                                        : "bg-purple-500/5 border-purple-500/10 text-white/40 hover:bg-purple-500/10"
                                )}
                            >
                                <span className={cn(
                                    "text-[8px] sm:text-[10px] font-bold uppercase tracking-widest opacity-60",
                                    isToday ? "text-purple-200 opacity-100" : "text-white/40"
                                )}>
                                    {format(day.date, 'EEE')}
                                </span>

                                <div className={cn(
                                    "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-lg font-bold transition-all relative",
                                    phase === 'menstrual' ? "bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]" :
                                        phase === 'predicted' ? "bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]" :
                                            phase === 'ovulation' ? "bg-teal-400 text-black shadow-[0_0_15px_rgba(45,212,191,0.4)]" :
                                                phase === 'fertile' ? "bg-teal-400/20 text-teal-200 border border-teal-400/30" :
                                                    isToday ? "bg-white text-black shadow-lg" : "bg-white/5 text-white"
                                )}>
                                    {format(day.date, 'd')}
                                    {phase === 'menstrual' && <Droplets className="w-2 h-2 sm:w-3 h-3 absolute -bottom-1 text-white" fill="currentColor" />}
                                    {phase === 'predicted' && <Droplets className="w-2 h-2 sm:w-3 h-3 absolute -bottom-1 text-white/60" fill="currentColor" />}
                                    {phase === 'ovulation' && <Sparkles className="w-2 h-2 sm:w-3 h-3 absolute -bottom-1 text-black" fill="currentColor" />}
                                    {phase === 'fertile' && <Baby className="w-2 h-2 sm:w-3 h-3 absolute -bottom-1 text-teal-400" />}
                                </div>

                                <span className={cn(
                                    "text-[7px] sm:text-[9px] font-bold uppercase tracking-widest",
                                    phase === 'menstrual' ? "text-rose-400" :
                                        phase === 'predicted' ? "text-purple-400" :
                                            phase === 'ovulation' ? "text-teal-400" :
                                                phase === 'fertile' ? "text-teal-400/60" :
                                                    "text-purple-300/20"
                                )}>
                                    Day {cycleDay}
                                </span>
                            </motion.div>
                        </React.Fragment>
                    )
                })}
            </div>
        </div>
    )
}
