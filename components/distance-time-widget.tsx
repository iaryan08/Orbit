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

                let city = undefined
                try {
                    const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`, {
                        headers: { 'User-Agent': 'MoonBetweenUs/1.0' }
                    })
                    const geoData = await geoRes.json()
                    city = geoData.address.city || geoData.address.town || geoData.address.village || geoData.address.suburb
                } catch (e) {
                    console.error('Reverse geocoding error:', e)
                }

                await updateLocation({
                    latitude,
                    longitude,
                    timezone,
                    city
                })

                setUpdating(false)
            },
            (error) => {
                setUpdating(false)
                if (error.code === error.PERMISSION_DENIED) {
                    setIsBlocked(true)
                }
                console.error(error)
            },
            { enableHighAccuracy: true, timeout: 5000 }
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
        <div className="glass-card p-5 relative overflow-hidden group">
            {/* Background Map Decoration */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute right-0 bottom-0 text-white/5 transform translate-x-1/3 translate-y-1/3">
                    <Globe className="w-32 h-32" />
                </div>
            </div>

            <div className="relative z-10 flex flex-col gap-4">
                <div className="flex items-center justify-between">
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

                    {/* Modern Overlay for missing/blocked location */}
                    {(!hasUserLoc || isBlocked) && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute inset-0 z-30 bg-rose-950/20 backdrop-blur-xl flex flex-col items-center justify-center p-6 rounded-[inherit] border border-rose-500/10"
                        >
                            <MapPin className="w-6 h-6 text-rose-400/50 mb-3 animate-pulse" />
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-rose-100/40 mb-4 text-center">
                                {isBlocked ? "GPS Permission Required" : "Location Sync Needed"}
                            </p>
                            <button
                                onClick={handleUpdateLocation}
                                disabled={updating}
                                className="px-8 py-2.5 bg-rose-500/20 hover:bg-rose-500/40 text-rose-100 border border-rose-500/30 rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                {updating ? 'Syncing...' : (isBlocked ? 'Fix Permission' : 'Enable Always')}
                            </button>
                        </motion.div>
                    )}

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
                                    <span className="text-xs font-bold text-indigo-200 bg-indigo-950/40 px-2 py-0.5 rounded-full -mt-2.5 z-10 border border-indigo-500/30">
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
    )
}
