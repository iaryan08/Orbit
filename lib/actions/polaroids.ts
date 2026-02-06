"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getLatestPolaroid() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
        .from("profiles")
        .select("couple_id")
        .eq("id", user.id)
        .single();

    if (!profile?.couple_id) return null;

    const { data: polaroid } = await supabase
        .from("polaroids")
        .select("*")
        .eq("couple_id", profile.couple_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

    return polaroid;
}

export async function getDashboardPolaroids() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { userPolaroid: null, partnerPolaroid: null };

    const { data: profile } = await supabase
        .from("profiles")
        .select("couple_id")
        .eq("id", user.id)
        .single();

    if (!profile?.couple_id) return { userPolaroid: null, partnerPolaroid: null };

    const { data: couple } = await supabase
        .from("couples")
        .select("user1_id, user2_id")
        .eq("id", profile.couple_id)
        .single();

    if (!couple) return { userPolaroid: null, partnerPolaroid: null };

    const partnerId = couple.user1_id === user.id ? couple.user2_id : couple.user1_id;

    const [userRes, partnerRes] = await Promise.all([
        supabase
            .from("polaroids")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        partnerId ? supabase
            .from("polaroids")
            .select("*")
            .eq("user_id", partnerId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle() : Promise.resolve({ data: null })
    ]);

    return {
        userPolaroid: userRes.data,
        partnerPolaroid: partnerRes.data
    };
}

export async function deletePolaroid(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase
        .from("polaroids")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) return { error: error.message };

    revalidatePath("/dashboard");
    return { success: true };
}
