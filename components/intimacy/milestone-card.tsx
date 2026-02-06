"use client";

import { useState, useEffect } from "react";
import { format, differenceInDays } from "date-fns";
import { CalendarIcon, Heart, Unlock, Sparkles, Wand2, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";

interface MilestoneCardProps {
    id: string;
    label: string;
    question: string;
    milestone: any;
    myContentField: string;
    partnerContentField: string;
    myDateField: string;
    partnerDateField: string;
    icon?: React.ReactNode | string;
    image?: string;
    isOpen: boolean;
    onToggle: () => void;
    onSave: (id: string, date: Date | undefined, content: string) => Promise<void>;
}

export function MilestoneCard({
    id,
    label,
    question,
    milestone,
    myContentField,
    partnerContentField,
    myDateField,
    partnerDateField,
    icon,
    image,
    isOpen,
    onToggle,
    onSave
}: MilestoneCardProps) {
    const showDualDates = ['first_kiss', 'first_surprise', 'first_memory'].includes(id);

    const [date, setDate] = useState<Date | undefined>(
        showDualDates
            ? (milestone?.[myDateField] ? new Date(milestone[myDateField]) : milestone?.milestone_date ? new Date(milestone.milestone_date) : undefined)
            : (milestone?.milestone_date ? new Date(milestone.milestone_date) : undefined)
    );
    const [content, setContent] = useState(milestone?.[myContentField] || "");
    const [saving, setSaving] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);

    useEffect(() => {
        if (milestone && !hasInteracted) {
            const initialDate = showDualDates
                ? (milestone[myDateField] || milestone.milestone_date)
                : milestone.milestone_date;

            if (initialDate) {
                setDate(new Date(initialDate));
            }
            if (milestone[myContentField]) {
                setContent(milestone[myContentField]);
            }
        }
    }, [milestone, myContentField, myDateField, hasInteracted, showDualDates, id]);

    const myAnswer = milestone?.[myContentField];
    const partnerAnswer = milestone?.[partnerContentField];
    const partnerDateRaw = milestone?.[partnerDateField];
    const partnerDate = partnerDateRaw ? new Date(partnerDateRaw) : null;
    const isCompleted = myAnswer && partnerAnswer;

    // Dual date logic
    const dateDiff = date && partnerDate ? Math.abs(differenceInDays(date, partnerDate)) : null;
    const isSynced = dateDiff !== null && dateDiff === 0;

    // Personalized date labels
    const getMyDateLabel = () => {
        switch (id) {
            case 'first_kiss': return 'You kissed her 😘';
            case 'first_surprise': return 'You received a surprise 🎁';
            case 'first_memory': return 'Your memory date 📸';
            case 'first_french_kiss': return 'When deeper sparks flew 💋';
            case 'first_hug': return 'When you held her close 🤗';
            case 'first_sex': return 'The night of passion 🔥';
            case 'first_oral': return 'That intimate moment 👅';
            case 'first_time_together': return 'When you stayed over 🌙';
            default: return 'When did it happen?';
        }
    };

    const getPartnerDateLabel = () => {
        switch (id) {
            case 'first_kiss': return 'She kissed you 😘';
            case 'first_surprise': return 'You surprised her 🎁';
            case 'first_memory': return 'Her memory date 📸';
            default: return "Partner's Date";
        }
    };

    const handleSaveClick = async () => {
        setSaving(true);
        await onSave(id, date, content);
        setSaving(false);
        onToggle();
        setHasInteracted(false);
    };

    const renderIcon = () => {
        if (!icon) return null;
        if (typeof icon === 'string') {
            return (
                <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(251,113,133,0.15)]">
                    {icon}
                </div>
            );
        }
        return (
            <div className="p-3 rounded-full bg-white/5 border border-white/10 shadow-inner">
                {icon}
            </div>
        );
    };

    return (
        <Card className={cn(
            "border-rose-900/30 transition-all duration-150 overflow-hidden shadow-none group relative",
            isOpen ? "bg-rose-950/20 ring-1 ring-rose-500/50" : "bg-black/20 hover:bg-rose-900/10",
            isCompleted && !isOpen && "border-emerald-500/30 bg-emerald-500/5"
        )}>
            {/* Background pattern for completed cards */}
            {isCompleted && (
                <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            )}

            <CardHeader
                className="cursor-pointer flex flex-row items-center gap-4 py-3 px-4 md:py-4 md:px-6"
                onClick={onToggle}
            >
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="relative flex-shrink-0"
                >
                    {renderIcon()}
                    {isCompleted && (
                        <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-0.5 border-2 border-black">
                            <Sparkles className="w-2.5 h-2.5 text-white" />
                        </div>
                    )}
                </motion.div>

                <div className="flex-1 text-left space-y-0.5">
                    <div className="flex items-center justify-start gap-2">
                        <CardTitle className="text-lg md:text-xl text-rose-100 font-serif leading-tight">
                            {label}
                        </CardTitle>
                    </div>
                    <p className="text-rose-200/40 text-sm md:text-base font-light max-w-sm italic">
                        {question}
                        {date && <span className="ml-2 not-italic text-rose-300/60 font-mono font-bold text-[10px] uppercase tracking-widest">— {format(date, "dd/MM/yyyy")}</span>}
                    </p>
                </div>

                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <div className={cn("w-1.5 h-1.5 rounded-full transition-all duration-1000",
                        isCompleted ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" :
                            myAnswer ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" :
                                "bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                    )} />
                </div>
            </CardHeader>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15, ease: "circOut" }}
                    >
                        <CardContent className="space-y-6 pt-1 px-6 pb-8">
                            {/* Creative Dual-Date Comparison for Dual Date Cards */}
                            {showDualDates && (
                                <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-6">
                                    <div className="grid md:grid-cols-2 gap-8 relative">
                                        {/* Connector line for large screens */}
                                        <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-[1px] bg-white/10" />

                                        {/* Your Side */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] uppercase tracking-widest text-rose-200/40 font-bold">{getMyDateLabel()}</label>
                                                {isSynced && <div className="text-[8px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">MATCHED</div>}
                                            </div>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="ghost" className="w-full h-14 bg-black/20 text-rose-100 hover:bg-rose-950/40 rounded-2xl border-none">
                                                        <CalendarIcon className="mr-3 h-4 w-4 text-rose-400" />
                                                        {date ? format(date, "dd/MM/yyyy") : "When was it for you?"}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0 bg-rose-950 border-rose-800 rounded-3xl overflow-hidden shadow-2xl" align="start">
                                                    <Calendar mode="single" selected={date} onSelect={(d) => { setDate(d); setHasInteracted(true); }} disabled={(d) => d > new Date()} className="text-white" />
                                                </PopoverContent>
                                            </Popover>
                                        </div>

                                        {/* Partner Side */}
                                        <div className="space-y-3">
                                            <label className="text-[10px] uppercase tracking-widest text-rose-200/40 font-bold">{getPartnerDateLabel()}</label>
                                            <div className={cn(
                                                "w-full h-14 flex items-center gap-4 px-4 rounded-2xl transition-all duration-700",
                                                partnerDate ? "bg-rose-900/10 text-rose-100" : "bg-black/10 border-dashed border-white/5 text-white/20"
                                            )}>
                                                <CalendarIcon className={cn("h-4 w-4", partnerDate ? "text-rose-400" : "text-white/10")} />
                                                <span className="text-sm">
                                                    {partnerDate ? format(partnerDate, "dd/MM/yyyy") : "Awaiting partner's memory..."}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {date && partnerDate && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="pt-4 border-t border-white/5 flex flex-col items-center gap-2"
                                        >
                                            <div className="flex items-center gap-3">
                                                <History className="w-4 h-4 text-rose-400/50" />
                                                <p className="text-xs text-rose-200/40">
                                                    {isSynced ? "Your memories are perfectly in sync!" : `There's a ${dateDiff} day difference in how you remember this.`}
                                                </p>
                                            </div>
                                            {isSynced && (
                                                <div className="flex gap-1">
                                                    {[1, 2, 3].map(i => <motion.span key={i} animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, delay: i * 0.2 }} className="text-emerald-400 text-xs">✦</motion.span>)}
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </div>
                            )}

                            {/* Standard Date Input for Non-Dual Cards */}
                            {!showDualDates && (
                                <div className="space-y-3">
                                    <label className="text-[10px] uppercase tracking-widest text-rose-200/40 font-bold">{getMyDateLabel()}</label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" className="w-full h-16 bg-black/10 text-rose-100 hover:bg-rose-900/20 rounded-2xl text-lg font-serif border-none">
                                                <CalendarIcon className="mr-4 h-5 w-5 text-rose-500" />
                                                {date ? format(date, "dd/MM/yyyy") : "Pick the date"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 bg-rose-950 border-rose-800 rounded-2xl shadow-2xl" align="center">
                                            <Calendar mode="single" selected={date} onSelect={(d) => { setDate(d); setHasInteracted(true); }} disabled={(d) => d > new Date()} className="text-white" />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            )}

                            {/* Perspectives Section */}
                            <div className="grid md:grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] uppercase tracking-widest text-rose-200/40 font-bold">Your Story</label>
                                        <div className="w-5 h-[1px] bg-rose-500/20" />
                                    </div>
                                    <Textarea
                                        value={content}
                                        onChange={(e) => { setContent(e.target.value); setHasInteracted(true); }}
                                        placeholder="How do you remember it..."
                                        className="text-rose-100 min-h-[160px] bg-black/10 border-rose-500/10 rounded-2xl p-6 focus:ring-rose-500/50 resize-none leading-relaxed"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] uppercase tracking-widest text-rose-200/40 font-bold">Partner's Story</label>
                                        <div className="w-5 h-[1px] bg-rose-500/20" />
                                    </div>
                                    <div className={cn(
                                        "p-4 rounded-2xl border min-h-[160px] relative overflow-hidden flex items-center transition-all duration-1000",
                                        partnerAnswer ? "bg-rose-900/5 border-rose-500/10 text-rose-100/80 italic leading-relaxed" : "bg-black/10 border-white/5 border-dashed justify-center"
                                    )}>
                                        {partnerAnswer ? (
                                            <>
                                                <div className="absolute top-2 left-3 text-5xl text-rose-500/40 font-serif select-none">"</div>
                                                <p className="relative z-10 px-4 py-2">{partnerAnswer}</p>
                                                <div className="absolute bottom-2 right-3 text-5xl text-rose-500/40 font-serif translate-y-2 select-none">"</div>
                                            </>
                                        ) : (
                                            <div className="text-center space-y-2">
                                                <Unlock className="w-6 h-6 text-white/10 mx-auto" />
                                                <span className="text-rose-200/20 text-xs block">Waiting for partner's whisper...</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={handleSaveClick}
                                disabled={saving}
                                className="w-full h-14 btn-rosy rounded-2xl text-base tracking-[0.2em] font-bold shadow-lg shadow-rose-900/20"
                            >
                                {saving ? "Saving..." : "Save Memory"}
                            </Button>
                        </CardContent>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
}
