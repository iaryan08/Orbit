'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { format } from "date-fns"
import { Heart } from "lucide-react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { FullScreenImageModal } from "./full-screen-image-modal"
import {
    getMemoryComments,
    addMemoryComment,
    updateMemoryComment,
    deleteMemoryComment
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
    const isDraggingRef = useRef(false)

    // Touch logic for lightweight swipe
    const [touchStart, setTouchStart] = useState<number | null>(null)
    const [touchEnd, setTouchEnd] = useState<number | null>(null)

    const supabase = createClient()

    // Get current user
    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) setCurrentUserId(user.id)
        }
        getUser()
    }, [supabase])

    const fetchComments = useCallback(async () => {
        if (!memory) return
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
    }, [memory, toast])

    // Load comments and handle real-time updates
    useEffect(() => {
        if (!memory || !isOpen) return
        fetchComments()

        const commentsSub = supabase
            .channel(`memory-comments:${memory.id}`)
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'memory_comments', filter: `memory_id=eq.${memory.id}` },
                () => fetchComments()
            )
            .subscribe()

        return () => {
            if (commentsSub) commentsSub.unsubscribe()
        }
    }, [memory, isOpen, currentUserId, supabase, fetchComments])

    // Reset image index and full screen state when memory changes or modal closes
    useEffect(() => {
        setCurrentImageIndex(0)
        setFullScreenImage(null)
    }, [memory?.id, isOpen])

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null)
        setTouchStart(e.targetTouches[0].clientX)
        isDraggingRef.current = false
    }

    const onTouchMove = (e: React.TouchEvent) => {
        const currentX = e.targetTouches[0].clientX
        setTouchEnd(currentX)
        if (touchStart && Math.abs(touchStart - currentX) > 10) {
            isDraggingRef.current = true
        }
    }

    const onTouchEndEvent = () => {
        setTimeout(() => { isDraggingRef.current = false }, 50)
        if (!touchStart || !touchEnd || !memory) return
        const distance = touchStart - touchEnd

        if (distance > 50) {
            // Swipe Left (Next)
            setCurrentImageIndex(prev => prev < memory.image_urls.length - 1 ? prev + 1 : 0)
        } else if (distance < -50) {
            // Swipe Right (Prev)
            setCurrentImageIndex(prev => prev > 0 ? prev - 1 : memory.image_urls.length - 1)
        }
    }

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

    const handleEditComment = async (commentId: string, content: string) => {
        const result = await updateMemoryComment(commentId, content)
        if (result.success) {
            fetchComments()
            toast({
                title: "Comment updated",
                description: "Your comment was updated successfully."
            })
        } else {
            toast({
                title: "Error",
                description: result.error || "Failed to update comment.",
                variant: "destructive"
            })
        }
    }

    const handleDeleteComment = async (commentId: string) => {
        const result = await deleteMemoryComment(commentId)
        if (result.success) {
            setComments(prev => prev.filter(c => c.id !== commentId))
            toast({
                title: "Comment deleted",
                description: "Your comment was removed."
            })
        } else {
            toast({
                title: "Error",
                description: result.error || "Failed to delete comment.",
                variant: "destructive"
            })
        }
    }





    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                className="p-0 overflow-hidden border-none bg-neutral-950/85 backdrop-blur-md sm:max-w-[400px] w-[80vw] h-auto max-h-[82vh] flex flex-col transition-[opacity,transform] duration-200 rounded-3xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] outline-none focus:outline-none focus-visible:outline-none"
                onOpenAutoFocus={(e) => e.preventDefault()}
                onInteractOutside={(e) => {
                    if (fullScreenImage) e.preventDefault()
                }}
                onEscapeKeyDown={(e) => {
                    if (fullScreenImage) e.preventDefault()
                }}
            >
                <DialogTitle className="sr-only">Memory Details</DialogTitle>
                <DialogDescription className="sr-only">
                    View and comment on this shared memory.
                </DialogDescription>
                <div className="relative w-full flex flex-col group min-h-0">

                    <div className="relative h-[300px] w-full flex-shrink-0 flex items-center justify-center overflow-hidden bg-neutral-900/50">
                        {/* Static Single Image View instead of heavy mapping & AnimatePresence */}
                        <div
                            className="absolute inset-0 w-full h-full cursor-pointer touch-pan-y"
                            onClick={() => {
                                if (!isDraggingRef.current) {
                                    setFullScreenImage(memory.image_urls[currentImageIndex])
                                }
                            }}
                            onTouchStart={memory.image_urls.length > 1 ? onTouchStart : undefined}
                            onTouchMove={memory.image_urls.length > 1 ? onTouchMove : undefined}
                            onTouchEnd={memory.image_urls.length > 1 ? onTouchEndEvent : undefined}
                        >
                            <img
                                src={memory.image_urls[currentImageIndex] || "/placeholder.svg"}
                                alt={`${memory.title} ${currentImageIndex + 1}`}
                                className="object-cover w-full h-full pointer-events-none"
                                draggable={false}
                            />
                            {memory.image_urls.length > 1 && (
                                <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-[0.2em] shadow-lg pointer-events-none">
                                    {currentImageIndex + 1} / {memory.image_urls.length}
                                </div>
                            )}
                        </div>

                        {memory.image_urls.length > 1 && (
                            <>
                                <div className="hidden md:flex absolute top-1/2 left-4 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-full bg-black/40 hover:bg-black/60"
                                        onClick={() => setCurrentImageIndex(prev => (prev === 0 ? memory.image_urls.length - 1 : prev - 1))}
                                    >
                                        <Heart className="h-4 w-4 -rotate-90 text-rose-300" />
                                    </Button>
                                </div>
                                <div className="hidden md:flex absolute top-1/2 right-4 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-full bg-black/40 hover:bg-black/60"
                                        onClick={() => setCurrentImageIndex(prev => (prev === memory.image_urls.length - 1 ? 0 : prev + 1))}
                                    >
                                        <Heart className="h-4 w-4 rotate-90 text-rose-300" />
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Unified Scrollable Content Section */}
                    <div className="flex-1 overflow-y-auto minimal-scrollbar bg-neutral-950/50 z-20">
                        {/* Metadata Header */}
                        <div className="px-6 pt-6 pb-0">
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
                                    className="relative overflow-hidden pl-4"
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
                                    onEditComment={handleEditComment}
                                    onDeleteComment={handleDeleteComment}
                                    compact
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
            <FullScreenImageModal
                src={fullScreenImage}
                images={memory.image_urls}
                currentIndex={currentImageIndex}
                onIndexChange={(idx) => setCurrentImageIndex(idx)}
                onClose={() => setFullScreenImage(null)}
            />
        </Dialog>
    )
}
