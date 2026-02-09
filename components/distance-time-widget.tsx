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
    return R * c; // Distance in km
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
}

function formatRelativeTime(dateString: string, now: Date) {
    if (!dateString) return null;
    try {
        const date = new Date(dateString);
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 30) return 'just now';

        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;

        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
    } catch (e) {
        return null;
    }
}

export function DistanceTimeWidget({ userProfile, partnerProfile }: DistanceWidgetProps) {
    const [updating, setUpdating] = useState(false)
    const { toast } = useToast()
    const [currentTime, setCurrentTime] = useState(new Date())
    const [isBlocked, setIsBlocked] = useState(false)

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 10000)

        // Auto-fetch location on mount
        handleUpdateLocation()

        return () => clearInterval(timer)
    }, [])

    const handleUpdateLocation = () => {
        if (!navigator.geolocation) {
            console.error("Geolocation is not supported by your browser");
            return
        }

        setUpdating(true)
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                console.log("[Geolocation] Success:", position.coords.latitude, position.coords.longitude);
                setIsBlocked(false)
                const { latitude, longitude } = position.coords

                await updateLocation({
                    latitude,
                    longitude
                })

                setUpdating(false)
            },
            async (error) => {
                console.warn("[Geolocation] Failed:", error.code, error.message);
                setUpdating(false)
                // Added IP lookup when GPS is denied/unavailable
                await updateLocation({});

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

    const hasUserLoc = (userProfile?.latitude !== undefined && userProfile?.latitude !== null) &&
        (userProfile?.longitude !== undefined && userProfile?.longitude !== null)
    const hasPartnerLoc = (partnerProfile?.latitude !== undefined && partnerProfile?.latitude !== null) &&
        (partnerProfile?.longitude !== undefined && partnerProfile?.longitude !== null)

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
                    <div className="flex items-center gap-2">
                        {updating ? (
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-1 rounded-full bg-rose-400 animate-pulse" />
                                <span className="text-[10px] text-rose-300/40 font-bold uppercase tracking-widest">Syncing</span>
                            </div>
                        ) : (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleUpdateLocation()
                                }}
                                className="p-1 rounded-full hover:bg-white/5 text-white/20 hover:text-rose-300/60 transition-colors"
                                title="Force Sync Location"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className={cn(updating && "animate-spin")}
                                >
                                    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                                    <path d="M21 3v5h-5" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 flex flex-col justify-center">
                    <div className="flex items-center justify-between gap-4">
                        {/* User */}
                        <div className="text-left relative z-10">
                            <div className="text-2xl font-bold text-white leading-none">
                                {formatTime(userProfile?.timezone || 'UTC')}
                            </div>
                            <div className="text-xs text-white/40 font-medium mt-1 flex flex-col gap-0.5">
                                <div className="flex items-center gap-1">
                                    <span className="leading-tight">{userProfile?.city || 'Your Time'}</span>
                                    {userProfile?.location_source === 'ip' && <span className="text-[10px] text-rose-400 font-bold shrink-0">(IP)</span>}
                                </div>
                                <span className="hidden md:inline opacity-30 text-[10px] shrink-0 -mt-0.5">{userProfile?.timezone}</span>
                                {hasUserLoc && (
                                    <span className="text-[9px] opacity-40 uppercase tracking-tighter">
                                        Seen {formatRelativeTime(userProfile.updated_at, currentTime)}
                                    </span>
                                )}
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
                            <div className="text-xs text-white/40 font-medium mt-1 flex flex-col items-end gap-0.5">
                                <div className="flex items-center gap-1 flex-row-reverse">
                                    <span className="leading-tight text-right">{partnerProfile?.city || (partnerProfile?.display_name || 'Partner')}</span>
                                    {partnerProfile?.location_source === 'ip' && <span className="text-[10px] text-rose-400 font-bold shrink-0">(IP)</span>}
                                </div>
                                <span className="hidden md:inline opacity-30 text-[10px] shrink-0 -mt-0.5 text-right">{partnerProfile?.timezone}</span>
                                {hasPartnerLoc && (
                                    <span className="text-[9px] opacity-40 uppercase tracking-tighter text-right">
                                        Seen {formatRelativeTime(partnerProfile.updated_at, currentTime)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
