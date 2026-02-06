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

        // Update every minute
        const interval = setInterval(checkTime, 60000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        if (!mounted) return

        const isMobile = window.innerWidth < 768

        if (isDay) {
            // Heart density logic (Day)
            const heartCount = isMobile ? 35 : 50 // Increased density
            const shades = [
                '#f9a8d4', '#f472b6', '#ec4899', '#db2777',
                '#fda4af', '#fb7185', '#f43f5e'
            ]

            const newHearts = Array.from({ length: heartCount }).map((_, i) => ({
                id: i,
                left: `${Math.random() * 100}%`,
                size: 8 + Math.random() * 18,
                shade: shades[Math.floor(Math.random() * shades.length)],
                delay: Math.random() * -30,
                duration: 15 + Math.random() * 20,
                opacity: isMobile ? 0.3 : 0.2
            }))
            setConfig(newHearts)
        } else {
            // Star density logic (Night)
            const layers = [
                { count: isMobile ? 50 : 80, size: 1.2, opacity: 0.15, speed: 120 },
                { count: isMobile ? 40 : 60, size: 1.8, opacity: 0.2, speed: 160 },
                { count: isMobile ? 25 : 40, size: 2.2, opacity: 0.25, speed: 200 },
            ]

            const newStars = layers.flatMap((layer, layerIndex) =>
                Array.from({ length: layer.count }).map((_, i) => ({
                    id: `${layerIndex}-${i}`,
                    layerIndex,
                    size: layer.size,
                    opacity: layer.opacity,
                    speed: layer.speed,
                    left: `${(i * 7.7 + layerIndex * 13.3) % 100}%`,
                    top: `${(i * 11.1 + layerIndex * 19.9) % 100}%`,
                }))
            )
            setConfig(newStars)
        }
    }, [mounted, isDay])

    if (!mounted) return null

    return (
        <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden">
            {isDay ? (
                // Daytime: Floating Hearts
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
                                transform: `rotate(${Math.random() * 360}deg)`
                            }}
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full drop-shadow-[0_0_10px_rgba(244,114,182,0.3)]">
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
                        const speed = layerStars[0]?.speed || 120;
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
