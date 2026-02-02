'use client'

import { useAppMode } from './app-mode-context'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Moon, Sparkles, Droplets } from 'lucide-react'
import { cn } from '@/lib/utils'

export function LunaraToggle() {
    const { mode, toggleMode } = useAppMode()

    return (
        <div className="flex items-center gap-3">
            <span className={cn(
                "text-[10px] uppercase tracking-[0.2em] font-bold transition-colors duration-300 hidden sm:block",
                mode === 'moon' ? "text-rose-200" : "text-white/30"
            )}>
                Moon
            </span>

            <button
                onClick={toggleMode}
                className={cn(
                    "relative flex items-center h-7 w-14 sm:h-8 sm:w-16 rounded-full p-1 cursor-pointer transition-all duration-500",
                    mode === 'moon'
                        ? "bg-rose-950/40 border-rose-500/30"
                        : "bg-purple-950/40 border-purple-500/30",
                    "border backdrop-blur-lg shadow-xl"
                )}
            >
                <motion.div
                    className={cn(
                        "absolute h-5 w-5 sm:h-6 sm:w-6 rounded-full flex items-center justify-center shadow-lg z-10",
                        mode === 'moon'
                            ? "bg-gradient-to-br from-rose-400 to-rose-600 shadow-rose-500/40"
                            : "bg-gradient-to-br from-purple-400 to-purple-600 shadow-purple-500/40"
                    )}
                    animate={{
                        x: mode === 'moon' ? 0 : (typeof window !== 'undefined' && window.innerWidth < 640 ? 28 : 32),
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30
                    }}
                >
                    <AnimatePresence mode="wait">
                        {mode === 'moon' ? (
                            <motion.div
                                key="moon-icon"
                                initial={{ scale: 0, rotate: -90 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0, rotate: 90 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Heart className="w-3.5 h-3.5 text-white fill-white" />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="lunara-icon"
                                initial={{ scale: 0, rotate: -90 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0, rotate: 90 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Moon className="w-3.5 h-3.5 text-white fill-white" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Background visual feedback */}
                <div className="hidden sm:flex w-full justify-between items-center px-1.5 opacity-20 group-hover:opacity-40 transition-opacity">
                    <Heart className="w-3 h-3 text-rose-300" />
                    <Moon className="w-3 h-3 text-purple-300" />
                </div>
            </button>

            <span className={cn(
                "text-[10px] uppercase tracking-[0.2em] font-bold transition-colors duration-300 hidden sm:block",
                mode === 'lunara' ? "text-purple-200" : "text-white/30"
            )}>
                Lunara
            </span>
        </div>
    )
}
