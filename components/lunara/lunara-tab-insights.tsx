'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getDailyInsights } from '@/lib/actions/insights'
import { Loader2, AlertCircle, Maximize2, X, RefreshCcw } from 'lucide-react'
import { ScrollReveal } from '@/components/scroll-reveal'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"


interface Insight {
    category: string
    title: string
    content: string
    image_url: string
    source: string // Added source
}

// Helper component for responsive images
const ResponsiveImage = ({ src, alt, fill, className }: { src: string, alt: string, fill?: boolean, className?: string }) => {
    // Check if src is one of our special IDs "1", "2", "3", "4"
    const isSpecialId = ["1", "2", "3", "4"].includes(src)

    if (isSpecialId) {
        return (
            <>
                {/* Mobile Image */}
                <div className={cn("md:hidden absolute inset-0", className)}>
                    <Image
                        src={`/images/${src}-m.jpg`}
                        alt={alt}
                        fill={fill}
                        className="object-cover"
                    />
                </div>
                {/* Desktop Image */}
                <div className={cn("hidden md:block absolute inset-0", className)}>
                    <Image
                        src={`/images/${src}.jpg`}
                        alt={alt}
                        fill={fill}
                        className="object-cover"
                    />
                </div>
            </>
        )
    }

    return (
        <Image
            src={src}
            alt={alt}
            fill={fill}
            className={className}
        />
    )
}

export function LunaraTabInsights({ coupleId }: { coupleId: string }) {
    const [insights, setInsights] = useState<Insight[]>([])
    const [loading, setLoading] = useState(true)
    const [syncing, setSyncing] = useState(false)
    const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null)

    const fetchInsights = async (force: boolean = false) => {
        try {
            const result = await getDailyInsights(coupleId, force)
            if (result.success && result.data) {
                setInsights(result.data as Insight[])
            }
        } catch (error) {
            console.error("Failed to fetch insights", error)
        } finally {
            setLoading(false)
            setSyncing(false)
        }
    }

    useEffect(() => {
        if (!coupleId) return
        fetchInsights(false)
    }, [coupleId])

    const handleManualSync = () => {
        setSyncing(true)
        fetchInsights(true) // Force refresh
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                <p className="text-purple-200/40 uppercase tracking-widest text-[10px] font-bold">Curating insights...</p>
            </div>
        )
    }

    if (insights.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[300px] glass-card border-dashed border-white/10">
                <AlertCircle className="w-8 h-8 text-white/20 mb-4" />
                <p className="text-white/40">No insights available for today.</p>
            </div>
        )
    }

    const categories = [
        { id: "Just For You", label: "Just For You" },
        { id: "Sex Tips", label: "Sex" },
        { id: "Reproductive Health", label: "Your late period" },
        { id: "Orgasm & Pleasure", label: "Orgasms and pleasure" },
        { id: "Latest News", label: "Latest News" },
        { id: "Common Worries", label: "Common Worries" },
        { id: "Safe Sex", label: "Safe Sex" },
        { id: "Let's Talk", label: "Talking About Sex" },
    ]

    return (
        <div className="space-y-8 pb-24">
            <div className="flex items-center justify-between px-2">
                <h2 className="text-sm font-bold text-white/40 uppercase tracking-[0.2em]">Daily Discovery</h2>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleManualSync}
                    disabled={syncing}
                    className="text-purple-300 hover:text-white hover:bg-purple-500/10 transition-all gap-2 h-8 px-3 rounded-full border border-purple-500/20"
                >
                    <RefreshCcw className={cn("w-3.5 h-3.5", syncing && "animate-spin")} />
                    <span className="hidden md:inline text-[10px] uppercase font-black tracking-widest">{syncing ? "Syncing..." : "Refresh"}</span>
                </Button>
            </div>
            {categories.map((cat, catIdx) => {
                const categoryItems = insights.filter(i => i.category === cat.id)
                if (categoryItems.length === 0) return null

                return (
                    <div key={cat.id} className="space-y-4">
                        <ScrollReveal delay={catIdx * 0.1}>
                            <h3 className="text-xl font-bold text-white px-2">{cat.label}</h3>
                        </ScrollReveal>

                        {/* Horizontal Scroll Container */}
                        <div className="flex overflow-x-auto gap-4 pb-4 px-2 snap-x snap-mandatory scrollbar-hide -mx-4 md:mx-0 md:px-0 px-6">
                            {categoryItems.map((insight, idx) => (
                                <motion.div
                                    key={`${cat.id}-${idx}`}
                                    className="min-w-[280px] w-[280px] h-[320px] relative rounded-2xl overflow-hidden snap-center cursor-pointer group flex-shrink-0 bg-white/5 border border-white/5"
                                    onClick={() => setSelectedInsight(insight)}
                                    whileHover={{ scale: 0.98 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <ResponsiveImage
                                        src={insight.image_url}
                                        alt={insight.title}
                                        fill
                                        className="object-cover"
                                    />
                                    {/* Overlay Gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                                    {/* Source Badge */}
                                    <div className="absolute top-4 left-4">
                                        <span className="px-2 py-1 rounded-md bg-black/40 backdrop-blur-md text-[8px] uppercase font-bold tracking-widest text-white/60">
                                            {insight.source}
                                        </span>
                                    </div>

                                    {/* Text Content */}
                                    <div className="absolute bottom-0 left-0 w-full p-5">
                                        <p className="text-lg font-bold text-white leading-tight drop-shadow-md">
                                            {insight.title}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )
            })}

            {/* Reading Drawer */}
            <Drawer open={!!selectedInsight} onOpenChange={(open) => !open && setSelectedInsight(null)}>
                <DrawerContent className="bg-zinc-950 border-white/10 text-white h-[85vh]">
                    <div className="relative h-full overflow-y-auto">
                        {/* Close Button Mobile */}
                        <div className="absolute top-4 right-4 z-50">
                            <DrawerClose asChild>
                                <Button size="icon" variant="ghost" className="rounded-full bg-black/40 text-white hover:bg-black/60">
                                    <X className="w-5 h-5" />
                                </Button>
                            </DrawerClose>
                        </div>

                        {selectedInsight && (
                            <>
                                <div className="relative h-64 w-full shrink-0">
                                    <ResponsiveImage
                                        src={selectedInsight.image_url}
                                        alt={selectedInsight.title}
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />
                                    <div className="absolute bottom-6 left-6 right-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2 py-1 rounded-md bg-white/10 backdrop-blur-md text-[10px] uppercase font-bold tracking-widest text-purple-200">
                                                {selectedInsight.category}
                                            </span>
                                            <span className="px-2 py-1 rounded-md bg-white/5 backdrop-blur-md text-[10px] uppercase font-bold tracking-widest text-white/40">
                                                Source: {selectedInsight.source}
                                            </span>
                                        </div>
                                        <DrawerTitle className="text-3xl font-serif font-bold leading-tight">
                                            {selectedInsight.title}
                                        </DrawerTitle>
                                    </div>
                                </div>
                                <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
                                    <DrawerDescription className="text-lg text-zinc-300 leading-relaxed font-light">
                                        {selectedInsight.content}
                                    </DrawerDescription>

                                    <div className="p-4 rounded-xl bg-purple-900/10 border border-purple-500/10">
                                        <h4 className="text-sm font-bold text-purple-300 mb-2 flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4" />
                                            Did you know?
                                        </h4>
                                        <p className="text-xs text-purple-200/60">
                                            Regularly engaging with content about intimacy can increase communication satisfaction by 40% in couples.
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </DrawerContent>
            </Drawer>
        </div>
    )
}
