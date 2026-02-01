'use client'

import { ReactNode } from 'react'

interface ScrollRevealProps {
    children: ReactNode
    delay?: number
    direction?: 'up' | 'down' | 'left' | 'right'
    className?: string
}

export function ScrollReveal({
    children,
    className = ""
}: ScrollRevealProps) {
    return (
        <div className={className}>
            {children}
        </div>
    )
}
