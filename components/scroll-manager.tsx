'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

// Global map to store scroll positions across route changes
const scrollPositions = new Map<string, number>()

export function ScrollManager() {
    const pathname = usePathname()

    useEffect(() => {
        // 1. Disable browser's default scroll restoration to prevent conflicts
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual'
        }

        // 2. Restore saved position for this page, or reset to top
        // We use the pathname as the key. 
        // If we haven't visited this page before (or in this session), it defaults to undefined -> 0.
        const savedPosition = scrollPositions.get(pathname) || 0

        // Small timeout ensures the DOM has rendered the new route's content slightly
        // before we try to scroll, reducing the chance of scrolling on an empty body.
        const timeoutId = setTimeout(() => {
            window.scrollTo({
                top: savedPosition,
                behavior: 'instant' // Instant jump to prevent visual disorientation
            })
        }, 10)

        // 3. Save scroll position continuously
        const handleScroll = () => {
            scrollPositions.set(pathname, window.scrollY)
        }

        // We use passive: true for better scrolling performance
        window.addEventListener('scroll', handleScroll, { passive: true })

        return () => {
            window.removeEventListener('scroll', handleScroll)
            clearTimeout(timeoutId)
        }
    }, [pathname])

    return null
}
