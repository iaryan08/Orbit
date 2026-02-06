'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Sparkles, X, Eye } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { openLetter } from '@/lib/actions/letters'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface WhisperCardProps {
    letter: any
    onOpen: (id: string) => void
}

export function WhisperCard({ letter, onOpen }: WhisperCardProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [content, setContent] = useState<string | null>(null)
    const [isRevealing, setIsRevealing] = useState(false)
    const router = useRouter()

    const handleReveal = async () => {
        setIsRevealing(true)
        // Mark as read and possibly get content if not already available (though usually client has it, security might want to mask it)
        // In this app, content is likely already in the 'letter' prop but veiled.
        // If content is hidden, we assume 'letter.content' is available. 
        // If we want true security, we wouldn't send content to client until open. 
        // For now, assuming content is present but we treat the 'openLetter' action as the trigger to destroy.

        await openLetter(letter.id)
        setContent(letter.content)
        setIsOpen(true)
        setIsRevealing(false)
    }

    const handleClose = () => {
        setIsOpen(false)
        router.refresh() // Content is gone now
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02, rotate: 1 }}
                onClick={handleReveal}
                className="relative overflow-hidden rounded-3xl aspect-[4/5] cursor-pointer group"
            >
                {/* Background Blur & Noise */}
                <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl z-0" />
                <div className="absolute inset-0 bg-gradient-to-br from-rose-900/40 via-purple-900/20 to-black z-0 opacity-50" />

                {/* Glowing Particles */}
                <div className="absolute inset-0 pointer-events-none">
                    <motion.div
                        animate={{
                            x: [0, 10, -10, 0],
                            y: [0, -10, 10, 0],
                            opacity: [0.3, 0.6, 0.3]
                        }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-1/4 left-1/4 w-32 h-32 bg-rose-500/20 blur-[50px] rounded-full"
                    />
                    <motion.div
                        animate={{
                            x: [0, -15, 15, 0],
                            y: [0, 15, -15, 0],
                            opacity: [0.2, 0.5, 0.2]
                        }}
                        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-purple-500/20 blur-[60px] rounded-full"
                    />
                </div>

                {/* Lock Icon */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-6 text-center">
                    <div className="bg-white/5 p-4 rounded-full border border-white/10 mb-4 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_30px_rgba(244,63,94,0.3)]">
                        {isRevealing ? (
                            <Sparkles className="w-8 h-8 text-rose-300 animate-spin-slow" />
                        ) : (
                            <Lock className="w-8 h-8 text-rose-300" />
                        )}
                    </div>
                    <h3 className="text-xl font-serif text-white/90 mb-1">Secret Whisper</h3>
                    <p className="text-xs text-white/50 uppercase tracking-widest font-medium">Tap to Reveal</p>

                    <div className="mt-6 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
                        <p className="text-[10px] text-red-200 font-bold uppercase tracking-wider">
                            Destructs on view
                        </p>
                    </div>
                </div>

                {/* Border Glow */}
                <div className="absolute inset-0 border border-white/5 rounded-3xl group-hover:border-rose-500/30 transition-colors duration-500" />
            </motion.div>

            {/* Reading Modal */}
            <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
                <DialogContent className="max-w-md bg-black/95 border-rose-900/30 text-rose-100 p-0 overflow-hidden shadow-[0_0_100px_rgba(244,63,94,0.15)]">
                    <div className="relative p-8 flex flex-col items-center justify-center min-h-[400px]">
                        {/* Ambient Background */}
                        <div className="absolute inset-0 bg-gradient-to-b from-rose-950/20 to-transparent pointer-events-none" />

                        {/* Content */}
                        <div className="relative z-10 text-center space-y-6 w-full">
                            <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto border border-rose-500/20">
                                <Eye className="w-5 h-5 text-rose-400" />
                            </div>

                            <div className="space-y-4">
                                <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-rose-500/70">
                                    Secret Message
                                </h2>
                                <p className="text-xl md:text-2xl font-serif leading-relaxed text-white/90 italic">
                                    "{content}"
                                </p>
                            </div>
                        </div>

                        {/* Footer Warning */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-center">
                            <p className="text-[10px] text-red-500/60 uppercase tracking-widest animate-pulse">
                                Closing this will delete the message forever
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
