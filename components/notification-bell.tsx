'use client'

import { useState, useEffect } from 'react'
import { Bell, Check, Circle, ExternalLink, Calendar, Heart, Mail, Sparkles, X, Trash2 } from 'lucide-react'
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

interface Notification {
    id: string
    title: string
    message: string
    created_at: string
    is_read: boolean
    action_url?: string
    type: 'mood' | 'letter' | 'memory' | 'period_start' | 'ovulation' | 'intimacy' | 'on_this_day'
}

export function NotificationBell({ className }: { className?: string }) {
    const [count, setCount] = useState(0)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)
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
                    }
                )
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }

        setupRealtime()
    }, [])

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

    const handleMarkAsRead = async (id: string, url?: string) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
        setCount(prev => Math.max(0, prev - 1))

        await markAsRead(id)

        if (url) {
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
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className={cn("relative text-purple-200/70 hover:text-white hover:bg-purple-500/10 rounded-full h-10 w-10", className)}>
                    <Bell className="h-5 w-5" />
                    {count > 0 && (
                        <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-rose-500 border border-black animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 md:w-96 p-0 border-white/10 bg-[#0f0510]/95 backdrop-blur-xl shadow-2xl text-white">
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                    <h4 className="font-serif text-lg font-medium text-purple-100">Notifications</h4>
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
                                    onClick={() => handleMarkAsRead(notification.id, notification.action_url)}
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
                                        className="absolute top-2 right-2 p-1 text-white/20 hover:text-white hover:bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    )
}
