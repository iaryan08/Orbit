"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, Heart, Unlock, Sparkles } from "lucide-react";
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
    icon?: React.ReactNode;
    image?: string;
    onSave: (id: string, date: Date | undefined, content: string) => Promise<void>;
}

export function MilestoneCard({
    id,
    label,
    question,
    milestone,
    myContentField,
    partnerContentField,
    icon,
    image,
    onSave
}: MilestoneCardProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [date, setDate] = useState<Date | undefined>(
        milestone?.milestone_date ? new Date(milestone.milestone_date) : undefined
    );
    const [content, setContent] = useState(milestone?.[myContentField] || "");
    const [saving, setSaving] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);

    useEffect(() => {
        if (milestone && !hasInteracted) {
            if (milestone.milestone_date) {
                setDate(new Date(milestone.milestone_date));
            }
            if (milestone[myContentField]) {
                setContent(milestone[myContentField]);
            }
        }
    }, [milestone, myContentField, hasInteracted]);

    const myAnswer = milestone?.[myContentField];
    const partnerAnswer = milestone?.[partnerContentField];
    const isCompleted = myAnswer && partnerAnswer;

    const handleSaveClick = async () => {
        setSaving(true);
        await onSave(id, date, content);
        setSaving(false);
        setIsOpen(false);
        setHasInteracted(false); // Reset interaction after save to pick up potential partner updates or confirmed server state
    };

    return (
        <Card className={cn("border-rose-900/30 transition-all duration-500 overflow-hidden shadow-none", isOpen ? "bg-rose-950/20 ring-1 ring-rose-500/50" : "bg-black/20 hover:bg-rose-900/10")}>
            <CardHeader
                className="cursor-pointer flex flex-row items-center justify-between p-6"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="space-y-1 flex items-center gap-4">
                    {icon && <div className="p-3 rounded-2xl bg-white/5 border border-white/5">{icon}</div>}
                    <div className="space-y-1">
                        <CardTitle className="text-xl text-rose-100 font-serif flex items-center gap-2">
                            {label}
                            {isCompleted && <Heart className="w-4 h-4 text-rose-50 fill-rose-500 animate-pulse" />}
                        </CardTitle>
                        <p className="text-rose-200/50 text-sm font-light">{question}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {date && <span className="text-xs text-rose-200/40 font-mono">{format(date, "MMM yyyy")}</span>}
                    <div className={cn("w-2 h-2 rounded-full transition-colors",
                        isCompleted ? "bg-rose-500" :
                            myAnswer ? "bg-amber-400" : "bg-rose-900"
                    )} />
                </div>
            </CardHeader>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                    >
                        {image && (
                            <div className="px-6 pb-6">
                                <div className="relative h-40 w-full flex items-center justify-center">
                                    <img
                                        src={image}
                                        alt={label}
                                        className="w-full h-full object-contain mix-blend-lighten opacity-90 transition-all duration-700"
                                        style={{
                                            filter: (id === 'first_french_kiss' || id === 'first_talk' || id === 'first_time_together' || id === 'first_confession')
                                                ? 'brightness(1.1) contrast(1.1) drop-shadow(0 0 12px rgba(251,113,133,0.4))'
                                                : (image.includes('sketch') || !image.includes('icon'))
                                                    ? 'invert(1) brightness(1.5) contrast(1.2) drop-shadow(0 0 10px rgba(251,113,133,0.4))'
                                                    : 'invert(1) contrast(2) brightness(1.2)',
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                        <CardContent className="space-y-6 pt-0 px-6 pb-6">
                            {/* Date Input */}
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-widest text-rose-200/40 font-bold">When did it happen?</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal bg-black/40 border-rose-500/20 text-rose-100 hover:bg-rose-900/20",
                                                !date && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-rose-950 border-rose-800" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={(newDate) => {
                                                setDate(newDate);
                                                setHasInteracted(true);
                                            }}
                                            initialFocus
                                            className="text-white"
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* My Answer */}
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-widest text-rose-200/40 font-bold">Your Perspective</label>
                                <Textarea
                                    value={content}
                                    onChange={(e) => {
                                        setContent(e.target.value);
                                        setHasInteracted(true);
                                    }}
                                    placeholder="How do you remember it..."
                                    className="text-rose-100 min-h-[100px]"
                                />
                            </div>

                            {/* Partner's Answer (Real-time Reveal) */}
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-widest text-rose-200/40 font-bold">Partner's Perspective</label>
                                <div className={cn("p-4 rounded-md border min-h-[60px] flex items-center",
                                    partnerAnswer ? "bg-rose-900/10 border-rose-500/10 text-rose-200/80 italic" : "bg-black/20 border-white/5 border-dashed justify-center"
                                )}>
                                    {partnerAnswer ? (
                                        <p>{partnerAnswer}</p>
                                    ) : (
                                        <span className="text-rose-200/20 text-sm">Waiting for partner...</span>
                                    )}
                                </div>
                            </div>

                            <Button onClick={handleSaveClick} disabled={saving} className="w-full btn-rosy">
                                {saving ? "Saving..." : "Save Memory"}
                            </Button>
                        </CardContent>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
}
