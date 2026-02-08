import { motion, AnimatePresence } from 'framer-motion'
import { X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import * as Portal from '@radix-ui/react-portal'

interface FullScreenImageModalProps {
    src: string | null
    onClose: () => void
}

export function FullScreenImageModal({ src, onClose }: FullScreenImageModalProps) {
    const [scale, setScale] = useState(1)
    const [rotate, setRotate] = useState(0)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
        if (!src) return

        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleEsc)
        document.body.style.overflow = 'hidden'

        return () => {
            window.removeEventListener('keydown', handleEsc)
            document.body.style.overflow = 'unset'
        }
    }, [src, onClose])

    if (!isMounted) return null

    return (
        <Portal.Root>
            <AnimatePresence>
                {src && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/95 backdrop-blur-md group"
                        onClick={onClose}
                    >
                        {/* Controls - Auto-hide logic refined for mobile */}
                        <div
                            className="absolute top-6 right-6 flex items-center gap-4 z-[10001] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300"
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setRotate(r => r + 90)}
                                className="p-2.5 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all"
                                title="Rotate"
                            >
                                <RotateCw className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setScale(s => Math.min(s + 0.5, 3))}
                                className="p-2.5 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all"
                                title="Zoom In"
                            >
                                <ZoomIn className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setScale(s => Math.max(s - 0.5, 0.5))}
                                className="p-2.5 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all"
                                title="Zoom Out"
                            >
                                <ZoomOut className="w-5 h-5" />
                            </button>
                            <div className="w-[1px] h-6 bg-white/10 mx-2 hidden sm:block" />
                            <button
                                onClick={onClose}
                                className="p-2.5 rounded-full bg-white/10 border border-white/20 text-white hover:bg-rose-500 transition-all"
                                title="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Image Container */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{
                                scale: scale,
                                rotate: rotate,
                                opacity: 1
                            }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative w-full h-full p-4 flex items-center justify-center pointer-events-none"
                        >
                            <div className="relative w-full h-full max-w-[95vw] max-h-[95vh] pointer-events-auto">
                                <Image
                                    src={src}
                                    alt="Full Screen View"
                                    fill
                                    className="object-contain"
                                    priority
                                    quality={100}
                                />
                            </div>
                        </motion.div>

                        {/* Hint */}
                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-none hidden sm:block">
                            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/20">
                                Click background or press ESC to close
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Portal.Root>
    )
}
