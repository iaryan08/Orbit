'use client';

import { useState, useEffect } from 'react';
import { subscribeUserToPush, requestNotificationPermission } from '@/lib/push';
import { Button } from '@/components/ui/button';
import { Bell, BellOff } from 'lucide-react';
import { toast } from 'sonner';

export default function PushNotificationManager() {
    const [isSupported, setIsSupported] = useState(false);
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            registerServiceWorker();
        }
    }, []);

    async function registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/',
                updateViaCache: 'none',
            });
            const sub = await registration.pushManager.getSubscription();
            setSubscription(sub);
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    }

    async function handleSubscribe() {
        try {
            await requestNotificationPermission();
            const sub = await subscribeUserToPush();
            setSubscription(sub);

            // TODO: Send subscription to backend
            await saveSubscription(sub);

            toast.success('Notifications enabled!');
        } catch (error) {
            console.error('Failed to subscribe:', error);
            toast.error('Failed to enable notifications');
        }
    }

    async function saveSubscription(sub: PushSubscription) {
        const res = await fetch('/api/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(sub),
        });
        if (!res.ok) throw new Error('Failed to save subscription');
    }

    return null;
}
