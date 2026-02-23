'use client'

/**
 * useCoupleChannel — ONE shared Supabase channel for all real-time features.
 *
 * Uses a module-level registry so that multiple components calling this hook
 * with the same coupleId share a SINGLE WebSocket connection — not one each.
 *
 * Pauses when the tab goes hidden → 0 CPU / no phone heat when screen is off.
 * Resumes instantly when the user comes back.
 */

import { useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type PresencePayload = { user_id: string; online_at: string }
type VibrateHandler = () => void
type PresenceHandler = (onlineUserIds: string[]) => void

interface ChannelEntry {
    channel: any
    refCount: number
    vibrateHandlers: Set<VibrateHandler>
    presenceHandlers: Set<PresenceHandler>
    userId: string
}

// Module-level singleton registry (survives re-renders, shared across components)
const registry = new Map<string, ChannelEntry>()

function getOnlineIds(entry: ChannelEntry): string[] {
    const state = entry.channel.presenceState()
    const ids: string[] = []
    for (const presences of Object.values(state)) {
        for (const p of presences as PresencePayload[]) {
            if (p.user_id && p.user_id !== entry.userId) ids.push(p.user_id)
        }
    }
    return ids
}

function notifyPresence(entry: ChannelEntry) {
    const ids = getOnlineIds(entry)
    entry.presenceHandlers.forEach(h => h(ids))
}

function createEntry(coupleId: string, userId: string): ChannelEntry {
    const supabase = createClient()
    const ch = supabase.channel(`orbit-${coupleId}`, {
        config: { presence: { key: userId } },
    })

    const entry: ChannelEntry = {
        channel: ch,
        refCount: 0,
        vibrateHandlers: new Set(),
        presenceHandlers: new Set(),
        userId,
    }

    ch
        .on('presence', { event: 'sync' }, () => notifyPresence(entry))
        .on('presence', { event: 'join' }, () => notifyPresence(entry))
        .on('presence', { event: 'leave' }, () => notifyPresence(entry))
        .on('broadcast', { event: 'vibrate' }, () => {
            entry.vibrateHandlers.forEach(h => h())
        })
        .subscribe(async (status: string) => {
            if (status === 'SUBSCRIBED') {
                await ch.track({
                    user_id: userId,
                    online_at: new Date().toISOString(),
                })
            }
        })

    return entry
}

interface UseCoupleChannelOptions {
    coupleId: string
    userId: string
    onVibrate?: VibrateHandler
    onPresenceChange?: PresenceHandler
}

export function useCoupleChannel({ coupleId, userId, onVibrate, onPresenceChange }: UseCoupleChannelOptions) {
    const onVibrateRef = useRef(onVibrate)
    const onPresenceRef = useRef(onPresenceChange)
    onVibrateRef.current = onVibrate
    onPresenceRef.current = onPresenceChange

    // Stable handler wrappers that always call the latest ref
    const stableVibrate = useRef<VibrateHandler>(() => onVibrateRef.current?.())
    const stablePresence = useRef<PresenceHandler>((ids) => onPresenceRef.current?.(ids))

    const sendVibrate = useCallback(async () => {
        const entry = registry.get(coupleId)
        if (entry?.channel) {
            await entry.channel.send({ type: 'broadcast', event: 'vibrate', payload: {} })
        }
    }, [coupleId])

    useEffect(() => {
        if (!coupleId || !userId) return

        // ── Acquire shared channel ────────────────────────────────────
        let entry = registry.get(coupleId)
        if (!entry) {
            entry = createEntry(coupleId, userId)
            registry.set(coupleId, entry)
        }
        entry.refCount++

        if (onVibrate) entry.vibrateHandlers.add(stableVibrate.current)
        if (onPresenceChange) entry.presenceHandlers.add(stablePresence.current)

        // ── Pause / resume on visibility change ───────────────────────
        const supabase = createClient()

        const handleVisibility = () => {
            const e = registry.get(coupleId)
            if (!e) return
            if (document.hidden) {
                supabase.removeChannel(e.channel)
            } else {
                // Recreate & reuse entry (replace channel object)
                const fresh = createEntry(coupleId, userId)
                fresh.refCount = e.refCount
                fresh.vibrateHandlers = e.vibrateHandlers
                fresh.presenceHandlers = e.presenceHandlers
                registry.set(coupleId, fresh)
            }
        }

        document.addEventListener('visibilitychange', handleVisibility)

        return () => {
            document.removeEventListener('visibilitychange', handleVisibility)

            const e = registry.get(coupleId)
            if (!e) return

            e.vibrateHandlers.delete(stableVibrate.current)
            e.presenceHandlers.delete(stablePresence.current)
            e.refCount--

            if (e.refCount <= 0) {
                supabase.removeChannel(e.channel)
                registry.delete(coupleId)
            }
        }
    }, [coupleId, userId]) // eslint-disable-line react-hooks/exhaustive-deps

    return { sendVibrate }
}
