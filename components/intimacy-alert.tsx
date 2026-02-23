"use client";

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

    if (pLog?.sex_drive === 'high' || pLog?.sex_drive === 'very_high') {
        const isPartnerMale = lunaraData.profile?.gender === 'female';
        const partnerName = partnerProfile?.first_name || partnerProfile?.display_name || (isPartnerMale ? 'him' : 'her');
        const pronoun = isPartnerMale ? "his" : "her";
        const isVeryHigh = pLog.sex_drive === 'very_high';

        // Custom config based on libido level
        const alertConfig = isVeryHigh
            ? {
                title: "Intense Passion Alert",
                description: `You're driving ${partnerName} out of ${pronoun} mind with need.`,
                gradientClass: "from-orange-600/30 to-red-600/30",
                pulseGradient: "from-orange-500/10 to-red-600/10",
                borderColor: "border-orange-500/50",
                shadowColor: "shadow-[0_0_30px_rgba(234,88,12,0.2)]",
                flameColor: "text-orange-500",
                glowColor: "bg-orange-500/40",
                badgeBg: "bg-orange-500/20",
                badgeShadow: "shadow-[0_0_20px_rgba(249,115,22,0.6)]",
            }
            : {
                title: "Things Are Heating Up",
                description: `${partnerName} is feeling a very strong spark of desire for you.`,
                gradientClass: "from-amber-600/30 to-orange-600/30",
                pulseGradient: "from-amber-500/10 to-orange-600/10",
                borderColor: "border-amber-500/50",
                shadowColor: "shadow-[0_0_30px_rgba(245,158,11,0.2)]",
                flameColor: "text-amber-500",
                glowColor: "bg-amber-500/40",
                badgeBg: "bg-amber-500/20",
                badgeShadow: "shadow-[0_0_20px_rgba(245,158,11,0.6)]",
            };

        return (
            <div className={`w-full lg:col-span-4 glass-card p-4 sm:p-6 bg-gradient-to-r ${alertConfig.gradientClass} ${alertConfig.borderColor} flex items-center justify-between relative overflow-hidden group ${alertConfig.shadowColor}`}>
                <div className={`absolute inset-0 bg-gradient-to-r ${alertConfig.pulseGradient} animate-pulse`} />

                <div className="relative z-10 flex w-full items-center gap-4 sm:gap-6 justify-start text-left">
                    <div className="relative shrink-0">
                        <div className={`absolute inset-0 ${alertConfig.glowColor} blur-xl rounded-full animate-pulse`} />
                        <div className={`p-3 rounded-full ${alertConfig.badgeBg} border ${alertConfig.borderColor} ${alertConfig.badgeShadow} relative z-10`}>
                            <Flame className={`w-8 h-8 ${alertConfig.flameColor} drop-shadow-[0_0_10px_currentColor] animate-pulse`} fill="currentColor" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg sm:text-xl font-bold text-white mb-0.5 sm:mb-1 drop-shadow-md whitespace-nowrap tracking-tight">
                            {alertConfig.title}
                        </h3>
                        <p className="text-white/90 italic font-medium text-xs sm:text-sm leading-snug">
                            {alertConfig.description}
                        </p>
                    </div>
                </div>
            </div>
        );
    }
    return null;
}
