'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Heart, MapPin, Sparkles, Flame } from "lucide-react"
import { format } from "date-fns"
import Image from "next/image"
import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MemoryDetailDialog } from "./memory-detail-dialog"

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

// Map category slugs to readable titles and styles
const CATEGORY_CONFIG: Record<string, { label: string, emoji: string, color: string, gradient: string, text: string }> = {
    first_talk: {
        label: "First Talk",
        emoji: "💬",
        color: "text-blue-300",
        gradient: "from-blue-900/40 to-black/60",
        text: "The moment words started our story"
    },
    first_hug: {
        label: "First Hug",
        emoji: "🫂",
        color: "text-amber-300",
        gradient: "from-amber-900/40 to-black/60",
        text: "The warmth that felt like home"
    },
    first_kiss: {
        label: "First Kiss",
        emoji: "😘",
        color: "text-rose-400",
        gradient: "from-rose-900/40 to-black/60",
        text: "A spark that set souls on fire"
    },
    first_french_kiss: {
        label: "First French Kiss",
        emoji: "💋",
        color: "text-red-400",
        gradient: "from-red-900/40 to-black/60",
        text: "Passion ignited, drifting away"
    },
    first_sex: {
        label: "First Intimacy",
        emoji: "💞",
        color: "text-purple-400",
        gradient: "from-purple-900/40 to-black/60",
        text: "Two bodies, one soul, infinite love"
    },
    first_oral: {
        label: "Deep Intimacy",
        emoji: "🌊",
        color: "text-indigo-400",
        gradient: "from-indigo-900/40 to-black/60",
        text: "Exploring the depths of desire"
    },
    first_time_together: {
        label: "First Night Together",
        emoji: "🌙",
        color: "text-slate-300",
        gradient: "from-slate-900/40 to-black/60",
        text: "Waking up next to you was a dream"
    },
    first_surprise: {
        label: "First Surprise",
        emoji: "🎁",
        color: "text-emerald-300",
        gradient: "from-emerald-900/40 to-black/60",
        text: "Unexpected joy, forever cherished"
    },
    first_memory: {
        label: "First Memory",
        emoji: "✨",
        color: "text-yellow-200",
        gradient: "from-yellow-900/40 to-black/60",
        text: "where it all began..."
    },
    first_confession: {
        label: "First Confession",
        emoji: "💌",
        color: "text-pink-300",
        gradient: "from-pink-900/40 to-black/60",
        text: "Truth spoken from the heart"
    },
    first_promise: {
        label: "First Promise",
        emoji: "🤞",
        color: "text-cyan-300",
        gradient: "from-cyan-900/40 to-black/60",
        text: "A vow kep, a bond strengthened"
    },
    first_night_together: {
        label: "First Night Apart",
        emoji: "🛌",
        color: "text-gray-400",
        gradient: "from-gray-900/40 to-black/60",
        text: "Missing you was the only feeling"
    },
    first_time_alone: {
        label: "First Time Alone",
        emoji: "🤫",
        color: "text-violet-300",
        gradient: "from-violet-900/40 to-black/60",
        text: "Just us, against the world"
    },
    first_movie_date: {
        label: "First Movie Date",
        emoji: "🎬",
        color: "text-orange-300",
        gradient: "from-orange-900/40 to-black/60",
        text: "Cinema lights and holding hands"
    },
    first_intimate_moment: {
        label: "First Intimate Moment",
        emoji: "🌹",
        color: "text-rose-300",
        gradient: "from-rose-950/40 to-black/60",
        text: "Closer than ever before"
    }
}

