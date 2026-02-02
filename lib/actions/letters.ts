'use server'

import { createClient } from '@/lib/supabase/server'
import { sendNotification } from '@/lib/actions/notifications'
import { revalidatePath } from 'next/cache'

export async function openLetter(letterId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Unauthorized" }

    try {
        // 1. Mark as read
        const now = new Date().toISOString()
        const { data: letter, error } = await supabase
            .from('love_letters')
            .update({
                is_read: true,
                read_at: now
            })
            .eq('id', letterId)
            .eq('receiver_id', user.id) // Security check
            .select()
            .single()

        if (error) throw error
        if (!letter) return { error: "Letter not found" }

        // 2. Notify Sender
        // Fetch sender name? We have sender_id. Notification system handles recipient.

        await sendNotification({
            recipientId: letter.sender_id,
            actorId: user.id,
            type: 'letter',
            title: 'Letter Opened',
            message: 'Your partner just opened your love letter.',
            actionUrl: '/dashboard/letters',
            metadata: { letter_id: letterId }
        })

        revalidatePath('/dashboard/letters')
        return { success: true, read_at: now }
    } catch (e: any) {
        console.error("Error opening letter:", e)
    }
}

export async function sendLetter(payload: {
    title: string;
    content: string;
    unlock_date: string | null;
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Unauthorized" }

    // Get profile to find couple
    const { data: profile } = await supabase
        .from('profiles')
        .select('couple_id, display_name')
        .eq('id', user.id)
        .single()

    if (!profile?.couple_id) return { error: "No couple found" }

    // Get partner ID
    const { data: couple } = await supabase
        .from('couples')
        .select('user1_id, user2_id')
        .eq('id', profile.couple_id)
        .single()

    if (!couple) return { error: "Couple data error" }

    const partnerId = couple.user1_id === user.id ? couple.user2_id : couple.user1_id

    if (!partnerId) return { error: "Partner not found" }

    // Insert Letter
    const { data: letter, error } = await supabase
        .from('love_letters')
        .insert({
            couple_id: profile.couple_id,
            sender_id: user.id,
            receiver_id: partnerId,
            title: payload.title,
            content: payload.content,
            unlock_date: payload.unlock_date || null,
            unlock_type: payload.unlock_date ? 'custom' : 'immediate'
        })
        .select()
        .single()

    if (error) return { error: error.message }

    // Notify Partner
    await sendNotification({
        recipientId: partnerId,
        actorId: user.id,
        type: 'letter',
        title: 'New Love Letter',
        message: `${profile.display_name || 'Your partner'} sent you a love letter.`,
        actionUrl: '/dashboard/letters',
        metadata: { letter_id: letter.id }
    })

    revalidatePath('/dashboard/letters')
    return { success: true }
}

export async function updateLetter(letterId: string, payload: {
    title: string;
    content: string;
    unlock_date: string | null;
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Unauthorized" }

    const { error } = await supabase
        .from('love_letters')
        .update({
            title: payload.title,
            content: payload.content,
            unlock_date: payload.unlock_date || null,
            unlock_type: payload.unlock_date ? 'custom' : 'immediate'
        })
        .eq('id', letterId)
        .eq('sender_id', user.id) // Security check

    if (error) return { error: error.message }

    revalidatePath('/dashboard/letters')
    return { success: true }
}
