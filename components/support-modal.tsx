'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Heart,
    Sparkles,
    MessageSquare,
    Coffee,
    Utensils,
    Check,
    Loader2,
    X,
    ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { logSupportAction } from '@/lib/actions/auth'
import { cn } from '@/lib/utils'

interface SupportSuggestion {
    id: string
    type: 'physical' | 'emotional' | 'logistical' | 'surprise'
    text: string
    description: string
}

interface SupportModalProps {
    isOpen: boolean
    onClose: () => void
    phase: string
    day: number
    partnerName: string
    partnerId: string
}

export function SupportModal({ isOpen, onClose, phase, day, partnerName, partnerId }: SupportModalProps) {
    const [suggestions, setSuggestions] = useState<SupportSuggestion[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [customAction, setCustomAction] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { toast } = useToast()

    useEffect(() => {
        if (isOpen) {
            fetchSuggestions()
        }
    }, [isOpen])

    const fetchSuggestions = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/lunara/support-suggestions', {
                method: 'POST',
                body: JSON.stringify({ phase, day, partnerName })
            })
            const data = await res.json()
            setSuggestions(data)
        } catch (error) {
            console.error('Error fetching suggestions:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleLog = async () => {
        let actionText = ''
        let category = 'emotional'

        if (selectedId) {
            const suggestion = suggestions.find(s => s.id === selectedId)
            actionText = suggestion?.text || ''
            category = suggestion?.type || 'emotional'
        } else if (customAction) {
            actionText = customAction
            category = 'emotional'
        } else {
            return
        }

        setIsSubmitting(true)
        const result = await logSupportAction(partnerId, actionText, category)
        setIsSubmitting(false)

        if (result.success) {
            toast({
                title: "Action Logged",
                description: `She'll be so happy you ${actionText.toLowerCase()}!`,
                variant: "success"
            })
            onClose()
        } else {
            toast({
                title: "Error",
                description: "Failed to log support action.",
                variant: "destructive"
            })
        }
    }

    const typeIcons = {
        physical: Coffee,
        emotional: MessageSquare,
        logistical: Utensils,
        surprise: Sparkles
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-lg bg-zinc-950 border border-purple-500/20 rounded-[2.5rem] overflow-hidden shadow-2xl"
                >
                    {/* Header */}
                    <div className="p-8 pb-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-serif text-white flex items-center gap-2">
                                Support {partnerName}
                                <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                            </h2>
                            <p className="text-sm text-zinc-500 mt-1">
                                She's in her <span className="text-purple-400 font-bold">{phase}</span>. Here's how to help:
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                            <X className="w-6 h-6 text-zinc-500" />
                        </button>
                    </div>

                    <div className="px-8 py-4 max-h-[60vh] overflow-y-auto space-y-4">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-4">
                                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                                <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Asking Gemini for ideas...</p>
                            </div>
                        ) : (
                            suggestions.map((suggestion) => {
                                const Icon = typeIcons[suggestion.type]
                                return (
                                    <button
                                        key={suggestion.id}
                                        onClick={() => {
                                            setSelectedId(suggestion.id)
                                            setCustomAction('')
                                        }}
                                        className={cn(
                                            "w-full p-5 rounded-2xl border-2 text-left transition-all relative overflow-hidden group",
                                            selectedId === suggestion.id
                                                ? "bg-purple-500/10 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                                                : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"
                                        )}
                                    >
                                        <div className="flex gap-4">
                                            <div className={cn(
                                                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                                                selectedId === suggestion.id ? "bg-purple-500 text-white" : "bg-zinc-800 text-zinc-400"
                                            )}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className={cn("font-bold", selectedId === suggestion.id ? "text-white" : "text-zinc-200")}>
                                                    {suggestion.text}
                                                </p>
                                                <p className="text-xs text-zinc-500 leading-relaxed">
                                                    {suggestion.description}
                                                </p>
                                            </div>
                                        </div>
                                        {selectedId === suggestion.id && (
                                            <div className="absolute top-4 right-4 animate-in fade-in zoom-in">
                                                <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                                                    <Check className="w-3 h-3 text-white stroke-[3px]" />
                                                </div>
                                            </div>
                                        )}
                                    </button>
                                )
                            })
                        )}

                        <div className="pt-2">
                            <Label className="text-[10px] uppercase tracking-widest font-bold text-zinc-600 mb-2 block">Something else?</Label>
                            <input
                                value={customAction}
                                onChange={(e) => {
                                    setCustomAction(e.target.value)
                                    setSelectedId(null)
                                }}
                                placeholder="I brought her favorite chocolate..."
                                className="w-full bg-zinc-900/50 border-2 border-zinc-800 rounded-2xl p-4 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-purple-500/50 transition-all"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-8 pt-4">
                        <Button
                            disabled={isSubmitting || (!selectedId && !customAction)}
                            onClick={handleLog}
                            className="w-full h-14 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold shadow-xl shadow-purple-500/20 group"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                    Log Support Action
                                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
