"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import {
    MessageSquareHeart,
    HandHeart,
    Heart as HeartIcon,
    Flame,
    Moon as MoonIcon,
    Gift,
    Camera,
    Infinity as InfinityIcon,
    CloudMoon,
    Home,
    Film,
    HeartPulse,
    Waves,
    CalendarIcon,
    Unlock,
    Sparkles,
    BedDouble
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { MilestoneCard } from "@/components/intimacy/milestone-card";
import { logIntimacyMilestone } from "@/lib/actions/intimacy";

const questions = [
    {
        id: "first_talk",
        label: "First Talk",
        q: "What was the first time you talked with {{partner}}?",
        icon: <MessageSquareHeart className="w-6 h-6 text-rose-400" />,
        image: "/images/intimacy/first_talk.webp"
    },
    {
        id: "first_hug",
        label: "First Hug",
        q: "When did you give {{partner}} your first meaningful hug?",
        icon: <HandHeart className="w-6 h-6 text-orange-400" />,
        image: "/images/intimacy/first_hug_icon.webp"
    },
    {
        id: "first_kiss",
        label: "First Kiss",
        q: "How did your first kiss with {{partner}} begin?",
        icon: <HeartIcon className="w-6 h-6 text-rose-500" />,
        image: "/images/intimacy/first_kiss.webp"
    },
    {
        id: "first_french_kiss",
        label: "First French Kiss",
        q: "Describe the first deep kiss you shared with {{partner}}.",
        icon: <Flame className="w-6 h-6 text-red-500" />,
        image: "/images/intimacy/first_kiss_icon.webp"
    },
    {
        id: "first_sex",
        label: "First Sex",
        q: "How did your first sexual encounter with {{partner}} feel?",
        icon: <BedDouble className="w-6 h-6 text-amber-500" />,
        image: "/images/intimacy/first_sex_icon.webp"
    },
    {
        id: "first_oral",
        label: "First Oral Sex",
        q: "What was the first time you performed or received oral sex with {{partner}}?",
        icon: <Waves className="w-6 h-6 text-purple-400" />,
        image: "/images/intimacy/first_oral.webp"
    },
    {
        id: "first_time_together",
        label: "First Bedtime Together",
        q: "When did you first bedtime with {{partner}}?",
        icon: <MoonIcon className="w-6 h-6 text-indigo-400" />,
        image: "/images/intimacy/together.webp"
    },
    {
        id: "first_surprise",
        label: "First Surprise",
        q: "What was the first intimate surprise you shared with {{partner}}?",
        icon: <Gift className="w-6 h-6 text-pink-400" />,
        image: "/images/intimacy/first_surprise.webp"
    },
    {
        id: "first_memory",
        label: "First Memory",
        q: "What is your favorite memory from early in your sexual relationship with {{partner}}?",
        icon: <Camera className="w-6 h-6 text-blue-400" />,
        image: "/images/intimacy/first_memory.webp"
    },
    {
        id: "first_confession",
        label: "First Confession",
        q: "What did you confess to {{partner}} about your sexual desires?",
        icon: <Unlock className="w-6 h-6 text-amber-500" />,
        image: "/images/intimacy/confession.webp"
    },
    {
        id: "first_promise",
        label: "First Promise",
        q: "What promise did you make to {{partner}} about future intimacy?",
        icon: <InfinityIcon className="w-6 h-6 text-cyan-400" />,
        image: "/images/intimacy/first_promise.webp"
    },
    {
        id: "first_night_together",
        label: "First Night Apart",
        q: "How did you feel during your first night apart from {{partner}}?",
        icon: <CloudMoon className="w-6 h-6 text-slate-400" />,
        image: "/images/intimacy/first_night_apart.webp"
    },
    {
        id: "first_time_alone",
        label: "First Time Alone",
        q: "When did you first spend a private evening with {{partner}}?",
        icon: <Home className="w-6 h-6 text-green-400" />
    },
    {
        id: "first_movie_date",
        label: "First Movie Date",
        q: "How did your first movie date with {{partner}} go?",
        icon: <Film className="w-6 h-6 text-red-400" />
    },
    {
        id: "first_intimate_moment",
        label: "First Intimate Moment",
        q: "How did you first express your romantic feelings physically to {{partner}}?",
        icon: <HeartPulse className="w-6 h-6 text-rose-600" />
    },
];

