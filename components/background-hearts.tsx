'use client'

import { useEffect, useState } from 'react'

interface Heart {
    id: number
    left: string
    size: string
    duration: string
    delay: string
    color: string
}

export default function BackgroundHearts() {
    const [hearts, setHearts] = useState<Heart[]>([])

    useEffect(() => {
        const colors = ['bg-heart-red', 'bg-heart-pink', 'bg-heart-colorful']
        const newHearts = Array.from({ length: 15 }).map((_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            size: `${Math.random() * 20 + 10}px`,
            duration: `${Math.random() * 15 + 10}s`,
            delay: `${Math.random() * 10}s`,
            color: colors[Math.floor(Math.random() * colors.length)],
        }))
        setHearts(newHearts)
    }, [])

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            {hearts.map((heart) => (
                <div
                    key={heart.id}
                    className={`absolute bottom-[-50px] rounded-full opacity-60 ${heart.color}`}
                    style={{
                        left: heart.left,
                        width: heart.size,
                        height: heart.size,
                        animation: `heart-float ${heart.duration} linear infinite ${heart.delay}`,
                        clipPath: 'path("M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z")',
                    }}
                />
            ))}
        </div>
    )
}
