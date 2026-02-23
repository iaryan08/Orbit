'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Heart, MapPin, Sparkles, Flame } from "lucide-react"
import { format } from "date-fns"
import Image from "next/image"
import { useState, useCallback, useRef } from "react"
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
    confession: {
        label: "Confession",
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
        text: "A vow kept, a bond strengthened"
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
    const isDraggingRef = useRef(false)

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
        if (!isDraggingRef.current && currentItem.type === 'memory') {
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
        <Card className="glass-card overflow-hidden h-[380px] relative group border-white/5 shadow-2xl">
            {/* Sliding Layer */}
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
                    onDragStart={() => { isDraggingRef.current = true }}
                    onDragEnd={(e, { offset, velocity }) => {
                        setTimeout(() => { isDraggingRef.current = false }, 150)
                        const swipe = offset.x
                        if (swipe < -50) nextItem()
                        else if (swipe > 50) prevItem()
                    }}
                    className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
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
                            {/* Gradients to ensure text readability */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-black/60 group-hover/item:bg-black/60 transition-[background-color] duration-500" />

                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity">
                                <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest">
                                    View Story
                                </div>
                            </div>

                            <div className="absolute bottom-6 left-6 right-6 pointer-events-none">
                                <h3 className="text-xl font-bold text-white leading-tight drop-shadow-md">{currentItem.title}</h3>
                                <div className="flex items-center gap-3 mt-1.5 text-[10px] uppercase tracking-[0.2em] font-bold text-white/70">
                                    <span>{currentItem.memory_date ? format(new Date(currentItem.memory_date + "T12:00:00"), "yyyy") : ""}</span>
                                    {currentItem.location && (
                                        <span className="flex items-center gap-1 text-white/50">
                                            <MapPin className="h-3 w-3" />
                                            {currentItem.location}
                                        </span>
                                    )}
                                </div>
                                {currentItem.description && (
                                    <p className="text-xs text-white/80 mt-2.5 line-clamp-2 italic drop-shadow-sm">
                                        "{currentItem.description}"
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
                        // MILESTONE CARD VIEW
                        <div className={`w-full h-full relative flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br ${config?.gradient}`}>
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

                            <div className="relative z-10 space-y-3 select-none mt-8">
                                <div className={`w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mx-auto border border-white/10 shadow-lg backdrop-blur-sm ${config?.color} text-2xl`}>
                                    {config?.emoji}
                                </div>

                                <div className="space-y-1">
                                    <h3 className={`text-2xl md:text-3xl font-serif font-bold text-white leading-tight ${config?.color} drop-shadow-sm`}>
                                        {config?.label}
                                    </h3>
                                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">
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

                                <div className="pt-2 flex flex-col items-center gap-2">
                                    <span className="px-3 py-1 rounded-full bg-black/40 border border-white/10 text-[10px] uppercase font-bold text-amber-200/90 tracking-widest backdrop-blur-md">
                                        {format(new Date(currentItem.milestone_date + "T12:00:00"), "MMMM do, yyyy")}
                                    </span>
                                </div>

                                <div className="pointer-events-auto pt-2">
                                    <LinkButton href="/intimacy" label="Relive This Memory" />
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Static Header Layered Over Content */}
            <CardHeader className="relative z-20 pb-2 pt-5 px-5 pointer-events-none">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-serif text-white flex items-center gap-2 drop-shadow-lg">
                        <Calendar className="h-5 w-5 text-amber-200" />
                        On This Day
                    </CardTitle>
                    <div className="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[10px] uppercase tracking-widest text-white font-bold shadow-xl">
                        {currentIndex + 1} / {items.length}
                    </div>
                </div>
            </CardHeader>

            {/* Navigation Buttons Layered Over */}
            {items.length > 1 && (
                <>
                    <div className="absolute top-1/2 left-3 -translate-y-1/2 z-20">
                        <button
                            onClick={prevItem}
                            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white/50 hover:text-white hover:bg-black/60 transition-[color,background-color] cursor-pointer border border-white/10 shadow-lg"
                        >
                            <Heart className="h-4 w-4 -rotate-90" />
                        </button>
                    </div>
                    <div className="absolute top-1/2 right-3 -translate-y-1/2 z-20">
                        <button
                            onClick={nextItem}
                            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white/50 hover:text-white hover:bg-black/60 transition-[color,background-color] cursor-pointer border border-white/10 shadow-lg"
                        >
                            <Heart className="h-4 w-4 rotate-90" />
                        </button>
                    </div>
                </>
            )}
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

