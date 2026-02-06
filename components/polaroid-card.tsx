"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { Camera, Download, Share2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PolaroidCardProps {
    imageUrl: string;
    caption?: string;
    createdAt: string;
    onDelete?: () => void;
    isDeveloping?: boolean;
}

export function PolaroidCard({ imageUrl, caption, createdAt, onDelete, isDeveloping = false }: PolaroidCardProps) {
    const [developed, setDeveloped] = useState(!isDeveloping);

    useEffect(() => {
        if (isDeveloping) {
            const timer = setTimeout(() => setDeveloped(true), 1500); // Quick initial fade
            return () => clearTimeout(timer);
        }
    }, [isDeveloping]);

    return (
        <div className="relative group perspective-1000">
            {/* Polaroid Frame */}
            <div
                className={`bg-white p-3 pb-10 shadow-2xl transition-all duration-[60000ms] ease-out 
          ${developed ? 'rotate-[-1deg] translate-y-0' : 'rotate-[2deg] translate-y-4 scale-95'}
        `}
                style={{
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5), inset 0 0 10px rgba(0,0,0,0.05)'
                }}
            >
                <div className="relative aspect-square bg-[#1a1a1a] overflow-hidden rounded-sm">
                    <Image
                        src={imageUrl}
                        alt="Polaroid Memory"
                        fill
                        className={`object-cover transition-all duration-[60000ms] ease-out
              ${developed ? 'filter-none grayscale-0 opacity-100' : 'blur-xl grayscale opacity-0'}
            `}
                        style={{
                            transitionProperty: 'filter, opacity'
                        }}
                    />

                    {/* Subtle Flash Overlay */}
                    {!developed && (
                        <div className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none" />
                    )}
                </div>

                {/* Caption/Time Slot */}
                <div className="mt-4 px-1">
                    <p className="font-pinyon text-lg text-gray-800 leading-none">
                        {caption || "A moment shared..."}
                    </p>
                    <p className="text-[10px] text-gray-400 font-sans uppercase tracking-widest mt-1">
                        {formatDistanceToNow(new Date(createdAt))} ago
                    </p>
                </div>
            </div>

            {/* Action Overlay (Visible on Hover) */}
            <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                {onDelete && (
                    <Button
                        variant="destructive"
                        size="icon"
                        className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/20 hover:bg-rose-500"
                        onClick={onDelete}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}
