'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Heart, MapPin, Sparkles, Flame } from "lucide-react"
import { format } from "date-fns"
import Image from "next/image"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface Memory {
    id: string
    type: 'memory'
    title: string
    description: string
    image_urls: string[]
    location: string | null
    memory_date: string
}

interface Milestone {
    id: string
    type: 'milestone'
    category: string
    milestone_date: string
    content_user1: string | null
    content_user2: string | null
}

// Map category slugs to readable titles
const CATEGORY_LABELS: Record<string, string> = {
    first_talk: "First Talk",
    first_hug: "First Hug",
    first_kiss: "First Kiss 💋",
    first_french_kiss: "First French Kiss",
    first_sex: "First Sex",
    first_oral: "First Oral Sex",
    first_time_together: "First Night Together",
    first_surprise: "First Surprise",
    first_memory: "First Memory",
    first_confession: "First Confession",
    first_promise: "First Promise",
    first_night_together: "First Night Apart",
    first_time_alone: "First Time Alone",
    first_movie_date: "First Movie Date",
    first_intimate_moment: "First Intimate Moment"
}

export function OnThisDay({ memories, milestones }: { memories: any[], milestones: any[] }) {
    // Combine and normalize items
    const normalizedMemories = memories.map(m => ({ ...m, type: 'memory' as const }))
    const normalizedMilestones = milestones.map(m => ({ ...m, type: 'milestone' as const }))

    // Sort by type? Or random? Mixing them is fine.
    const items = [...normalizedMilestones, ...normalizedMemories]

    const [currentIndex, setCurrentIndex] = useState(0)

    if (items.length === 0) return null

    const currentItem = items[currentIndex]

    const nextItem = () => setCurrentIndex(prev => (prev === items.length - 1 ? 0 : prev + 1))
    const prevItem = () => setCurrentIndex(prev => (prev === 0 ? items.length - 1 : prev - 1))

    return (
        <Card className="glass-card overflow-hidden border-primary/10 h-full group relative">
            <CardHeader className="pb-2 relative z-10">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-serif text-white flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-amber-200" />
                        On This Day
                    </CardTitle>
                    <div className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] uppercase tracking-widest text-primary font-bold">
                        {currentIndex + 1} / {items.length}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 p-0 h-[300px] flex flex-col">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentItem.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="w-full h-full relative"
                    >
                        {currentItem.type === 'memory' ? (
                            // MEMORY CARD VIEW
                            <div className="w-full h-full relative">
                                <Image
                                    src={currentItem.image_urls[0] || "/placeholder.svg"}
                                    alt={currentItem.title}
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                <div className="absolute bottom-4 left-4 right-4">
                                    <h3 className="text-lg font-bold text-white leading-tight drop-shadow-md">{currentItem.title}</h3>
                                    <div className="flex items-center gap-3 mt-1 text-[10px] uppercase tracking-[0.2em] font-bold text-white/60">
                                        <span>{format(new Date(currentItem.memory_date), "yyyy")}</span>
                                        {currentItem.location && (
                                            <span className="flex items-center gap-1">
                                                <MapPin className="h-3 w-3" />
                                                {currentItem.location}
                                            </span>
                                        )}
                                    </div>
                                    {currentItem.description && (
                                        <p className="text-xs text-white/80 mt-2 line-clamp-2 italic">
                                            "{currentItem.description}"
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            // MILESTONE CARD VIEW
                            <div className="w-full h-full relative flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-rose-900/40 to-black/60">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />

                                <div className="relative z-10 space-y-4">
                                    <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center mx-auto border border-rose-500/30 shadow-lg shadow-rose-900/50">
                                        <Flame className="w-8 h-8 text-rose-400 animate-pulse" />
                                    </div>

                                    <div className="space-y-1">
                                        <h3 className="text-2xl md:text-3xl font-serif font-bold text-white text-glow-rose leading-tight">
                                            {CATEGORY_LABELS[currentItem.category] || "Special Moment"}
                                        </h3>
                                        <p className="text-rose-200/60 text-sm font-medium uppercase tracking-widest">
                                            Everything Started Here
                                        </p>
                                    </div>

                                    <div className="pt-4 flex flex-col items-center gap-2">
                                        <span className="px-4 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-amber-200">
                                            {format(new Date(currentItem.milestone_date), "MMMM do, yyyy")}
                                        </span>
                                    </div>

                                    <LinkButton href="/dashboard/intimacy" label="Relive This Memory" />
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {items.length > 1 && (
                    <div className="absolute top-1/2 -translate-y-1/2 flex justify-between w-full px-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                        <button
                            onClick={prevItem}
                            className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-white pointer-events-auto cursor-pointer border border-white/10"
                        >
                            <Heart className="h-4 w-4 -rotate-180" />
                        </button>
                        <button
                            onClick={nextItem}
                            className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-white pointer-events-auto cursor-pointer border border-white/10"
                        >
                            <Heart className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function LinkButton({ href, label }: { href: string, label: string }) {
    // Simple wrapper to avoid import cycles or hydration issues if using Next/Link inside motion sometimes
    return (
        <a href={href} className="inline-flex items-center gap-2 text-xs font-bold text-white/50 hover:text-white transition-colors mt-2">
            <Sparkles className="w-3 h-3" />
            {label}
        </a>
    )
}
