'use client'

import React, { useEffect, useState } from 'react'

const layers = [
    { count: 40, size: 1.5, opacity: 0.12, speed: 120 },
    { count: 30, size: 2, opacity: 0.18, speed: 160 },
    { count: 20, size: 2.5, opacity: 0.22, speed: 200 },
]

export function Stars() {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return (
        <div className="fixed inset-0 z-[1] overflow-hidden pointer-events-none">
            {layers.map((layer, layerIndex) => (
                <div
                    key={layerIndex}
                    className="absolute inset-0 animate-starDrift"
                    style={{ animationDuration: `${layer.speed}s` }}
                >
                    {Array.from({ length: layer.count }).map((_, i) => (
                        <span
                            key={i}
                            className="absolute rounded-full bg-white blur-[0.5px]"
                            style={{
                                width: layer.size,
                                height: layer.size,
                                opacity: layer.opacity,
                                left: `${(i * 7 + layerIndex * 13) % 100}%`,
                                top: `${(i * 11 + layerIndex * 19) % 100}%`,
                            }}
                        />
                    ))}
                </div>
            ))}
        </div>
    )
}
