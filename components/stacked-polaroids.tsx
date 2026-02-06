"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { Camera, Trash2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface PolaroidData {
    id: string;
    image_url: string;
    caption?: string;
    created_at: string;
}

interface StackedPolaroidsProps {
    userPolaroid: PolaroidData | null;
    partnerPolaroid: PolaroidData | null;
    partnerName: string;
    onDelete?: (id: string) => Promise<void>;
}

export function StackedPolaroids({ userPolaroid, partnerPolaroid, partnerName, onDelete }: StackedPolaroidsProps) {
    const [view, setView] = useState<"user" | "partner">("user");
    const hasAny = userPolaroid || partnerPolaroid;

    if (!hasAny) {
        return (
            <div className="flex flex-col items-center justify-center p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm group hover:bg-white/10 transition-all duration-500 h-[260px] w-[220px] mx-auto overflow-hidden">
                <div className="relative mb-3">
                    <Camera className="w-10 h-10 text-white/20 group-hover:scale-110 transition-transform duration-500" />
                    <Heart className="w-5 h-5 text-rose-500/40 absolute -bottom-1 -right-1 animate-pulse" />
                </div>
                <h3 className="text-[11px] font-bold text-white/60 uppercase tracking-widest mb-1">No Poster</h3>
                <p className="text-[9px] text-white/30 text-center max-w-[130px] italic">
                    Share a special moment.
                </p>
                <div className="mt-4 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[8px] font-black uppercase tracking-widest text-white/40">
                    Please Upload
                </div>
            </div>
        );
    }

    const items = [
        { id: "user", label: "You", data: userPolaroid, canDelete: true, emptyLabel: "Please upload" },
        { id: "partner", label: partnerName, data: partnerPolaroid, canDelete: false, emptyLabel: "Not uploaded yet" }
    ];

    const activeIndex = view === "user" ? 0 : 1;

    return (
        <div className="relative w-[230px] h-[300px] mx-auto group select-none touch-none">
            <AnimatePresence mode="popLayout">
                {items.map((item, index) => {
                    const isActive = index === activeIndex;
                    const isBelow = !isActive;

                    return (
                        <motion.div
                            key={item.id}
                            style={{ zIndex: isActive ? 20 : 10 }}
                            className="absolute inset-0 cursor-grab active:cursor-grabbing"
                            initial={false}
                            animate={{
                                x: isActive ? 0 : (index === 0 ? -15 : 15),
                                y: isActive ? 0 : 8,
                                rotate: isActive ? (index === 0 ? -1 : 1) : (index === 0 ? 4 : -4),
                                scale: isActive ? 1 : 0.94,
                                opacity: isActive ? 1 : 0.7,
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            onDragEnd={(e, { offset, velocity }) => {
                                if (offset.x > 50 || velocity.x > 500) setView("user");
                                if (offset.x < -50 || velocity.x < -500) setView("partner");
                            }}
                        >
                            <PolaroidItem
                                data={item.data}
                                label={item.label}
                                emptyLabel={item.emptyLabel}
                                developedStatus={isActive}
                                onDelete={item.canDelete && item.data ? () => onDelete?.(item.data.id) : undefined}
                            />
                        </motion.div>
                    );
                })}
            </AnimatePresence>

            {/* Pagination Dots */}
            <div className="absolute -bottom-6 left-0 right-0 flex justify-center gap-1.5">
                {items.map((item, idx) => (
                    <div
                        key={item.id}
                        className={cn(
                            "w-1.5 h-1.5 rounded-full transition-all duration-300",
                            idx === activeIndex ? "bg-rose-400 w-3" : "bg-white/20"
                        )}
                    />
                ))}
            </div>

            <div className="absolute -top-6 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[8px] font-bold text-white/40 uppercase tracking-[0.2em]">
                    Swipe to flip • {view === "partner" ? partnerName : "You"}
                </span>
            </div>
        </div>
    );
}

function PolaroidItem({ data, label, emptyLabel, onDelete, developedStatus }: { data: PolaroidData | null, label: string, emptyLabel: string, onDelete?: () => void, developedStatus: boolean }) {
    const [developed, setDeveloped] = useState(false);

    useEffect(() => {
        if (data && developedStatus) {
            const isNew = new Date().getTime() - new Date(data.created_at).getTime() < 30000;
            if (isNew) {
                const timer = setTimeout(() => setDeveloped(true), 1500);
                return () => clearTimeout(timer);
            } else {
                setDeveloped(true);
            }
        }
    }, [data, developedStatus]);

    return (
        <div className="bg-white p-2.5 pb-8 shadow-xl relative w-full h-full border border-gray-100">
            <div className="relative aspect-square bg-[#1a1a1a] overflow-hidden rounded-sm">
                {data ? (
                    <>
                        <Image
                            src={data.image_url}
                            alt="Memory"
                            fill
                            sizes="220px"
                            className={cn(
                                "object-cover transition-all duration-[2000ms] ease-out",
                                developed ? "filter-none opacity-100" : "blur-xl opacity-20 grayscale"
                            )}
                            draggable={false}
                        />
                        {onDelete && (
                            <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-30 pointer-events-auto"
                                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            >
                                <Trash2 className="w-3 h-3" />
                            </Button>
                        )}
                        <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-black/40 backdrop-blur-md rounded text-[7px] font-bold text-white/90 uppercase tracking-widest">
                            {label}
                        </div>
                    </>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100/50">
                        <Camera className="w-7 h-7 text-gray-300 mb-1.5" />
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none text-center px-2">{emptyLabel}</span>
                        <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-gray-200 rounded text-[7px] font-bold text-gray-500 uppercase tracking-widest">
                            {label}
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-2.5 px-0.5 min-h-[35px]">
                {data ? (
                    <>
                        <p className="font-pinyon text-sm text-gray-800 leading-tight line-clamp-1">
                            {data.caption || "A moment shared..."}
                        </p>
                        <p className="text-[8px] text-gray-400 font-sans uppercase tracking-widest mt-0.5">
                            {formatDistanceToNow(new Date(data.created_at))} ago
                        </p>
                    </>
                ) : (
                    <p className="font-pinyon text-sm text-gray-300 leading-tight">
                        Waiting...
                    </p>
                )}
            </div>

            {/* Subtle Texture */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />
        </div>
    );
}
