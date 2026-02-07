"use client";

import { ScrollReveal } from "@/components/scroll-reveal";
import { cn } from "@/lib/utils";
import { Heart, ImageIcon, PenLine } from "lucide-react";

interface RelationshipStatsProps {
    couple: any;
    lettersCount: number;
    memoriesCount: number;
}

export function RelationshipStats({ couple, lettersCount, memoriesCount }: RelationshipStatsProps) {
    const startDate = couple?.anniversary_date || couple?.paired_at;
    const daysTogether = startDate
        ? Math.floor((new Date().getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    return (
        <ScrollReveal className="lg:col-span-4" delay={0}>
            <div className="glass-card p-4 md:p-6 flex flex-row items-center justify-between gap-4 md:gap-8 relative overflow-hidden group min-h-[100px]">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500/30 via-amber-500/30 to-rose-500/30 opacity-50" />

                {/* Days Together */}
                <div className="flex items-center gap-3 md:gap-5 flex-1">
                    <div className="relative shrink-0">
                        <Heart className="w-10 h-10 md:w-12 md:h-12 text-rose-500/80" fill="currentColor" />
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl md:text-5xl font-bold text-rose-50 tracking-tighter leading-none">
                                {daysTogether}
                            </span>
                            <span className="text-xs md:text-sm text-rose-100/50 font-serif italic">Days</span>
                        </div>
                        <p className="text-[8px] md:text-[10px] uppercase text-white/30 tracking-widest font-bold">Since Start</p>
                    </div>
                </div>

                <div className="h-10 w-px bg-white/10 shrink-0" />

                {/* Letters & Memories Stacked (One below other) */}
                <div className="flex flex-col gap-4 flex-1 justify-center items-start pl-4 md:pl-8">
                    <div className="flex items-center gap-3">
                        <PenLine className="w-4 h-4 text-rose-300/50" />
                        <div className="flex flex-col">
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl md:text-2xl font-bold text-white/90 leading-none">{lettersCount}</span>
                                <span className={cn(
                                    "text-[9px] uppercase text-white/20 tracking-widest font-bold",
                                    daysTogether > 999 && "hidden md:inline"
                                )}>Letters</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <ImageIcon className="w-4 h-4 text-amber-300/50" />
                        <div className="flex flex-col">
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl md:text-2xl font-bold text-white/90 leading-none">{memoriesCount}</span>
                                <span className={cn(
                                    "text-[9px] uppercase text-white/20 tracking-widest font-bold",
                                    daysTogether > 999 && "hidden md:inline"
                                )}>Memories</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ScrollReveal>
    );
}
