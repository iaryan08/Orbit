'use client'

import { ReactNode, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

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
            {
                threshold: 0.1,
                rootMargin: "200px" // Trigger 200px before appearing
            }
        )

        if (ref.current) observer.observe(ref.current)

        return () => {
            if (ref.current) observer.unobserve(ref.current)
        }
    }, [once])

    return (
        <div className={className}>
            {children}
        </div>
    )
}
