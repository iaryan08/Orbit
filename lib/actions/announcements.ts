'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { sendPushNotification } from '@/lib/push-server'

/**
 * Broadcasts a notification to ALL users in the database.
 * Use this sparingly for major feature updates.
 */
export async function broadcastUpdateNotification() {
    const supabase = await createAdminClient()

    // 1. Get all users
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, display_name')

    if (error) {
        console.error("Failed to fetch profiles for broadcast:", error)
        return { success: false, error: "Database error" }
    }

    const title = "The Visionary Update is Here! 📸"
    const message = "We've overhauled how you see your memories in Orbit:\n\n" +
        "• 📸 Visionary View: Tap any image to explode it into a stunning in-app full-screen mode.\n" +
        "• ⚡ Blazing Speed: Intelligent lazy loading makes your memory lane faster than ever.\n" +
        "• 📱 Mobile Perfect: New responsive controls that only appear when you need them.\n" +
        "• 🎯 Context First: Always view the story behind the photo before diving into high-res.\n\n" +
        "Tap to check it out!"

    let sentCount = 0
    let pushCount = 0

    // 2. Insert into notifications table for everyone
    // Note: Doing this in a loop might be slow for many users, but fine for now.
    for (const profile of profiles) {
        try {
            // Internal DB Notification
            const { error: notifyError } = await supabase
                .from('notifications')
                .insert({
                    recipient_id: profile.id,
                    type: 'spark', // closest type or system
                    title,
                    message,
                    action_url: '/dashboard',
                    metadata: { type: 'announcement' }
                })

            if (!notifyError) sentCount++

            // Push Notification
            const pushResult = await sendPushNotification(profile.id, title, "Tap to see what's new in your shared world! ❤️", '/dashboard')
            if (pushResult.success) pushCount += (pushResult.sent || 0)

        } catch (e) {
            console.warn(`Failed to notify user ${profile.id}:`, e)
        }
    }

    return {
        success: true,
        totalUsers: profiles.length,
        dbNotificationsSent: sentCount,
        pushNotificationsSent: pushCount
    }
}
