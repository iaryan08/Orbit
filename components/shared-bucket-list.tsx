'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Check, Sparkles, Target, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { addBucketItem, toggleBucketItem, deleteBucketItem } from '@/lib/actions/bucket'
import { useToast } from '@/hooks/use-toast'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export function SharedBucketList({ initialItems = [] }: { initialItems: any[] }) {
    const [items, setItems] = useState<any[]>(initialItems)
    const [newItemTitle, setNewItemTitle] = useState('')
    const [isAdding, setIsAdding] = useState(false)
    const { toast } = useToast()
    const inputRef = useRef<HTMLInputElement>(null)

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newItemTitle.trim()) return

        const title = newItemTitle.trim()
        setNewItemTitle('')
        setIsAdding(true)

        // Optimistic Add
        const optimItem = {
            id: 'optimistic-' + Date.now(),
            title: title,
            is_completed: false,
            created_at: new Date().toISOString()
        }
        setItems([optimItem, ...items])

        const res = await addBucketItem(title)

        setIsAdding(false)
        if (res.error) {
            toast({ title: "Error", description: res.error, variant: "destructive" })
            setItems(items) // Revert
        } else {
            // Ideally we'd get the real ID back, but for now we'll rely on revalidation or just leave it until refresh
            // Since we revalidatePath in the action, the parent component *should* refresh if it's a server component
            // But client state might persist. Let's just keep the optimistic one visually for now.
            toast({ title: "Dream Added", description: "Added to your shared bucket list!", variant: "success" })
        }
    }

    const handleToggle = async (id: string, currentStatus: boolean) => {
        const newStatus = !currentStatus

        // Optimistic Update
        setItems(items.map(i => i.id === id ? { ...i, is_completed: newStatus } : i))

        // Trigger confetti or sound effect here if completing?
        if (newStatus) {
            // maybe play sound
        }

        const res = await toggleBucketItem(id, newStatus)
        if (res.error) {
            toast({ title: "Error", description: res.error, variant: "destructive" })
            setItems(items) // Revert
        }
    }

    const handleDelete = async (id: string) => {
        // Optimistic Delete
        const oldItems = [...items]
        setItems(items.filter(i => i.id !== id))

        const res = await deleteBucketItem(id)
        if (res.error) {
            toast({ title: "Error", description: res.error, variant: "destructive" })
            setItems(oldItems) // Revert
        }
    }

    // Sort: Pending first, then completed
    const sortedItems = [...items].sort((a, b) => {
        if (a.is_completed === b.is_completed) {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        }
        return a.is_completed ? 1 : -1
    })

    const completedCount = items.filter(i => i.is_completed).length
    const totalCount = items.length
    const progress = totalCount === 0 ? 0 : (completedCount / totalCount) * 100

    return (
        <Card className="glass-card border-none overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-transparent to-purple-900/10 pointer-events-none" />

            <CardHeader className="pb-4 relative z-10">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-serif text-white flex items-center gap-2">
                            <Target className="h-5 w-5 text-indigo-300" />
                            Our Bucket List
                        </CardTitle>
                        <p className="text-xs text-indigo-200/60 uppercase tracking-widest font-medium">
                            Dreams we'll chase together
                        </p>
                    </div>

                    {/* Progress Circle */}
                    <div className="relative w-10 h-10 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                            <path
                                className="text-white/10"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                            />
                            <motion.path
                                className="text-indigo-400"
                                initial={{ strokeDasharray: "0, 100" }}
                                animate={{ strokeDasharray: `${progress}, 100` }}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                            />
                        </svg>
                        <span className="absolute text-[10px] font-bold text-indigo-200">
                            {completedCount}
                        </span>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-6 relative z-10">
                {/* Input Area */}
                <form onSubmit={handleAdd} className="relative group/input">
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Add a new dream..."
                        value={newItemTitle}
                        onChange={(e) => setNewItemTitle(e.target.value)}
                        className="w-full bg-black/20 border border-white/5 rounded-2xl px-4 py-3 pl-11 text-sm text-white focus:outline-none focus:bg-black/40 focus:border-indigo-500/50 transition-all placeholder:text-white/30"
                    />
                    <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400/50 group-focus-within/input:text-indigo-400 transition-colors" />
                    <button
                        type="submit"
                        disabled={!newItemTitle.trim() || isAdding}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-xl bg-indigo-500/20 text-indigo-200 opacity-0 group-focus-within/input:opacity-100 hover:bg-indigo-500 hover:text-white transition-all disabled:opacity-0"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </form>

                {/* List */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    <AnimatePresence initial={false} mode="popLayout">
                        {sortedItems.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-8 text-white/30 text-sm italic"
                            >
                                No dreams yet. Start dreaming big! ✨
                            </motion.div>
                        ) : (
                            sortedItems.map((item) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                                    className={cn(
                                        "group flex items-center gap-3 p-3 rounded-xl border transition-all duration-300",
                                        item.is_completed
                                            ? "bg-indigo-900/10 border-indigo-500/20 opacity-60"
                                            : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
                                    )}
                                >
                                    <button
                                        onClick={() => handleToggle(item.id, item.is_completed)}
                                        className={cn(
                                            "w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300 flex-shrink-0",
                                            item.is_completed
                                                ? "bg-indigo-500 border-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                                : "border-white/30 text-transparent hover:border-indigo-400"
                                        )}
                                    >
                                        <Check className="w-3 h-3" strokeWidth={3} />
                                    </button>

                                    <span className={cn(
                                        "flex-1 text-sm transition-all duration-300",
                                        item.is_completed
                                            ? "text-indigo-200/50 line-through decoration-indigo-500/30 decoration-2"
                                            : "text-white/90"
                                    )}>
                                        {item.title}
                                    </span>

                                    {item.is_completed && (
                                        <Trophy className="w-4 h-4 text-yellow-500/50 animate-pulse" />
                                    )}

                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-950/30 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </CardContent>
        </Card>
    )
}
