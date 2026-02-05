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
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{
                duration: 0.4, // Faster animation
                delay: delay,
                ease: "easeOut"
            }}
            className={className}
            style={{ willChange: 'opacity, transform' }}
        >
            {children}
        </motion.div>
    )
}
