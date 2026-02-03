'use client'

import React, { useEffect, useState } from 'react'

export function FloatingHearts() {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const [heartConfig, setHeartConfig] = useState<{
        id: number;
        left: string;
        size: number;
        shade: string;
        delay: number;
        duration: number;
    }[]>([]);

    useEffect(() => {
        setMounted(true)
        const shades = [
            '#f9a8d4', // pink-300
            '#f472b6', // pink-400
            '#ec4899', // pink-500
            '#db2777', // pink-600
            '#fda4af', // rose-300
            '#fb7185', // rose-400
            '#f43f5e', // rose-500
        ]

        // Create 8 hearts with completely random starting values
        const newHearts = Array.from({ length: 8 }).map((_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            size: 8 + Math.random() * 12,
            shade: shades[Math.floor(Math.random() * shades.length)],
            delay: Math.random() * 20,
            duration: 18 + Math.random() * 10,
        }))
        setHeartConfig(newHearts)
    }, [])

    if (!mounted) return null

    return (
        <div className="pointer-events-none fixed inset-0 z-[5] overflow-hidden">
            {heartConfig.map((heart) => (
                <div
                    key={heart.id}
                    className="absolute animate-heartFloat"
                    style={{
                        left: heart.left,
                        width: `${heart.size}px`,
                        height: `${heart.size}px`,
                        color: heart.shade,
                        opacity: 0.2,
                        animationDelay: `${heart.delay}s`,
                        animationDuration: `${heart.duration}s`
                    }}
                >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full drop-shadow-[0_0_10px_rgba(244,114,182,0.3)]">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                </div>
            ))}
        </div>
    )
}
