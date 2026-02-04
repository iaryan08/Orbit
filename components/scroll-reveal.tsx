'use client'

import { ReactNode, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface ScrollRevealProps {
    children: ReactNode
    delay?: number
    className?: string
    once?: boolean
}

export function ScrollReveal({
    children,
    delay = 0,
    className = "",
    once = true
}: ScrollRevealProps) {
    const [isVisible, setIsVisible] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true)
                    if (once && ref.current) observer.unobserve(ref.current)
                }
            },
            { threshold: 0.1 }
        )

        if (ref.current) observer.observe(ref.current)

        return () => {
            if (ref.current) observer.unobserve(ref.current)
        }
    }, [once])

    return (
        <div
            ref={ref}
            className={cn(
                "transition-all duration-700",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
                className
            )}
            style={{
                transitionDelay: `${delay}s`,
                transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' // Smooth easing
            }}
        >
            {children}
        </div>
    )
}
