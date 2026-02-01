"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface RealtimeObserverProps {
    coupleId: string | null;
}

export function RealtimeObserver({ coupleId }: RealtimeObserverProps) {
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        if (!coupleId) return;

        let cleanupFn: (() => void) | undefined;

        const setup = async () => {
            // Get partner ID to listen for their mood specifically
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: couple } = await supabase
                .from("couples")
                .select("user1_id, user2_id")
                .eq("id", coupleId)
                .single();

            if (!couple) return;
            const partnerId = couple.user1_id === user.id ? couple.user2_id : couple.user1_id;

            // Listen for changes in critical tables for this couple
            const channel = supabase
                .channel(`couple-${coupleId}`)
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "public",
                        table: "moods",
                        filter: partnerId ? `user_id=eq.${partnerId}` : undefined,
                    },
                    () => {
                        router.refresh();
                    }
                )
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "public",
                        table: "love_letters",
                        filter: `couple_id=eq.${coupleId}`,
                    },
                    () => {
                        router.refresh();
                    }
                )
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "public",
                        table: "memories",
                        filter: `couple_id=eq.${coupleId}`,
                    },
                    () => {
                        router.refresh();
                    }
                )
                .on(
                    "postgres_changes",
                    {
                        event: "UPDATE",
                        schema: "public",
                        table: "couples",
                        filter: `id=eq.${coupleId}`,
                    },
                    () => {
                        router.refresh();
                    }
                )
                .subscribe();

            cleanupFn = () => {
                supabase.removeChannel(channel);
            };
        };

        setup();
        return () => {
            if (cleanupFn) cleanupFn();
        };
    }, [coupleId, router, supabase]);

    return null;
}
