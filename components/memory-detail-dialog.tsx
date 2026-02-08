'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { format } from "date-fns"
import { Heart, Maximize2 } from "lucide-react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { FullScreenImageModal } from "./full-screen-image-modal"
import {
    getMemoryComments,
    addMemoryComment
} from "@/lib/actions/reactions-comments"
import { CommentsDisplay } from "./comments-display"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface Memory {
    id: string
    title: string
    description: string
    image_urls: string[]
    location: string | null
    memory_date: string
    user_id?: string
}

interface MemoryDetailDialogProps {
    memory: Memory | null
    isOpen: boolean
    onClose: () => void
}

interface CommentData {
    id: string
    content: string
    user_id: string
    created_at: string
    updated_at?: string
    profiles?: {
        display_name: string | null
        avatar_url: string | null
    }
}

export function MemoryDetailDialog({ memory, isOpen, onClose }: MemoryDetailDialogProps) {
    const [comments, setComments] = useState<CommentData[]>([])
    const [isLoadingComments, setIsLoadingComments] = useState(false)
    const [currentUserId, setCurrentUserId] = useState<string>('')
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [fullScreenImage, setFullScreenImage] = useState<string | null>(null)
    const [isExpanded, setIsExpanded] = useState(false)
    const { toast } = useToast()

    const supabase = createClient()

    // Get current user
    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) setCurrentUserId(user.id)
        }
        getUser()
    }, [supabase])

    // Load comments and handle real-time updates
    useEffect(() => {
        if (!memory || !isOpen) return

        const loadData = async () => {
            const commentsRes = await getMemoryComments(memory.id)
            if (commentsRes.data) {
                const formattedComments = commentsRes.data.map((comment: any) => {
                    let profile = comment.profiles
                    if (Array.isArray(profile)) profile = profile[0]
                    return {
                        ...comment,
                        profiles: profile || { display_name: 'User', avatar_url: null }
                    }
                })
                setComments(formattedComments as any)
            } else if (commentsRes.error) {
                toast({
                    title: "Could not load comments",
                    description: commentsRes.error,
                    variant: "destructive"
                })
            }
        }

        loadData()

        const commentsSub = supabase
            .channel(`memory-comments:${memory.id}`)
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'memory_comments', filter: `memory_id=eq.${memory.id}` },
                () => loadData()
            )
            .subscribe()

        return () => {
            commentsSub.unsubscribe()
        }
    }, [memory, isOpen, currentUserId, supabase, toast])

    // Reset image index when memory changes
    useEffect(() => {
        setCurrentImageIndex(0)
    }, [memory?.id])

    if (!memory) return null

    const handleAddComment = async (content: string) => {
        if (!content.trim()) return

        const optimisticId = 'temp-' + Date.now()
        const optimisticComment: CommentData = {
            id: optimisticId,
            content: content.trim(),
            user_id: currentUserId,
            created_at: new Date().toISOString(),
            profiles: {
                display_name: 'You',
                avatar_url: null
            }
        }

        setComments(prev => [...prev, optimisticComment])

        const res = await addMemoryComment(memory.id, content)
        if (res.error) {
            setComments(prev => prev.filter(c => c.id !== optimisticId))
            toast({
                title: "Failed to post comment",
                description: res.error,
                variant: "destructive"
            })
        } else {
            // Force a refresh to get server-sanctified IDs and official profiles
            const loadRes = await getMemoryComments(memory.id)
            if (loadRes.data) {
                const formatted = loadRes.data.map((c: any) => ({
                    ...c,
                    profiles: (Array.isArray(c.profiles) ? c.profiles[0] : c.profiles) || { display_name: 'User', avatar_url: null }
                }))
                setComments(formatted as any)
            }
        }
    }





    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                className="p-0 overflow-hidden border-none bg-neutral-950/80 backdrop-blur-xl sm:max-w-[400px] w-[80vw] h-auto max-h-[82vh] flex flex-col transition-all duration-500 rounded-3xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]"
            >
                <DialogTitle className="sr-only">Memory Details</DialogTitle>
                <DialogDescription className="sr-only">
                    View and comment on this shared memory.
                </DialogDescription>
                <div className="relative w-full flex flex-col group min-h-0">

                    <div className="relative h-[300px] w-full flex-shrink-0 flex items-center justify-center overflow-hidden bg-neutral-900/50">
                        <AnimatePresence initial={false}>
                            {memory.image_urls.map((url, index) => {
                                // Only show current and next image for performance/clarity
                                if (index < currentImageIndex || index > currentImageIndex + 1) return null

                                const isTop = index === currentImageIndex

                                return (
                                    <motion.div
                                        key={`${memory?.id}-${index}`}
                                        style={{
                                            zIndex: memory.image_urls.length - index,
                                            position: 'absolute'
                                        }}
                                        initial={{ scale: 0.9, opacity: 0, y: 30 }}
                                        animate={{
                                            scale: isTop ? 1 : 1,
                                            opacity: isTop ? 1 : 0,
                                            y: 0,
                                            rotate: 0
                                        }}
                                        exit={{
                                            x: isTop ? (Math.random() > 0.5 ? 500 : -500) : 0,
                                            opacity: 0,
                                            rotate: isTop ? (Math.random() > 0.5 ? 45 : -45) : 0,
                                            transition: { duration: 0.4 }
                                        }}
                                        drag={isTop ? "x" : false}
                                        dragConstraints={{ left: 0, right: 0 }}
                                        onDragEnd={(_, info) => {
                                            if (Math.abs(info.offset.x) > 100) {
                                                if (currentImageIndex < memory.image_urls.length - 1) {
                                                    setCurrentImageIndex(prev => prev + 1)
                                                } else {
                                                    setCurrentImageIndex(0)
                                                }
                                            }
                                        }}
                                        className="w-full h-full cursor-grab active:cursor-grabbing"
                                    >
                                        <div
                                            className="relative w-full h-full bg-neutral-900 overflow-hidden shadow-2xl border-b border-white/5 cursor-pointer"
                                            onClick={() => setFullScreenImage(url)}
                                        >
                                            <Image
                                                src={url || "/placeholder.svg"}
                                                alt={`${memory.title} ${index + 1}`}
                                                fill
                                                className="object-cover"
                                                draggable={false}
                                                loading="lazy"
                                            />
                                            {/* Full Screen Icon - Visible on mobile, hover on desktop */}
                                            <div className="absolute top-4 left-4 z-[60] opacity-100 sm:opacity-0 sm:group-hover:opacity-40 sm:hover:!opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setFullScreenImage(url);
                                                    }}
                                                    className="w-7 h-7 flex items-center justify-center rounded-full bg-black/40 border border-white/10 text-white/50 hover:text-white hover:bg-black/60 transition-all backdrop-blur-md"
                                                    title="View Fullscreen"
                                                >
                                                    <Maximize2 className="h-3 w-3" />
                                                </button>
                                            </div>

                                            <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-full border border-white/10 font-black uppercase tracking-[0.2em]">
                                                {index + 1} / {memory.image_urls.length}
                                            </div>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </AnimatePresence>

                        {memory.image_urls.length > 1 && (
                            <>
                                <div className="absolute top-1/2 left-4 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-full bg-black/40 border border-white/10 hover:bg-black/60"
                                        onClick={() => setCurrentImageIndex(prev => (prev === 0 ? memory.image_urls.length - 1 : prev - 1))}
                                    >
                                        <Heart className="h-4 w-4 -rotate-90 text-rose-300" />
                                    </Button>
                                </div>
                                <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-full bg-black/40 border border-white/10 hover:bg-black/60"
                                        onClick={() => setCurrentImageIndex(prev => (prev === memory.image_urls.length - 1 ? 0 : prev + 1))}
                                    >
                                        <Heart className="h-4 w-4 rotate-90 text-rose-300" />
                                    </Button>
                                </div>
                            </>
                        )}
                        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-neutral-950 to-transparent z-40" />
                    </div>

                    {/* Unified Scrollable Content Section */}
                    <div className="flex-1 overflow-y-auto minimal-scrollbar bg-neutral-950/40">
                        {/* Metadata Header */}
                        <div className="px-6 pt-4 pb-2">
                            <div className="space-y-3">
                                {memory.title && (
                                    <h2 className="text-2xl font-serif font-bold text-white tracking-tight leading-none">
                                        {memory.title}
                                    </h2>
                                )}
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-rose-300/60 uppercase tracking-[0.15em] font-black">
                                        {format(new Date(memory.memory_date + "T12:00:00"), "MMMM do, yyyy")}
                                    </span>
                                    {memory.location && (
                                        <>
                                            <span className="w-1 h-1 rounded-full bg-white/10" />
                                            <span className="text-[10px] text-rose-300/40 font-medium tracking-wide">
                                                {memory.location}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {memory.description && (
                            <div
                                className="px-6 py-2 cursor-pointer group/desc relative"
                                onClick={() => setIsExpanded(!isExpanded)}
                            >
                                <motion.div
                                    initial={false}
                                    animate={{ maxHeight: isExpanded ? "1000px" : "3.6rem" }}
                                    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                                    className="relative overflow-hidden border-l border-white/10 pl-4"
                                >
                                    <p className={cn(
                                        "text-xs text-white/50 leading-relaxed font-medium italic transition-colors group-hover/desc:text-white/70",
                                        !isExpanded && "line-clamp-3"
                                    )}>
                                        {memory.description}
                                    </p>
                                </motion.div>
                            </div>
                        )}

                        {/* Comments Section */}
                        <div className="px-6 pb-6 mt-4">
                            <div className="space-y-3">
                                <h3 className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-bold">Comments</h3>
                                <CommentsDisplay
                                    comments={comments}
                                    currentUserId={currentUserId}
                                    onAddComment={handleAddComment}
                                    compact
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
            <FullScreenImageModal
                src={fullScreenImage}
                onClose={() => setFullScreenImage(null)}
            />
        </Dialog>
    )
}
