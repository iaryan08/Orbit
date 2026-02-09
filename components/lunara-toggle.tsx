'use client'

import { useAppMode } from './app-mode-context'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Moon, Sparkles, Droplets } from 'lucide-react'
import { cn } from '@/lib/utils'

export function LunaraToggle() {
    const { mode, toggleMode } = useAppMode()

    return (
        <div className="flex items-center gap-3">
            {/* Moon Mode */}
            <AnimatePresence mode="wait">
                {(typeof window !== 'undefined' && window.innerWidth >= 640) && (
                    <motion.div
                        key="moon-label-container"
                        className="flex items-center gap-2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Heart
                            className={cn(
                                "w-3 h-3 transition-colors duration-500",
                                mode === 'moon' ? "text-rose-400" : "text-white/20"
                            )}
                            fill={mode === 'moon' ? "currentColor" : "none"}
                        />
                        <span
                            className={cn(
                                "text-[10px] uppercase tracking-[0.2em] font-bold transition-[color,transform] duration-500 selection:bg-rose-500/40 selection:text-white",
                                mode === 'moon'
                                    ? "text-rose-100 drop-shadow-[0_0_12px_rgba(251,113,133,0.6)] scale-110"
                                    : "text-white/20 hover:text-white/40"
                            )}
                        >
                            Moon
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={toggleMode}
                className={cn(
                    "relative flex items-center h-7 w-14 sm:h-8 sm:w-16 rounded-full p-1 cursor-pointer transition-[background-color,border-color,box-shadow] duration-500",
                    mode === 'moon'
                        ? "bg-rose-950/40 border-rose-500/30 shadow-[0_0_20px_rgba(251,113,133,0.15)]"
                        : "bg-purple-950/40 border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.15)]",
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
                        stiffness: 450,
                        damping: 35
                    }}
                >
                    <AnimatePresence mode="wait">
                        {mode === 'moon' ? (
                            <motion.div
                                key="moon-icon"
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ duration: 0.15 }} // Quick disappear before reaching Label
                            >
                                <Heart className="w-3.5 h-3.5 text-white fill-white" />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="lunara-icon"
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ duration: 0.15 }} // Quick disappear before reaching Label
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

            {/* Lunara Mode */}
            <AnimatePresence mode="wait">
                {(typeof window !== 'undefined' && window.innerWidth >= 640) && (
                    <motion.div
                        key="lunara-label-container"
                        className="flex items-center gap-2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Moon
                            className={cn(
                                "w-3 h-3 transition-colors duration-500",
                                mode === 'lunara' ? "text-purple-400" : "text-white/20"
                            )}
                            fill={mode === 'lunara' ? "currentColor" : "none"}
                        />
                        <span
                            className={cn(
                                "text-[10px] uppercase tracking-[0.2em] font-bold transition-[color,transform] duration-500 selection:bg-purple-500/40 selection:text-white",
                                mode === 'lunara'
                                    ? "text-purple-100 drop-shadow-[0_0_12px_rgba(168,85,247,0.6)] scale-110"
                                    : "text-white/20 hover:text-white/40"
                            )}
                        >
                            Lunara
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
