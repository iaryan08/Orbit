"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface RealtimeObserverProps {
    coupleId: string | null;
    partnerId: string | null;
}

export function RealtimeObserver({ coupleId, partnerId }: RealtimeObserverProps) {
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        if (!coupleId) return;

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

        return () => {
            supabase.removeChannel(channel);
        };
    }, [coupleId, partnerId, router, supabase]);

    return null;
}
