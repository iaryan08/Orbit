import { motion, AnimatePresence } from 'framer-motion'
import { X, ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import * as Portal from '@radix-ui/react-portal'

interface FullScreenImageModalProps {
    src?: string | null
    images?: string[]
    currentIndex?: number
    onIndexChange?: (index: number) => void
    onClose: () => void
}

export function FullScreenImageModal({ src, images, currentIndex = 0, onIndexChange, onClose }: FullScreenImageModalProps) {
    const [scale, setScale] = useState(1)
    const [rotate, setRotate] = useState(0)
    const [isMounted, setIsMounted] = useState(false)
    const [internalIndex, setInternalIndex] = useState(currentIndex)
    const [direction, setDirection] = useState(0)

    const [touchStart, setTouchStart] = useState<number | null>(null)
    const [touchEnd, setTouchEnd] = useState<number | null>(null)

    const activeSrc = src ? (images && images.length > 0 ? images[internalIndex] : src) : null

    useEffect(() => {
        setInternalIndex(currentIndex)
    }, [currentIndex])

    // Reset state whenever the source changes or closes
    useEffect(() => {
        if (!activeSrc) {
            // Slight delay before resetting scale/rotate to allow exit animation to finish
            const timer = setTimeout(() => {
                setScale(1)
                setRotate(0)
            }, 300)
            return () => clearTimeout(timer)
        }
    }, [activeSrc])

    useEffect(() => {
        setIsMounted(true)
        if (!activeSrc) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault()
                e.stopPropagation()
                onClose()
            }
            if (images && images.length > 1) {
                if (e.key === 'ArrowRight') {
                    handleNext(e as any)
                }
                if (e.key === 'ArrowLeft') {
                    handlePrev(e as any)
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown, true)
        document.body.style.overflow = 'hidden'

        return () => {
            window.removeEventListener('keydown', handleKeyDown, true)
            document.body.style.overflow = 'unset'
        }
    }, [activeSrc, onClose, images, internalIndex])

    const handleNext = (e: React.MouseEvent | KeyboardEvent) => {
        e.stopPropagation()
        if (images && images.length > 1) {
            setDirection(1)
            const nextIdx = internalIndex === images.length - 1 ? 0 : internalIndex + 1
            setInternalIndex(nextIdx)
            onIndexChange?.(nextIdx)
            setScale(1)
            setRotate(0)
        }
    }

    const handlePrev = (e: React.MouseEvent | KeyboardEvent) => {
        e.stopPropagation()
        if (images && images.length > 1) {
            setDirection(-1)
            const prevIdx = internalIndex === 0 ? images.length - 1 : internalIndex - 1
            setInternalIndex(prevIdx)
            onIndexChange?.(prevIdx)
            setScale(1)
            setRotate(0)
        }
    }

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null)
        setTouchStart(e.targetTouches[0].clientX)
    }

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX)
    }

    const onTouchEndEvent = () => {
        if (!touchStart || !touchEnd) return
        const distance = touchStart - touchEnd
        if (distance > 50) {
            handleNext({ stopPropagation: () => { } } as any)
        } else if (distance < -50) {
            handlePrev({ stopPropagation: () => { } } as any)
        }
    }

    if (!isMounted) return null

    return (
        <Portal.Root>
            <AnimatePresence>
                {activeSrc && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/95 backdrop-blur-md group touch-none"
                    >
                        {/* Controls - Always visible at low opacity, bright on hover */}
                        <div
                            className="absolute top-6 right-6 flex items-center gap-4 z-[10001] opacity-40 group-hover:opacity-100 transition-opacity duration-300 pointer-events-auto"
                            onClick={(e) => {
                                e.stopPropagation()
                                e.preventDefault()
                            }}
                        >
                            <button
                                onClick={() => setRotate(r => r + 90)}
                                className="p-2.5 rounded-full bg-white/5 text-white hover:bg-white/10 transition-colors cursor-pointer"
                                title="Rotate"
                            >
                                <RotateCw className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setScale(s => Math.min(s + 0.5, 4))}
                                className="p-2.5 rounded-full bg-white/5 text-white hover:bg-white/10 transition-colors cursor-pointer"
                                title="Zoom In"
                            >
                                <ZoomIn className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setScale(s => Math.max(s - 0.5, 0.5))}
                                className="p-2.5 rounded-full bg-white/5 text-white hover:bg-white/10 transition-colors cursor-pointer"
                                title="Zoom Out"
                            >
                                <ZoomOut className="w-5 h-5" />
                            </button>
                            <div className="w-[8px] hidden sm:block" />
                            <button
                                onClick={onClose}
                                className="p-2.5 rounded-full bg-white/10 text-white hover:bg-rose-500 transition-colors cursor-pointer shadow-lg"
                                title="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Details counter */}
                        {images && images.length > 1 && (
                            <div className="absolute bottom-8 sm:bottom-auto sm:top-8 left-1/2 -translate-x-1/2 sm:left-8 sm:translate-x-0 z-[10001] bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 text-white font-bold text-sm tracking-widest pointer-events-none shadow-lg">
                                {internalIndex + 1} / {images.length}
                            </div>
                        )}

                        {/* Prev/Next Buttons (Hidden on mobile - swipe is used instead) */}
                        {images && images.length > 1 && (
                            <>
                                <button
                                    className="hidden sm:block absolute left-8 top-1/2 -translate-y-1/2 z-[10001] p-4 rounded-full bg-black/40 hover:bg-black/90 backdrop-blur-md text-white border border-white/10 hover:border-white/30 transition-all cursor-pointer opacity-70 hover:opacity-100 hover:scale-110 pointer-events-auto"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        handlePrev(e)
                                    }}
                                >
                                    <ChevronLeft className="w-8 h-8" />
                                </button>
                                <button
                                    className="hidden sm:block absolute right-8 top-1/2 -translate-y-1/2 z-[10001] p-4 rounded-full bg-black/40 hover:bg-black/90 backdrop-blur-md text-white border border-white/10 hover:border-white/30 transition-all cursor-pointer opacity-70 hover:opacity-100 hover:scale-110 pointer-events-auto"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        handleNext(e)
                                    }}
                                >
                                    <ChevronRight className="w-8 h-8" />
                                </button>
                            </>
                        )}

                        {/* Image Container - Lightweight fast swipe without unmounting */}
                        <div
                            className="relative w-full h-full p-0 sm:p-4 flex items-center justify-center overflow-hidden pointer-events-none"
                        >
                            <motion.div
                                animate={{ scale: scale, rotate: rotate }}
                                transition={{ type: "spring", stiffness: 400, damping: 40 }}
                                className="absolute w-full h-full max-w-[100vw] max-h-[100vh] sm:max-w-[95vw] sm:max-h-[95vh] pointer-events-auto cursor-default touch-pan-y flex items-center justify-center"
                                onClick={(e) => e.stopPropagation()}
                                onTouchStart={images && images.length > 1 ? onTouchStart : undefined}
                                onTouchMove={images && images.length > 1 ? onTouchMove : undefined}
                                onTouchEnd={images && images.length > 1 ? onTouchEndEvent : undefined}
                            >
                                <div className="relative w-full h-full max-w-full max-h-full flex items-center justify-center pointer-events-none">
                                    <img
                                        src={activeSrc || "/placeholder.svg"}
                                        alt="Full Screen View"
                                        className="object-contain w-full h-full max-h-[100vh] sm:max-h-[95vh] pointer-events-none"
                                        draggable="false"
                                    />
                                </div>
                            </motion.div>
                        </div>

                        {/* Hint */}
                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-none hidden sm:block">
                            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/10">
                                Use controls to zoom and rotate
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Portal.Root >
    )
}