export default function IntimacyPage() {
    const [milestones, setMilestones] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [partner, setPartner] = useState<any>(null);
    const [coupleId, setCoupleId] = useState<string | null>(null);
    const [user1Id, setUser1Id] = useState<string | null>(null);
    const [activeQuestion, setActiveQuestion] = useState<string | null>(null);

    const supabase = createClient();
    const { toast } = useToast();

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUser(user);

        const { data: profile } = await supabase.from("profiles").select("couple_id").eq("id", user.id).single();
        if (profile?.couple_id) {
            setCoupleId(profile.couple_id);
            const { data: couple } = await supabase.from("couples").select("*").eq("id", profile.couple_id).single();
            if (couple) {
                setUser1Id(couple.user1_id);
                // Fetch partner profile
                const partnerId = couple.user1_id === user.id ? couple.user2_id : couple.user1_id;
                if (partnerId) {
                    const { data: partnerProfile } = await supabase.from("profiles").select("display_name").eq("id", partnerId).single();
                    if (partnerProfile) {
                        setPartner(partnerProfile);
                    }
                }
            }
            await fetchMilestones(profile.couple_id);
            subscribe(profile.couple_id);
        }
        setLoading(false);
    };

    const fetchMilestones = async (cid: string) => {
        const { data } = await supabase.from("milestones").select("*").eq("couple_id", cid);
        if (data) {
            const map: Record<string, any> = {};
            data.forEach((m: any) => map[m.category] = m);
            setMilestones(map);
        }
    };

    const subscribe = (cid: string) => {
        supabase.channel("milestones-realtime")
            .on("postgres_changes", { event: "*", schema: "public", table: "milestones", filter: `couple_id=eq.${cid}` },
                (payload) => {
                    fetchMilestones(cid);
                })
            .subscribe();
    };

    const isUser1 = user && user1Id && user.id === user1Id;
    const myContentField = isUser1 ? "content_user1" : "content_user2";
    const partnerContentField = isUser1 ? "content_user2" : "content_user1";
    const myDateField = isUser1 ? "date_user1" : "date_user2";
    const partnerDateField = isUser1 ? "date_user2" : "date_user1";

    const handleSave = async (category: string, date: Date | undefined, myContent: string) => {
        const payload = {
            category,
            content: myContent,
            date: date ? format(date, "yyyy-MM-dd") : undefined
        }

        const res = await logIntimacyMilestone(payload)

        if (res.error) {
            toast({ title: "Error", description: res.error, variant: "destructive" });
        } else {
            toast({ title: "Saved", description: "Your memory has been recorded.", variant: "default" });
            setActiveQuestion(null);
            if (coupleId) fetchMilestones(coupleId);
        }
    };

    const { scrollY } = useScroll();
    const opacity = useTransform(scrollY, [0, 50], [1, 0]);

    if (loading) return <div className="p-10 text-center text-rose-200">Loading intimacy mode...</div>;

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8 pb-20 pt-24">
            <div className="flex items-center justify-start gap-3 z-10">
                <Flame className="h-6 w-6 text-rose-500 drop-shadow-[0_0_10px_rgba(251,113,133,0.8)]" />
                <h1 className="text-2xl md:text-5xl font-serif font-bold text-rose-100 flex items-center gap-3">
                    Intimacy Mode
                </h1>
                <p className="text-rose-200/60 max-w-lg hidden md:block">
                    Rediscover your first moments together. Share your perspectives and lock them in forever.
                </p>
            </div>

            <div className="grid gap-6">
                {questions.map((q) => (
                    <MilestoneCard
                        key={q.id}
                        id={q.id}
                        label={q.label}
                        question={q.q.replace("{{partner}}", partner?.display_name || "your partner")}
                        partnerName={partner?.display_name || "Partner"}
                        icon={q.icon}
                        image={q.image}
                        milestone={milestones[q.id]}
                        myContentField={myContentField}
                        partnerContentField={partnerContentField}
                        myDateField={myDateField}
                        partnerDateField={partnerDateField}
                        isOpen={activeQuestion === q.id}
                        onToggle={() => setActiveQuestion(activeQuestion === q.id ? null : q.id)}
                        onSave={handleSave}
                    />
                ))}
            </div>
        </div>
    );
}
