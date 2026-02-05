"use client";

import React, { useState, useEffect } from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

interface LibidoSliderProps {
    defaultValue: string;
    onValueChange: (value: string) => void;
}

const levels = ["low", "medium", "high", "very_high"];

export function LibidoSlider({ defaultValue, onValueChange }: LibidoSliderProps) {
    const [value, setValue] = useState([levels.indexOf(defaultValue)]);

    // Map slider index (0-3) to level string
    const getLevel = (index: number) => levels[index] || "medium";

    // Handle slide end commit
    const handleCommit = (vals: number[]) => {
        const newLevel = getLevel(vals[0]);
        onValueChange(newLevel);
    };

    const currentLevel = getLevel(value[0]);

    return (
        <div className="w-full space-y-4 pt-2 pb-2">
            <div className="flex justify-between items-end px-1">
                <span className="text-[10px] uppercase font-bold text-white/40 tracking-widest">Intensity</span>
                <span className={cn(
                    "text-xs font-black uppercase tracking-widest transition-colors",
                    currentLevel === 'low' ? "text-green-500" :
                        currentLevel === 'medium' ? "text-yellow-500" :
                            currentLevel === 'high' ? "text-orange-500" :
                                "text-red-500"
                )}>
                    {currentLevel.replace('_', ' ')}
                </span>
            </div>

            <SliderPrimitive.Root
                defaultValue={[levels.indexOf(defaultValue)]}
                max={3}
                step={1}
                className="relative flex w-full touch-none select-none items-center"
                onValueChange={(vals) => setValue(vals)}
                onValueCommit={handleCommit}
            >
                <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-white/5">
                    <SliderPrimitive.Range className={cn(
                        "absolute h-full transition-colors duration-300",
                        currentLevel === 'low' ? "bg-green-500" :
                            currentLevel === 'medium' ? "bg-gradient-to-r from-green-500 to-yellow-500" :
                                currentLevel === 'high' ? "bg-gradient-to-r from-green-500 via-yellow-500 to-orange-500" :
                                    "bg-gradient-to-r from-green-500 via-orange-500 to-red-500"
                    )} />
                </SliderPrimitive.Track>
                <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-white/50 bg-zinc-200 shadow-lg ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:scale-110 cursor-grab active:cursor-grabbing" />
            </SliderPrimitive.Root>
        </div>
    );
}
