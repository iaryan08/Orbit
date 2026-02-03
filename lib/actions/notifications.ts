'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type NotificationType =
    | 'mood'
    | 'letter'
    | 'memory'
    | 'period_start'
    | 'ovulation'
    | 'intimacy'
    | 'on_this_day'

interface CreateNotificationParams {
    recipientId: string
    actorId?: string // Optional, null if system
    type: NotificationType
    title: string
    message: string
    actionUrl?: string
    metadata?: any
}

/**
 * Sends a notification to a specific user.
 */
export async function sendNotification({
    recipientId,
    actorId,
    type,
    title,
    message,
    actionUrl,
    metadata
}: CreateNotificationParams) {
    const supabase = await createClient()

    // Safety check: Don't notify yourself (unless it's a system test, but usually logic handles this)
    if (actorId && recipientId === actorId) return { success: false, error: "Cannot notify self" }

    try {
        const { error } = await supabase
            .from('notifications')
            .insert({
                recipient_id: recipientId,
                actor_id: actorId || null, // null means 'System' or 'Lunara'
                type,
                title,
                message,
                action_url: actionUrl,
                metadata: metadata || {}
            })

        if (error) throw error

        return { success: true }
    } catch (error: any) {
        console.error("[Notification] Failed to send:", error)
        return { success: false, error: error.message }
    }
}

/**
 * Fetches recent notifications for the current user.
 */
export async function getNotifications(limit: number = 20) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)

    return data || []
}

/**
 * Gets the count of unread notifications.
 */
export async function getUnreadCount() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return 0

    const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('is_read', false)

    return count || 0
}

/**
 * Marks a single notification (or all) as read.
 */
export async function markAsRead(notificationId?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    if (notificationId) {
        // Mark specific
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId)
            .eq('recipient_id', user.id)
    } else {
        // Mark all
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('recipient_id', user.id)
            .eq('is_read', false)
    }

    revalidatePath('/dashboard')
    return { success: true }
}

/**
 * Deletes a single notification.
 */
export async function deleteNotification(notificationId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('recipient_id', user.id)

    if (error) {
        console.error("Failed to delete notification:", error)
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard')
    return { success: true }
}

/**
 * Deletes all notifications for the current user.
 */
export async function deleteAllNotifications() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('recipient_id', user.id)

    if (error) {
        console.error("Failed to clear notifications:", error)
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard')
    return { success: true }
}