export function OnThisDay({ memories, milestones, partnerName = "Partner" }: { memories: any[], milestones: any[], partnerName?: string }) {
    // Combine and normalize items
    const normalizedMemories = memories.map(m => ({ ...m, type: 'memory' as const }))
    const normalizedMilestones = milestones.map(m => ({ ...m, type: 'milestone' as const }))

    // Sort by type? Or random? Mixing them is fine.
    const items = [...normalizedMilestones, ...normalizedMemories]

    const [currentIndex, setCurrentIndex] = useState(0)
    const [direction, setDirection] = useState(0)
    const [selectedMemory, setSelectedMemory] = useState<any | null>(null)
    const [isDetailOpen, setIsDetailOpen] = useState(false)

    // Handle empty items with specialized view
    if (items.length === 0) return null;

    const currentItem = items[currentIndex]
    // Get config for milestones, or default
    const config = currentItem.type === 'milestone' ? (CATEGORY_CONFIG[currentItem.category] || {
        label: "Special Moment",
        emoji: "💖",
        color: "text-rose-300",
        gradient: "from-rose-900/40 to-black/60",
        text: "A beautiful memory in our journey"
    }) : null

    const nextItem = () => {
        setDirection(1)
        setCurrentIndex(prev => (prev === items.length - 1 ? 0 : prev + 1))
    }
    const prevItem = () => {
        setDirection(-1)
        setCurrentIndex(prev => (prev === 0 ? items.length - 1 : prev - 1))
    }

    const handleItemClick = useCallback(() => {
        if (currentItem.type === 'memory') {
            setSelectedMemory(currentItem)
            setIsDetailOpen(true)
        }
    }, [currentItem])

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 300 : -300,
            opacity: 0,
            scale: 0.9
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1,
            transition: {
                x: { type: "spring" as const, stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
            }
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 300 : -300,
            opacity: 0,
            scale: 0.9,
            transition: { duration: 0.2 }
        })
    }

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
            <CardContent className="space-y-4 p-0 h-[300px] flex flex-col relative overflow-hidden">
                <AnimatePresence initial={false} custom={direction}>
                    <motion.div
                        key={currentItem.id}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(e, { offset, velocity }) => {
                            const swipe = offset.x
                            if (swipe < -50) nextItem()
                            else if (swipe > 50) prevItem()
                        }}
                        className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing"
                    >
                        {currentItem.type === 'memory' ? (
                            // MEMORY CARD VIEW
                            <div
                                className="w-full h-full relative cursor-pointer group/item pointer-events-auto"
                                onClick={handleItemClick}
                            >
                                <Image
                                    src={currentItem.image_urls[0] || "/placeholder.svg"}
                                    alt={currentItem.title}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    className="object-cover transition-transform duration-700 group-hover/item:scale-110"
                                    draggable={false}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover/item:from-black/90 transition-all" />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity">
                                    <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest">
                                        View Story
                                    </div>
                                </div>
                                <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
                                    <h3 className="text-lg font-bold text-white leading-tight drop-shadow-md">{currentItem.title}</h3>
                                    <div className="flex items-center gap-3 mt-1 text-[10px] uppercase tracking-[0.2em] font-bold text-white/60">
                                        <span>{currentItem.memory_date ? format(new Date(currentItem.memory_date + "T12:00:00"), "yyyy") : ""}</span>
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
                            <div className={`w-full h-full relative flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br ${config?.gradient}`}>
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />

                                <div className="relative z-10 space-y-4 select-none">
                                    <div className={`w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto border border-white/10 shadow-lg backdrop-blur-sm ${config?.color} text-3xl`}>
                                        {config?.emoji}
                                    </div>

                                    <div className="space-y-1">
                                        <h3 className={`text-2xl md:text-3xl font-serif font-bold text-white leading-tight ${config?.color} drop-shadow-sm`}>
                                            {config?.label}
                                        </h3>
                                        <p className="text-white/60 text-sm font-medium uppercase tracking-widest">
                                            {config?.text}
                                        </p>
                                        {/* Personalized date context for dual-date milestones */}
                                        {currentItem.isOwnDate !== undefined && (
                                            <p className="text-xs text-amber-200/80 font-medium mt-2">
                                                {currentItem.category === 'first_kiss' && (
                                                    currentItem.isOwnDate ? `You kissed ${partnerName}` : `${partnerName} kissed you`
                                                )}
                                                {currentItem.category === 'first_surprise' && (
                                                    currentItem.isOwnDate ? "You received this surprise" : `You surprised ${partnerName}`
                                                )}
                                                {currentItem.category === 'first_memory' && (
                                                    currentItem.isOwnDate ? "✨ Your special memory" : `✨ ${partnerName}'s special memory`
                                                )}
                                            </p>
                                        )}
                                    </div>

                                    <div className="pt-4 flex flex-col items-center gap-2">
                                        <span className="px-4 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-amber-200">
                                            {format(new Date(currentItem.milestone_date + "T12:00:00"), "MMMM do, yyyy")}
                                        </span>
                                    </div>

                                    <div className="pointer-events-auto">
                                        <LinkButton href="/dashboard/intimacy" label="Relive This Memory" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {items.length > 1 && (
                    <>
                        <div className="absolute top-1/2 left-2 -translate-y-1/2 z-20">
                            <button
                                onClick={prevItem}
                                className="w-8 h-8 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white/30 hover:text-white hover:bg-black/40 transition-all cursor-pointer border border-white/5"
                            >
                                <Heart className="h-4 w-4 -rotate-90" />
                            </button>
                        </div>
                        <div className="absolute top-1/2 right-2 -translate-y-1/2 z-20">
                            <button
                                onClick={nextItem}
                                className="w-8 h-8 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white/30 hover:text-white hover:bg-black/40 transition-all cursor-pointer border border-white/5"
                            >
                                <Heart className="h-4 w-4 rotate-90" />
                            </button>
                        </div>
                    </>
                )}
            </CardContent>

            <MemoryDetailDialog
                isOpen={isDetailOpen}
                memory={selectedMemory}
                onClose={() => setIsDetailOpen(false)}
            />
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
