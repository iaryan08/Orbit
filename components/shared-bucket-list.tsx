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
        if (id.startsWith('optimistic-')) return

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
        if (id.startsWith('optimistic-')) return

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
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-transparent to-amber-500/10 pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-rose-500/20 to-transparent" />

            <CardHeader className="pb-4 relative z-10">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-romantic tracking-wider text-rose-50 flex items-center gap-2">
                            <Target className="h-5 w-5 text-rose-300" />
                            Our Bucket List
                        </CardTitle>
                        <p className="text-[10px] text-rose-200/40 uppercase tracking-[0.3em] font-bold">
                            Dreams we'll chase together
                        </p>
                    </div>

                    {/* Progress Circle */}
                    <div className="relative w-12 h-12 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                            <path
                                className="text-white/5"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                            />
                            <motion.path
                                className="text-rose-400"
                                initial={{ strokeDasharray: "0, 100" }}
                                animate={{ strokeDasharray: `${progress}, 100` }}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                style={{
                                    filter: 'drop-shadow(0 0 3px rgba(251, 113, 133, 0.4))'
                                }}
                            />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                            <span className="text-xs font-bold text-rose-200 leading-none">
                                {completedCount}
                            </span>
                            <div className="h-[1px] w-3 bg-rose-500/30 my-0.5" />
                            <span className="text-[8px] font-bold text-rose-100/30">
                                {totalCount}
                            </span>
                        </div>
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
                        className="w-full bg-rose-500/5 border border-white/5 rounded-2xl px-4 py-3 pl-11 text-sm text-white focus:outline-none focus:bg-rose-500/10 focus:border-rose-500/30 transition-all placeholder:text-rose-100/20"
                    />
                    <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400/30 group-focus-within/input:text-rose-400 transition-colors" />
                    <button
                        type="submit"
                        disabled={!newItemTitle.trim() || isAdding}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-xl bg-rose-500/20 text-rose-200 opacity-0 group-focus-within/input:opacity-100 hover:bg-rose-500 hover:text-white transition-all disabled:opacity-0"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </form>

                {/* List */}
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-rose-500/20 scrollbar-track-transparent">
                    <AnimatePresence initial={false} mode="popLayout">
                        {sortedItems.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-10 text-rose-100/20 text-[10px] uppercase font-bold tracking-[0.2em]"
                            >
                                No dreams yet. <br /> Start dreaming big! ✨
                            </motion.div>
                        ) : (
                            sortedItems.map((item) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                                    className={cn(
                                        "group flex items-center gap-3 p-3.5 rounded-2xl border transition-all duration-300",
                                        item.is_completed
                                            ? "bg-rose-500/5 border-rose-500/10 opacity-60"
                                            : "glass-card border-white/5 hover:border-rose-500/20 shadow-sm"
                                    )}
                                >
                                    <button
                                        onClick={() => handleToggle(item.id, item.is_completed)}
                                        className={cn(
                                            "w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-300 flex-shrink-0",
                                            item.is_completed
                                                ? "bg-gradient-to-br from-rose-500 to-pink-600 border-rose-400 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                                                : "border-white/10 text-transparent hover:border-rose-400/50"
                                        )}
                                    >
                                        <Check className="w-3.5 h-3.5" strokeWidth={3} />
                                    </button>

                                    <span className={cn(
                                        "flex-1 text-sm font-medium transition-all duration-300",
                                        item.is_completed
                                            ? "text-rose-100/40 line-through decoration-rose-500/40 decoration-2"
                                            : "text-rose-50/90"
                                    )}>
                                        {item.title}
                                    </span>

                                    {item.is_completed && (
                                        <Trophy className="w-4 h-4 text-amber-400/50 animate-pulse" />
                                    )}

                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="opacity-0 group-hover:opacity-100 p-2 rounded-xl text-rose-100/10 hover:text-red-400 hover:bg-red-500/10 transition-all ml-1"
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
