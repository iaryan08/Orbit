'use client'

import { useState, useCallback } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Trash2, Edit2, Check, X, Send } from 'lucide-react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
    onEditComment,
    onDeleteComment,
    compact = false
}: CommentsDisplayProps) {
    const [newComment, setNewComment] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editContent, setEditContent] = useState('')

    const [activeCommentId, setActiveCommentId] = useState<string | null>(null)

    const [commentToDelete, setCommentToDelete] = useState<string | null>(null)

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

    const handleEdit = async (commentId: string) => {
        if (!editContent.trim() || !onEditComment) return
        setIsLoading(true)
        try {
            await onEditComment(commentId, editContent)
            setEditingId(null)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (commentId: string) => {
        if (!onDeleteComment) return
        await onDeleteComment(commentId)
    }

    return (
        <div className={cn("space-y-4", compact && "space-y-3")}>
            {/* Add Comment Form */}
            <div className="flex gap-3 px-1">
                <div className="flex-1 relative group/input">
                    <input
                        type="text"
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => {
                            setNewComment(e.target.value)
                            if (editingId) setEditingId(null) // Cancel edit if typing in main
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleAddComment()
                            }
                        }}
                        className={cn(
                            "w-full bg-white/5 rounded-xl px-4 py-2.5 text-xs",
                            "text-white placeholder:text-white/20",
                            "focus:outline-none focus:bg-white/10",
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
                            "bg-rose-500 text-white rounded-xl p-2.5 flex items-center justify-center",
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
                            className="group relative transition-shadow duration-300"
                            onClick={() => {
                                // Only toggle active state if not already editing
                                if (!editingId) {
                                    setActiveCommentId(activeCommentId === comment.id ? null : comment.id)
                                }
                            }}
                        >
                            <div className="flex gap-3">
                                <div className={cn(
                                    "relative flex-shrink-0 bg-white/5 rounded-full overflow-hidden shadow-lg mt-0.5",
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
                                    <div className="relative inline-flex flex-col gap-1 max-w-full group/bubble w-full">
                                        <div className="flex items-center justify-between gap-2 px-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-white text-[10px] tracking-tight">
                                                    {comment.profiles?.display_name || 'User'}
                                                </span>
                                                <span className="text-[8px] text-white/20 font-medium uppercase tracking-wider">
                                                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                                </span>
                                            </div>

                                            {comment.user_id === currentUserId && !editingId && (
                                                <div className={cn(
                                                    "flex items-center gap-1 transition-opacity duration-200",
                                                    activeCommentId === comment.id
                                                        ? "opacity-100 pointer-events-auto visible"
                                                        : "opacity-0 pointer-events-none invisible group-hover:opacity-100 group-hover:pointer-events-auto group-hover:visible"
                                                )}>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setEditingId(comment.id)
                                                            setEditContent(comment.content)
                                                            setActiveCommentId(null)
                                                        }}
                                                        className="p-1.5 sm:p-1 text-white/40 sm:text-white/20 hover:text-rose-300 transition-colors"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setCommentToDelete(comment.id)
                                                            setActiveCommentId(null)
                                                        }}
                                                        className="p-1.5 sm:p-1 text-white/40 sm:text-white/20 hover:text-red-400 transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {editingId === comment.id ? (
                                            <div className="flex flex-col gap-2 w-full mt-1">
                                                <textarea
                                                    autoFocus
                                                    value={editContent}
                                                    onChange={(e) => setEditContent(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault()
                                                            handleEdit(comment.id)
                                                        }
                                                        if (e.key === 'Escape') setEditingId(null)
                                                    }}
                                                    className="w-full bg-white/10 rounded-xl px-3 py-2 text-[11.5px] text-white focus:outline-none focus:ring-1 focus:ring-white/20 minimal-scrollbar resize-none"
                                                    rows={2}
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className="text-[10px] font-bold text-white/20 hover:text-white uppercase tracking-wider px-2 py-1"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(comment.id)}
                                                        className="text-[10px] font-bold text-rose-400 hover:text-rose-300 uppercase tracking-wider px-2 py-1"
                                                    >
                                                        Save
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={cn(
                                                "px-3 py-2 rounded-2xl transition-colors duration-300 bg-white/[0.03] text-white/70 group-hover:bg-white/[0.05]"
                                            )}>
                                                <p className="text-[11.5px] leading-relaxed break-words font-medium tracking-tight">
                                                    {comment.content}
                                                </p>
                                            </div>
                                        )}
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

            {/* Custom Confirm Delete Modal */}
            <AlertDialog open={!!commentToDelete} onOpenChange={(open) => !open && setCommentToDelete(null)}>
                <AlertDialogContent className="bg-neutral-900/90 backdrop-blur-xl border-white/10 rounded-3xl max-w-[320px]">
                    <AlertDialogHeader className="space-y-3">
                        <AlertDialogTitle className="text-white text-lg font-serif">Remove Comment?</AlertDialogTitle>
                        <AlertDialogDescription className="text-white/50 text-xs leading-relaxed">
                            This will permanently delete your comment. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row gap-3 mt-6">
                        <AlertDialogCancel className="flex-1 bg-white/5 border-none text-white/40 hover:text-white hover:bg-white/10 rounded-xl py-5 text-xs font-bold uppercase tracking-widest transition-[background-color,color]">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (commentToDelete) {
                                    handleDelete(commentToDelete)
                                    setCommentToDelete(null)
                                }
                            }}
                            className="flex-1 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border-none rounded-xl py-5 text-xs font-bold uppercase tracking-widest transition-[background-color,color]"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
