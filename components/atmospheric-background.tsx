'use client'

import React, { useEffect, useState } from 'react'
import { isDaytime } from '@/lib/utils'

export function AtmosphericBackground() {
    const [mounted, setMounted] = useState(false)
    const [isDay, setIsDay] = useState(false)
    const [config, setConfig] = useState<any[]>([])

    useEffect(() => {
        const checkTime = () => {
            setIsDay(isDaytime())
        }

        checkTime()
        setMounted(true)

        // Update every minute, but don't re-trigger animation content too often to avoid jumps
        const interval = setInterval(checkTime, 60000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        if (!mounted) return

        const isMobile = window.innerWidth < 768

        if (isDay) {
            // Heart density logic (Day) - Balanced for atmosphere
            // Increased slightly: Mobile 20, Desktop 40
            const heartCount = isMobile ? 20 : 40
            const shades = [
                '#f9a8d4', // Light pink
                '#fbcfe8', // Very light pink
                '#f472b6', // Pink
                // Removed deep reds for a softer pastel look
            ]

            const newHearts = Array.from({ length: heartCount }).map((_, i) => ({
                id: i,
                left: `${Math.random() * 100}%`,
                size: 10 + Math.random() * 20, // Slightly varying sizes
                shade: shades[Math.floor(Math.random() * shades.length)],
                delay: Math.random() * -30,
                duration: 25 + Math.random() * 30, // Slowed down: 25-55s
                opacity: isMobile ? 0.15 : 0.12 // Very subtle ghost opacity
            }))
            setConfig(newHearts)
        } else {
            // Star density logic (Night) - Balanced
            const layers = [
                // Increased stars slightly for better night feel
                { count: isMobile ? 35 : 60, size: 1.5, opacity: 0.15, speed: 180 },
                { count: isMobile ? 25 : 45, size: 2.0, opacity: 0.2, speed: 240 },
                { count: isMobile ? 15 : 25, size: 2.5, opacity: 0.25, speed: 300 },
            ]

            const newStars = layers.flatMap((layer, layerIndex) =>
                Array.from({ length: layer.count }).map((_, i) => ({
                    id: `${layerIndex}-${i}`,
                    layerIndex,
                    size: layer.size,
                    opacity: layer.opacity,
                    speed: layer.speed,
                    left: `${(i * 13 + layerIndex * 17) % 100}%`, // More spacing
                    top: `${(i * 19 + layerIndex * 23) % 100}%`,
                }))
            )
            setConfig(newStars)
        }
    }, [mounted, isDay])

    if (!mounted) return null

    return (
        <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden">
            {isDay ? (
                // Daytime: Floating Hearts (Subtle & Bubble-like)
                <div className="absolute inset-0">
                    {config.map((heart) => (
                        <div
                            key={heart.id}
                            className="absolute animate-heartFloat"
                            style={{
                                left: heart.left,
                                width: `${heart.size}px`,
                                height: `${heart.size}px`,
                                color: heart.shade,
                                opacity: heart.opacity,
                                animationDelay: `${heart.delay}s`,
                                animationDuration: `${heart.duration}s`,
                                // Removed rotation for a calmer "rising bubble" effect
                            }}
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full drop-shadow-sm">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                        </div>
                    ))}
                </div>
            ) : (
                // Nighttime: Drifting Stars
                <div className="absolute inset-0">
                    {[0, 1, 2].map((layerIdx) => {
                        const layerStars = config.filter(s => s.layerIndex === layerIdx);
                        const speed = layerStars[0]?.speed || 180;
                        return (
                            <div
                                key={layerIdx}
                                className="absolute inset-0 animate-starDrift"
                                style={{ animationDuration: `${speed}s` }}
                            >
                                {layerStars.map((star) => (
                                    <span
                                        key={star.id}
                                        className="absolute rounded-full bg-white blur-[0.5px]"
                                        style={{
                                            width: star.size,
                                            height: star.size,
                                            opacity: star.opacity,
                                            left: star.left,
                                            top: star.top,
                                        }}
                                    />
                                ))}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
