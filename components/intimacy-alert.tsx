"use client";

import { ScrollReveal } from "@/components/scroll-reveal";
import { Flame } from "lucide-react";

interface IntimacyAlertProps {
    lunaraData: any;
    partnerProfile: any;
}

export function IntimacyAlert({ lunaraData, partnerProfile }: IntimacyAlertProps) {
    if (!lunaraData) return null;

    const today = lunaraData.currentDateIST;
    const pId = partnerProfile?.id;
    const pLog = lunaraData.cycleLogs?.find((l: any) => l.user_id === pId && l.log_date === today);

    if (pLog?.sex_drive === 'very_high') {
        return (
            <ScrollReveal className="lg:col-span-4" delay={0.05}>
                <div className="glass-card p-4 bg-gradient-to-r from-orange-600/30 to-red-600/30 border-orange-500/50 flex items-center justify-between relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-600/10 animate-pulse" />
                    <div className="flex items-center gap-5 relative z-10 w-full md:justify-start">
                        <Flame className="w-6 h-6 text-orange-500 animate-pulse" fill="currentColor" />
                        <div>
                            <h3 className="text-base font-bold text-white leading-tight">Intense Passion Alert</h3>
                            <p className="text-xs text-orange-100/90 font-medium">
                                {partnerProfile?.display_name || 'Partner'} is feeling a burning desire for you right now.
                            </p>
                        </div>
                    </div>
                </div>
            </ScrollReveal>
        );
    }
    return null;
}
