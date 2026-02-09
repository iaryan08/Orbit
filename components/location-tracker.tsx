'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, ShieldAlert, X } from 'lucide-react'

export function LocationTracker() {
    const [permissionStatus, setPermissionStatus] = useState<PermissionState | 'unsupported'>('prompt')
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                setIsVisible(false)
            }, 5000)
            return () => clearTimeout(timer)
        }
    }, [isVisible])

    useEffect(() => {
        if (!navigator.permissions || !navigator.permissions.query) return

        const checkPermission = async () => {
            try {
                const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName })
                setPermissionStatus(result.state)
                setIsVisible(result.state === 'denied')

                result.onchange = () => {
                    setPermissionStatus(result.state)
                    setIsVisible(result.state === 'denied')
                }
            } catch (e) {
                console.error('Permission check error:', e)
            }
        }

        checkPermission()
    }, [])

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] w-full max-w-md px-4"
                >
                    <div className="bg-rose-500/10 backdrop-blur-xl border border-rose-500/20 rounded-2xl p-4 flex items-center gap-4 shadow-2xl shadow-rose-950/20">
                        <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center flex-shrink-0">
                            <ShieldAlert className="w-5 h-5 text-rose-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-300 mb-0.5">
                                GPS Permission Denied
                            </p>
                            <p className="text-xs text-rose-100/60 leading-relaxed">
                                Please enable location to see each other's distance & local weather.
                            </p>
                        </div>
                        <button
                            onClick={() => setIsVisible(false)}
                            className="p-2 hover:bg-white/5 rounded-full transition-colors text-rose-100/20 hover:text-rose-100"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
