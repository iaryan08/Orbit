'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"

import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { formatDistanceToNow } from "date-fns"
import { Maximize2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
    getPolaroidComments,
    addPolaroidComment
} from "@/lib/actions/reactions-comments"
import { CommentsDisplay } from "./comments-display"
import { useToast } from "@/hooks/use-toast"
import { FullScreenImageModal } from "./full-screen-image-modal"
import { cn } from "@/lib/utils"

interface PolaroidData {
    id: string
    image_url: string
    caption?: string
    created_at: string
}

interface PolaroidDetailModalProps {
    polaroid: PolaroidData | null
    title: string
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

export function PolaroidDetailModal({ polaroid, title, isOpen, onClose }: PolaroidDetailModalProps) {
    const [comments, setComments] = useState<CommentData[]>([])
    const [isLoadingComments, setIsLoadingComments] = useState(false)
    const [currentUserId, setCurrentUserId] = useState<string>('')
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
        if (!polaroid || !isOpen) return

        const loadData = async () => {
            const commentsRes = await getPolaroidComments(polaroid.id)
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
            .channel(`polaroid-comments:${polaroid.id}`)
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'polaroid_comments', filter: `polaroid_id=eq.${polaroid.id}` },
                () => loadData()
            )
            .subscribe()

        return () => {
            commentsSub.unsubscribe()
        }
    }, [polaroid, isOpen, supabase, currentUserId])

    // Clear state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setFullScreenImage(null)
        }
    }, [isOpen])

    if (!polaroid) return null

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

        const res = await addPolaroidComment(polaroid.id, content)
        if (res.error) {
            setComments(prev => prev.filter(c => c.id !== optimisticId))
            toast({
                title: "Failed to post comment",
                description: res.error,
                variant: "destructive"
            })
        } else {
            // Force a refresh to get server-sanctified IDs and official profiles
            const loadRes = await getPolaroidComments(polaroid.id)
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
                className="p-0 overflow-hidden border-none bg-neutral-950/80 backdrop-blur-xl sm:max-w-[400px] w-[85vw] h-auto max-h-[82vh] flex flex-col transition-all duration-300 rounded-3xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]"
                onInteractOutside={(e) => {
                    if (fullScreenImage) e.preventDefault()
                }}
                onEscapeKeyDown={(e) => {
                    if (fullScreenImage) e.preventDefault()
                }}
            >
                <DialogTitle className="sr-only">Polaroid Details</DialogTitle>
                <DialogDescription className="sr-only">
                    View and comment on this polaroid moment.
                </DialogDescription>
                <div className="relative w-full flex flex-col group min-h-0">

                    <div className="relative h-[320px] w-full flex-shrink-0 flex items-center justify-center bg-neutral-900/50">
                        <div
                            className="relative h-[300px] w-full flex-shrink-0 cursor-pointer"
                            onClick={() => setFullScreenImage(polaroid.image_url)}
                        >
                            <Image
                                src={polaroid.image_url}
                                alt={title}
                                fill
                                className="object-cover"
                                loading="lazy"
                            />
                            {/* Full Screen Icon - Visible on mobile, hover on desktop */}
                        </div>
                        <div className="absolute top-4 left-4 z-[60] opacity-100 sm:opacity-0 sm:group-hover:opacity-40 sm:hover:!opacity-100 transition-opacity">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setFullScreenImage(polaroid.image_url);
                                }}
                                className="w-7 h-7 flex items-center justify-center rounded-full bg-black/40 text-white/50 hover:text-white hover:bg-black/60 transition-all backdrop-blur-md"
                                title="View Fullscreen"
                            >
                                <Maximize2 className="h-3 w-3" />
                            </button>
                        </div>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-neutral-950/60 to-transparent pointer-events-none" />
                </div>

                {/* Unified Scrollable Content Section */}
                <div className="flex-1 overflow-y-auto minimal-scrollbar bg-neutral-950/40">
                    {/* Metadata Header */}
                    <div className="px-6 pt-4 pb-2">
                        <div className="space-y-3">
                            {title && (
                                <h2 className="text-2xl font-serif font-bold text-white tracking-tight leading-none">
                                    {title}
                                </h2>
                            )}
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-white/30 uppercase tracking-[0.15em] font-medium">
                                    {formatDistanceToNow(new Date(polaroid.created_at), { addSuffix: true })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {polaroid.caption && (
                        <div
                            className="px-6 py-2 cursor-pointer group/caption relative"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            <motion.div
                                initial={false}
                                animate={{ maxHeight: isExpanded ? "1000px" : "2.6rem" }}
                                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                                className="relative overflow-hidden pl-4"
                            >
                                <p className={cn(
                                    "text-[11px] text-rose-300/60 font-medium italic transition-colors group-hover/caption:text-rose-300/80",
                                    !isExpanded && "line-clamp-2"
                                )}>
                                    {polaroid.caption}
                                </p>
                            </motion.div>
                        </div>
                    )}

                    {/* Comments Section */}
                    <div className="px-6 pb-6">
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
            </DialogContent>
            <FullScreenImageModal
                src={fullScreenImage}
                onClose={() => setFullScreenImage(null)}
            />
        </Dialog>
    )
}
