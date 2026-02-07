'use client'

import { useState, useEffect } from 'react'
import { Bell, Check, Circle, ExternalLink, Calendar, Heart, Mail, Sparkles, X, Trash2, BellOff, Info, RotateCw, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getUnreadCount, getNotifications, markAsRead, deleteNotification, deleteAllNotifications } from '@/lib/actions/notifications'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { subscribeUserToPush, requestNotificationPermission } from '@/lib/push'
import { toast } from 'sonner'
import { AnnouncementModal } from './announcement-modal'

interface Notification {
    id: string
    title: string
    message: string
    created_at: string
    is_read: boolean
    action_url?: string
    type: 'mood' | 'letter' | 'memory' | 'period_start' | 'ovulation' | 'intimacy' | 'on_this_day' | 'spark' | 'heartbeat'
    metadata?: any
}

export function NotificationBell({ className }: { className?: string }) {
    const [count, setCount] = useState(0)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)
    const [isPushSupported, setIsPushSupported] = useState(false)
    const [pushSubscription, setPushSubscription] = useState<PushSubscription | null>(null)
    const [checkingPush, setCheckingPush] = useState(true)
    const [isIncognito, setIsIncognito] = useState(false)
    const [locationPermission, setLocationPermission] = useState<PermissionState>('prompt')
    const [permission, setPermission] = useState<NotificationPermission>('default')
    const [announcementModalOpen, setAnnouncementModalOpen] = useState(false)
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Notification | null>(null)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const setupRealtime = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            fetchCount()

            // Realtime listener for NEW notifications (badge only)
            const channel = supabase
                .channel('realtime-notifications')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notifications',
                        filter: `recipient_id=eq.${user.id}`
                    },
                    (payload) => {
                        setCount(prev => prev + 1)
                        // Also prepend the new notification if it's open
                        setNotifications(prev => [payload.new as Notification, ...prev])
                    }
                )
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }

        setupRealtime()
        checkPushSubscription()
    }, [])


    const checkPushSubscription = async () => {
        if (typeof window !== 'undefined') {
            setPermission(Notification.permission)

            if ('serviceWorker' in navigator && 'PushManager' in window) {
                setIsPushSupported(true)
                try {
                    const registration = await navigator.serviceWorker.ready
                    const sub = await registration.pushManager.getSubscription()
                    setPushSubscription(sub)
                    if (sub) {
                        await syncSubscription(sub)
                    }
                } catch (e) {
                    console.error('Error checking push sub:', e)
                }
            }
        }
        setCheckingPush(false)

        // Basic check for Incognito
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const { quota } = await navigator.storage.estimate();
            if (quota && quota < 120000000) setIsIncognito(true);
        }

        // Check Location Permission
        if ('permissions' in navigator) {
            try {
                const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
                setLocationPermission(status.state);
                status.onchange = () => setLocationPermission(status.state);
            } catch (e) {
                console.warn("Geolocation permission check failed:", e);
            }
        }
    }


    const handleSubscribe = async () => {
        try {
            const result = await requestNotificationPermission()
            setPermission(result)

            if (result === 'denied') {
                // User explicitly blocked notifications
                toast.error('Notifications blocked. Please enable in browser settings.')
                return
            }

            if (result !== 'granted') {
                // User dismissed the prompt (permission is still 'default')
                // Don't show error, just return silently
                return
            }

            const sub = await subscribeUserToPush()
            setPushSubscription(sub)
            await syncSubscription(sub)
            toast.success('Live notifications enabled!')
        } catch (error) {
            console.error('Push sub error:', error)
            toast.error('Could not enable live notifications')
        }
    }

    const syncSubscription = async (sub: PushSubscription) => {
        const subscriptionJSON = sub.toJSON();
        const res = await fetch('/api/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscriptionJSON),
        })
        return res.ok
    }

    const handleTestPush = async () => {
        try {
            const res = await fetch('/api/test-push', { method: 'POST' })
            if (res.ok) toast.success('Test notification sent!')
            else toast.error('Failed to send test push')
        } catch (e) {
            toast.error('Network error during test push')
        }
    }

    useEffect(() => {
        if (open) {
            fetchNotifications()
        }
    }, [open])

    const fetchCount = async () => {
        const c = await getUnreadCount()
        setCount(c)
    }

    const fetchNotifications = async () => {
        setLoading(true)
        try {
            const data = await getNotifications()
            setNotifications(data as Notification[])
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const handleMarkAsRead = async (id: string, url?: string, notification?: Notification) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
        setCount(prev => Math.max(0, prev - 1))

        await markAsRead(id)

        // Check if this is an announcement/broadcast notification
        if (notification && notification.metadata?.type === 'announcement') {
            setSelectedAnnouncement(notification)
            setAnnouncementModalOpen(true)
            setOpen(false)
        } else if (url) {
            setOpen(false)
            router.push(url)
        }
    }

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        // Optimistic update
        setNotifications(prev => prev.filter(n => n.id !== id))

        // If we deleted an unread one, decrease count
        const wasUnread = notifications.find(n => n.id === id)?.is_read === false
        if (wasUnread) {
            setCount(prev => Math.max(0, prev - 1))
        }

        await deleteNotification(id)
    }

    const handleDeleteAll = async () => {
        setNotifications([])
        setCount(0)
        await deleteAllNotifications()
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'mood': return <Sparkles className="h-4 w-4 text-amber-400" />
            case 'letter': return <Mail className="h-4 w-4 text-rose-400" />
            case 'memory': return <Heart className="h-4 w-4 text-pink-400" />
            case 'period_start':
            case 'ovulation': return <Calendar className="h-4 w-4 text-purple-400" />
            default: return <Bell className="h-4 w-4 text-sky-400" />
        }
    }

    return (
        <>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className={cn("relative text-purple-200/70 hover:text-white hover:bg-purple-500/10 rounded-full h-10 w-10", className)}>
                        <Bell className="h-5 w-5" />
                        {count > 0 && (
                            <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-rose-500 border border-black animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 md:w-96 p-0 border-white/10 bg-[#0f0510]/70 backdrop-blur-[8px] shadow-2xl text-white">
                    <div className="flex items-center justify-between p-4 border-b border-white/5">
                        <div className="flex items-center gap-2">
                            <h4 className="font-serif text-lg font-medium text-purple-100">Notifications</h4>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-white/20 hover:text-white"
                                onClick={(e) => { e.stopPropagation(); fetchNotifications(); fetchCount(); }}
                            >
                                <RotateCw className={cn("h-3 w-3", loading && "animate-spin")} />
                            </Button>
                        </div>
                        {notifications.length > 0 && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-white/40 hover:text-rose-400 hover:bg-rose-500/10"
                                onClick={handleDeleteAll}
                                title="Clear all"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    {/* System Alerts: Location & Notifications */}
                    <div className="flex flex-col">
                        {/* Location Prompt */}
                        {locationPermission !== 'granted' && (
                            <div className={cn(
                                "p-4 border-b transition-colors",
                                locationPermission === 'denied' ? "bg-rose-500/10 border-rose-500/20" : "bg-amber-500/10 border-amber-500/20"
                            )}>
                                <div className="flex gap-3">
                                    <div className="mt-0.5 shrink-0">
                                        <MapPin className={cn("h-4 w-4", locationPermission === 'denied' ? "text-rose-400" : "text-amber-400")} />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className={cn("text-xs font-bold uppercase tracking-tight", locationPermission === 'denied' ? "text-rose-200" : "text-amber-200")}>
                                            {locationPermission === 'denied' ? "Location Access Blocked" : "Enable Location Sharing"}
                                        </p>
                                        <p className={cn("text-[10px] leading-tight", locationPermission === 'denied' ? "text-rose-200/60" : "text-amber-200/60")}>
                                            {locationPermission === 'denied'
                                                ? "Distance tracking is disabled. Please reset location permissions in your browser settings to connect."
                                                : "Share your location to calculate real-time distance and time between you and your partner."}
                                        </p>
                                        {locationPermission !== 'denied' && (
                                            <Button
                                                onClick={() => {
                                                    navigator.geolocation.getCurrentPosition(
                                                        () => setLocationPermission('granted'),
                                                        (error) => {
                                                            if (error.code === error.PERMISSION_DENIED) {
                                                                setLocationPermission('denied')
                                                            }
                                                        }
                                                    )
                                                }}
                                                variant="link"
                                                className="h-auto p-0 text-amber-400 text-[10px] font-black uppercase tracking-widest hover:text-amber-300"
                                            >
                                                Allow Access Now →
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}


                        {/* Notification Prompt - Show ONLY if not fully active */}
                        {!checkingPush && isPushSupported && permission !== 'granted' && (
                            <div className={cn(
                                "p-4 border-b transition-colors",
                                isIncognito || permission === 'denied' ? "bg-red-500/10 border-red-500/20" : "bg-amber-500/20 border-amber-500/20"
                            )}>
                                <div className="flex gap-3">
                                    <div className="mt-0.5 shrink-0">
                                        {isIncognito || permission === 'denied' ? <BellOff className="h-4 w-4 text-red-400" /> : <BellOff className="h-4 w-4 text-amber-400" />}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className={cn("text-xs font-bold uppercase tracking-tight", isIncognito || permission === 'denied' ? "text-red-200" : "text-amber-200")}>
                                            {isIncognito ? "Incognito Detected" : permission === 'denied' ? "Notifications Blocked" : "Enable Live Notifications"}
                                        </p>
                                        <p className={cn("text-[10px] leading-tight", isIncognito || permission === 'denied' ? "text-red-200/60" : "text-amber-200/60")}>
                                            {isIncognito
                                                ? "Live push notifications (popups) are disabled in Private/Incognito mode."
                                                : permission === 'denied'
                                                    ? "You have blocked notifications. Please reset notifications permissions in your browser settings."
                                                    : "Get real-time updates on your phone even when the app is closed."}
                                        </p>
                                        {!isIncognito && permission !== 'denied' && !pushSubscription && (
                                            <Button
                                                onClick={handleSubscribe}
                                                variant="link"
                                                className="h-auto p-0 text-amber-400 text-[10px] font-black uppercase tracking-widest hover:text-amber-300"
                                            >
                                                Enable Now →
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>


                    <ScrollArea className="h-[400px]">
                        {loading && notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 space-y-2">
                                <div className="h-4 w-4 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 space-y-2 text-white/30">
                                <Bell className="h-8 w-8 opacity-20" />
                                <p className="text-xs uppercase tracking-widest font-bold">No new updates</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={cn(
                                            "group relative p-4 hover:bg-purple-500/5 transition-colors cursor-pointer flex gap-4 disabled:opacity-50",
                                            !notification.is_read ? "bg-purple-500/5" : ""
                                        )}
                                        onClick={() => handleMarkAsRead(notification.id, notification.action_url, notification)}
                                    >
                                        <div className="mt-1 p-2 rounded-full bg-white/5 h-8 w-8 flex items-center justify-center shrink-0 border border-white/5">
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 space-y-1 pr-6">
                                            <div className="flex items-start justify-between">
                                                <p className={cn("text-sm font-medium leading-none", !notification.is_read ? "text-white" : "text-white/60")}>
                                                    {notification.title}
                                                </p>
                                                {!notification.is_read && (
                                                    <div className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0 mt-1" />
                                                )}
                                            </div>
                                            <p className="text-xs text-white/50 leading-relaxed line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center gap-2 pt-1">
                                                <span className="text-[10px] text-white/20 font-bold uppercase tracking-wider">
                                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={(e) => handleDelete(e, notification.id)}
                                            className="absolute top-2 right-2 p-2 text-white/40 hover:text-white hover:bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </PopoverContent >
            </Popover >

            <AnnouncementModal
                isOpen={announcementModalOpen}
                onClose={() => {
                    setAnnouncementModalOpen(false)
                    setSelectedAnnouncement(null)
                }}
                notification={selectedAnnouncement}
            />
        </>
    )
}
