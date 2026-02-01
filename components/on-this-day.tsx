'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Heart, MapPin } from "lucide-react"
import { format } from "date-fns"
import Image from "next/image"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface Memory {
    id: string
    title: string
    description: string
    image_urls: string[]
    location: string | null
    memory_date: string
}

export function OnThisDay({ memories }: { memories: Memory[] }) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const currentMemory = memories[currentIndex]

    if (memories.length === 0) return null

    return (
        <Card className="glass-card overflow-hidden border-primary/10 h-full group">
            <CardHeader className="pb-2 relative z-10">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-serif text-white flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-amber-200" />
                        On This Day
                    </CardTitle>
                    <div className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] uppercase tracking-widest text-primary font-bold">
                        {currentIndex + 1} / {memories.length}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
                <div className="relative aspect-[4/3] w-full bg-black/20">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentMemory.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="w-full h-full relative"
                        >
                            <Image
                                src={currentMemory.image_urls[0] || "/placeholder.svg"}
                                alt={currentMemory.title}
                                fill
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                            <div className="absolute bottom-4 left-4 right-4">
                                <h3 className="text-lg font-bold text-white leading-tight drop-shadow-md">{currentMemory.title}</h3>
                                <div className="flex items-center gap-3 mt-1 text-[10px] uppercase tracking-[0.2em] font-bold text-white/60">
                                    <span>{format(new Date(currentMemory.memory_date), "yyyy")}</span>
                                    {currentMemory.location && (
                                        <span className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {currentMemory.location}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {memories.length > 1 && (
                        <div className="absolute top-1/2 -translate-y-1/2 flex justify-between w-full px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => setCurrentIndex(prev => (prev === 0 ? memories.length - 1 : prev - 1))}
                                className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-white"
                            >
                                <Heart className="h-4 w-4 -rotate-180" />
                            </button>
                            <button
                                onClick={() => setCurrentIndex(prev => (prev === memories.length - 1 ? 0 : prev + 1))}
                                className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-white"
                            >
                                <Heart className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>

                {currentMemory.description && (
                    <div className="px-6 pb-6 pt-2">
                        <p className="text-sm text-white/70 line-clamp-3 italic leading-relaxed">
                            "{currentMemory.description}"
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
