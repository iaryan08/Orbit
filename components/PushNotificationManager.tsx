'use client';

import { useState, useEffect } from 'react';
import { subscribeUserToPush, requestNotificationPermission } from '@/lib/push';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, X, Sparkles, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

import { createClient } from '@/lib/supabase/client';

export default function PushNotificationManager() {
    const [isSupported, setIsSupported] = useState(false);
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isVisible, setIsVisible] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [hasUser, setHasUser] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const checkUser = async () => {
                const { data: { user } } = await supabase.auth.getUser();
                setHasUser(!!user);
            };
            checkUser();

            const isPushSupported = 'serviceWorker' in navigator && 'PushManager' in window;
            setIsSupported(isPushSupported);
            setPermission(Notification.permission);

            if (isPushSupported) {
                checkSubscription();
            }

            // Check if user has already denied or dismissed the prompt permanently
            const isDismissed = localStorage.getItem('push-prompt-dismissed');
            if (isDismissed) setDismissed(true);
        }
    }, []);

    useEffect(() => {
        // Show popup ONLY if:
        // 1. Push is supported
        // 2. User is logged in
        // 3. Notifications are NOT enabled (permission !== 'granted' OR no subscription)
        // 4. Not dismissed in this session
        if (isSupported && hasUser) {
            const isEnabled = permission === 'granted' && subscription;

            if (!isEnabled && !dismissed) {
                const timer = setTimeout(() => setIsVisible(true), 3000);
                return () => clearTimeout(timer);
            }
        }
    }, [isSupported, hasUser, permission, subscription, dismissed]);

    async function checkSubscription() {
        try {
            const registration = await navigator.serviceWorker.ready;
            const sub = await registration.pushManager.getSubscription();
            setSubscription(sub);
        } catch (e) {
            console.error('Error checking sub:', e);
        }
    }

    async function handleSubscribe() {
        try {
            const result = await requestNotificationPermission();
            setPermission(result);

            if (result === 'granted') {
                const sub = await subscribeUserToPush();
                setSubscription(sub);
                await saveSubscription(sub);
                toast.success('Notifications enabled for this device!');
                setIsVisible(false);
            } else {
                toast.error('Permission denied. Please enable in browser settings.');
            }
        } catch (error) {
            console.error('Failed to subscribe:', error);
            toast.error('Failed to enable notifications');
        }
    }

    async function saveSubscription(sub: PushSubscription) {
        const res = await fetch('/api/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sub.toJSON()),
        });
        if (!res.ok) throw new Error('Failed to save subscription');
    }

    const handleDismiss = () => {
        setIsVisible(false);
        setDismissed(true);
        // Remember this choice permanently
        localStorage.setItem('push-prompt-dismissed', 'true');
        sessionStorage.setItem('push-prompt-dismissed', 'true');
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <>
                    {/* Blur Background Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[59]"
                        onClick={handleDismiss}
                    />

                    {/* Notification Prompt */}
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed top-24 left-6 right-6 md:top-auto md:bottom-10 md:left-auto md:right-10 md:w-96 z-[60]"
                    >
                        <div className="glass-card-vibrant p-5 border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-rose-500 to-purple-600" />

                            <button
                                onClick={handleDismiss}
                                className="absolute top-3 right-3 text-white/40 hover:text-white transition-colors z-10"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400/20 to-rose-500/20 flex items-center justify-center shrink-0 border border-white/10">
                                    <Bell className="w-6 h-6 text-amber-300 animate-bounce-slow" />
                                </div>
                                <div className="space-y-1 pr-6">
                                    <h3 className="text-sm font-bold text-white flex items-center gap-2 tracking-tight">
                                        Don't miss a heartbeat
                                        <Sparkles className="w-3 h-3 text-amber-400" />
                                    </h3>
                                    <p className="text-[11px] text-white/60 leading-relaxed">
                                        Enable notifications on this device to get real-time love notes and updates from your partner.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5">
                                <Button
                                    onClick={handleSubscribe}
                                    className="w-full btn-rosy h-10 text-[11px] font-black uppercase tracking-widest"
                                >
                                    <ShieldCheck className="w-3.5 h-3.5 mr-2" />
                                    Enable Now
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
