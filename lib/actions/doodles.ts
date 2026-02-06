"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveDoodle(path: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { data: profile } = await supabase
        .from("profiles")
        .select("couple_id")
        .eq("id", user.id)
        .single();

    if (!profile?.couple_id) return { error: "No couple linked" };

    const { error } = await supabase
        .from("doodles")
        .upsert({
            couple_id: profile.couple_id,
            user_id: user.id,
            path_data: path,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'couple_id'
        });

    if (error) return { error: error.message };

    revalidatePath("/dashboard");
    return { success: true };
}

export async function getDoodle() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
        .from("profiles")
        .select("couple_id")
        .eq("id", user.id)
        .single();

    if (!profile?.couple_id) return null;

    const { data: doodle } = await supabase
        .from("doodles")
        .select("*")
        .eq("couple_id", profile.couple_id)
        .single();

    return doodle;
}
