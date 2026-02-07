'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Clock, Navigation, Globe } from 'lucide-react'
import { updateLocation } from '@/lib/actions/auth'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface LocationData {
    latitude: number;
    longitude: number;
    city?: string;
    timezone?: string;
}

interface DistanceWidgetProps {
    userProfile: any;
    partnerProfile: any;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
}

export function DistanceTimeWidget({ userProfile, partnerProfile }: DistanceWidgetProps) {
    const [updating, setUpdating] = useState(false)
    const { toast } = useToast()
    const [currentTime, setCurrentTime] = useState(new Date())
    const [isBlocked, setIsBlocked] = useState(false)

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000)

        // Auto-fetch location on mount
        handleUpdateLocation()

        return () => clearInterval(timer)
    }, [])

    const handleUpdateLocation = () => {
        if (!navigator.geolocation) {
            toast({ title: "Error", description: "Geolocation is not supported by your browser", variant: "destructive" })
            return
        }

        setUpdating(true)
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                setIsBlocked(false)
                const { latitude, longitude } = position.coords
                const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

                await updateLocation({
                    latitude,
                    longitude,
                    timezone
                })

                setUpdating(false)
            },
            (error) => {
                setUpdating(false)
                let msg = "Geolocation error"
                if (error.code === error.PERMISSION_DENIED) {
                    setIsBlocked(true)
                    msg = "Geolocation permission denied"
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    msg = "Geolocation position unavailable"
                } else if (error.code === error.TIMEOUT) {
                    msg = "Geolocation request timed out"
                }
                console.warn(`${msg}:`, error.message)
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        )
    }

    const formatTime = (timezone: string) => {
        try {
            return new Date().toLocaleTimeString('en-US', {
                timeZone: timezone,
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            })
        } catch (e) {
            return '--:--'
        }
    }

    const hasUserLoc = userProfile?.latitude && userProfile?.longitude
    const hasPartnerLoc = partnerProfile?.latitude && partnerProfile?.longitude

    const distance: string | null = (hasUserLoc && hasPartnerLoc)
        ? calculateDistance(userProfile.latitude, userProfile.longitude, partnerProfile.latitude, partnerProfile.longitude).toFixed(0)
        : null

    const areClose = distance && parseInt(distance) < 5 // Consider < 5km as "Together"

    return (
        <div className="glass-card p-5 relative overflow-hidden group h-full flex flex-col justify-between">
            {/* Background Map Decoration */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute right-0 bottom-0 text-white/5 transform translate-x-1/3 translate-y-1/3">
                    <Globe className="w-32 h-32" />
                </div>
            </div>

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white/80 font-serif font-medium flex items-center gap-2 text-sm italic opacity-60">
                        <Navigation className="w-3.5 h-3.5 text-rose-300" />
                        Connection
                    </h3>
                    {updating && (
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-rose-400 animate-pulse" />
                            <span className="text-[10px] text-rose-300/40 font-bold uppercase tracking-widest">Syncing</span>
                        </div>
                    )}
                </div>

                <div className="flex-1 flex flex-col justify-center">
                    <div className="flex items-center justify-between gap-4">
                        {/* User */}
                        <div className="text-left relative z-10">
                            <div className="text-2xl font-bold text-white leading-none">
                                {formatTime(userProfile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone)}
                            </div>
                            <div className="text-xs text-white/40 font-medium mt-1 flex items-center gap-1">
                                {userProfile?.city || 'Your Time'}
                            </div>
                        </div>


                        {/* Center Graph */}
                        <div className="flex-1 flex flex-col items-center justify-center relative h-full min-h-[40px]">
                            {hasUserLoc && hasPartnerLoc ? (
                                areClose ? (
                                    <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20 animate-pulse">
                                        Together
                                    </span>
                                ) : (
                                    <>
                                        <div className="w-full h-px bg-indigo-500/20 relative">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent w-full h-full" />
                                        </div>
                                        <span className="text-xs font-bold text-indigo-200 bg-indigo-950/40 px-4 py-0.5 rounded-full -mt-2.5 z-10 border border-indigo-500/30 whitespace-nowrap">
                                            {distance} km
                                        </span>
                                    </>
                                )
                            ) : (
                                <span className="text-[10px] text-white/20 italic text-center">
                                    {!hasUserLoc ? "Update your location" : "Waiting for partner"}
                                </span>
                            )}
                        </div>

                        {/* Partner */}
                        <div className="text-right">
                            <div className="text-2xl font-bold text-white/90 leading-none">
                                {partnerProfile?.timezone ? formatTime(partnerProfile.timezone) : '--:--'}
                            </div>
                            <div className="text-xs text-white/40 font-medium mt-1 flex items-center justify-end gap-1">
                                {partnerProfile?.city || (partnerProfile?.display_name || 'Partner')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
