"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { ScrollReveal } from "@/components/scroll-reveal";

interface LunaraHeaderProps {
    tab: "dashboard" | "insights" | "partner";
}

export function LunaraHeader({ tab }: LunaraHeaderProps) {
    return (
        <ScrollReveal className="space-y-4 text-center lg:text-left relative">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-200/90 text-[10px] uppercase tracking-[0.3em] font-bold backdrop-blur-md shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        Lunara {tab === "dashboard" ? "Sync" : tab === "insights" ? "Discover" : "Together"}
                    </div>
                    <h1 className="hidden md:block text-4xl md:text-6xl font-serif text-white leading-[1.1] tracking-tight">
                        {tab === "dashboard" && "Your Natural Rhythm"}
                        {tab === "insights" && "Wellness & Intimacy"}
                        {tab === "partner" && "Sync & Support"}
                    </h1>
                </div>
            </div>
        </ScrollReveal>
    );
}
