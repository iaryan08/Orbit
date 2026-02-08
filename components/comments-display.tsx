'use client'

import { useState, useCallback } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Trash2, Edit2, Check, X, Send } from 'lucide-react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

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

interface CommentsDisplayProps {
    comments: CommentData[]
    currentUserId: string
    onAddComment: (content: string) => Promise<void> | void
    onEditComment?: (commentId: string, content: string) => Promise<void> | void
    onDeleteComment?: (commentId: string) => Promise<void> | void
    compact?: boolean
}

export function CommentsDisplay({
    comments,
    currentUserId,
    onAddComment,
    compact = false
}: CommentsDisplayProps) {
    const [newComment, setNewComment] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleAddComment = useCallback(async () => {
        if (!newComment.trim()) return

        setIsLoading(true)
        try {
            await onAddComment(newComment)
            setNewComment('')
        } finally {
            setIsLoading(false)
        }
    }, [newComment, onAddComment])

    return (
        <div className={cn("space-y-4", compact && "space-y-3")}>
            {/* Add Comment Form */}
            <div className="flex gap-3 px-1">
                <div className="flex-1 relative group/input">
                    <input
                        type="text"
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleAddComment()
                            }
                        }}
                        className={cn(
                            "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs",
                            "text-white placeholder:text-white/20",
                            "focus:outline-none focus:border-rose-500/30 focus:bg-white/10",
                            compact && "px-3 py-2 text-[11px] rounded-lg"
                        )}
                        disabled={isLoading}
                    />
                </div>
                {(newComment.trim()) && (
                    <button
                        onClick={handleAddComment}
                        disabled={!newComment.trim() || isLoading}
                        className={cn(
                            "bg-rose-500 text-white border border-rose-400/20 rounded-xl p-2.5 flex items-center justify-center",
                            "transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                            compact && "p-2 rounded-lg"
                        )}
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Send className={cn("w-4 h-4", compact && "w-3.5 h-3.5")} />
                        )}
                    </button>
                )}
            </div>

            {/* Comments List */}
            {comments.length > 0 && (
                <div className={cn("space-y-4", compact && "space-y-3")}>
                    {comments.map((comment) => (
                        <div
                            key={comment.id}
                            className="group relative transition-all duration-300"
                        >
                            <div className="flex gap-3">
                                <div className={cn(
                                    "relative flex-shrink-0 bg-white/5 rounded-full overflow-hidden border border-white/10 shadow-lg mt-0.5",
                                    compact ? "w-6 h-6" : "w-8 h-8"
                                )}>
                                    {comment.profiles?.avatar_url ? (
                                        <Image
                                            src={comment.profiles.avatar_url}
                                            alt={comment.profiles.display_name || 'User'}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[8px] text-white/20 font-black">
                                            {(comment.profiles?.display_name || 'U').charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="relative inline-flex flex-col gap-1 max-w-full group/bubble">
                                        <div className="flex items-center gap-2 px-1">
                                            <span className="font-bold text-white text-[10px] tracking-tight">
                                                {comment.profiles?.display_name || 'User'}
                                            </span>
                                            <span className="text-[8px] text-white/20 font-medium uppercase tracking-wider">
                                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <div className={cn(
                                            "px-3 py-2 rounded-2xl transition-all duration-300 bg-white/[0.03] text-white/70 group-hover:bg-white/[0.05]"
                                        )}>
                                            <p className="text-[11.5px] leading-relaxed break-words font-medium tracking-tight">
                                                {comment.content}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {comments.length === 0 && (
                <div className="text-center opacity-100 pb-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">
                        No comments yet
                    </p>
                </div>
            )}
        </div>
    )
}
