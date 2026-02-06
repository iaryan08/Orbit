"use client";

import { useEffect, useState } from "react";
import { isDaytime } from "@/lib/utils";

export function MoonBackdrop() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDay = isDaytime();

    // Safety check for Vercel Hydration: Don't render until client is ready
    if (!mounted || isDay) return null;

    return (
        <svg
            className="fixed inset-0 z-[1] w-full h-full opacity-[0.05] pointer-events-none transition-opacity duration-[3000ms]"
            viewBox="0 0 1000 1000"
            preserveAspectRatio="xMidYMid slice"
        >
            <title>Moon and Constellations</title>
            {/* Crescent Moon */}
            <path
                d="M600 200a180 180 0 1 0 0 360a140 180 0 1 1 0-360z"
                fill="white"
            />

            {/* Constellation lines */}
            <g stroke="white" strokeWidth="1" opacity="0.4">
                <line x1="200" y1="300" x2="260" y2="260" />
                <line x1="260" y1="260" x2="330" y2="300" />
                <line x1="330" y1="300" x2="380" y2="250" />
            </g>

            {/* Constellation stars */}
            <g fill="white">
                <circle cx="200" cy="300" r="2" />
                <circle cx="260" cy="260" r="2" />
                <circle cx="330" cy="300" r="2" />
                <circle cx="380" cy="250" r="2" />
            </g>

            {/* Zodiac arc */}
            <path
                d="M150 800 A500 500 0 0 1 850 800"
                stroke="white"
                strokeWidth="1"
                fill="none"
                opacity="0.3"
            />
        </svg>
    );
}
