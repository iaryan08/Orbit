"use client";



import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import {
    MessageCircle,
    UserPlus,
    Heart as HeartIcon,
    Sparkles as SparklesIcon,
    Flame,
    Moon as MoonIcon,
    Gift,
    Camera,
    Lock,
    Anchor,
    CloudMoon,
    MapPin,
    Film,
    Activity,
    CalendarIcon,
    Unlock,
    Sparkles
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
        q: "What was the first time you discussed intimacy with your partner?",
        icon: <MessageCircle className="w-6 h-6 text-rose-400" />,
        image: "/images/intimacy/first_talk.png"
    },
    {
        id: "first_hug",
        label: "First Hug",
        q: "When did you give your first meaningful hug?",
        icon: <UserPlus className="w-6 h-6 text-orange-400" />,
        image: "/images/intimacy/first_hug_icon.png"
    },
    {
        id: "first_kiss",
        label: "First Kiss",
        q: "How did your first kiss begin?",
        icon: <HeartIcon className="w-6 h-6 text-rose-500" />,
        image: "/images/intimacy/first_kiss.png"
    },
    {
        id: "first_french_kiss",
        label: "First French Kiss",
        q: "Describe the first deep kiss you shared.",
        icon: <Flame className="w-6 h-6 text-red-500" />,
        image: "/images/intimacy/first_kiss_icon.png"
    },
    {
        id: "first_sex",
        label: "First Sex",
        q: "How did your first sexual encounter feel?",
        icon: <SparklesIcon className="w-6 h-6 text-yellow-400" />,
        image: "/images/intimacy/first_sex_icon.png"
    },
    {
        id: "first_oral",
        label: "First Oral Sex",
        q: "What was the first time you performed or received oral sex?",
        icon: <Activity className="w-6 h-6 text-purple-400" />
    },
    {
        id: "first_time_together",
        label: "First Time Together",
        q: "When did you first spend a night together?",
        icon: <MoonIcon className="w-6 h-6 text-indigo-400" />,
        image: "/images/intimacy/together.png"
    },
    {
        id: "first_surprise",
        label: "First Surprise",
        q: "What was the first intimate surprise you gave or received?",
        icon: <Gift className="w-6 h-6 text-pink-400" />
    },
    {
        id: "first_memory",
        label: "First Memory",
        q: "What is your favorite memory from early in your sexual relationship?",
        icon: <Camera className="w-6 h-6 text-blue-400" />
    },
    {
        id: "first_confession",
        label: "First Confession",
        q: "What did you confess to each other about your sexual desires?",
        icon: <Lock className="w-6 h-6 text-amber-500" />,
        image: "/images/intimacy/confession.png"
    },
    {
        id: "first_promise",
        label: "First Promise",
        q: "What promise did you make about future intimacy?",
        icon: <Anchor className="w-6 h-6 text-cyan-400" />
    },
    {
        id: "first_night_together",
        label: "First Night Together",
        q: "How did you feel during your first night apart?",
        icon: <CloudMoon className="w-6 h-6 text-slate-400" />
    },
    {
        id: "first_time_alone",
        label: "First Time Alone",
        q: "When did you first spend a private evening together?",
        icon: <MapPin className="w-6 h-6 text-green-400" />
    },
    {
        id: "first_movie_date",
        label: "First Movie Date",
        q: "How did your first movie date go?",
        icon: <Film className="w-6 h-6 text-red-400" />
    },
    {
        id: "first_intimate_moment",
        label: "First Intimate Moment",
        q: "How did you first express your romantic feelings physically?",
        icon: <HeartIcon className="w-6 h-6 text-rose-600 fill-rose-600/20" />
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
                // Identify partner
                // We need to know who is user1 and user2 to know which column to read/write
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

    // Determine if I am user1 or user2 based on ID comparison to couple.user1_id
    const isUser1 = user && user1Id && user.id === user1Id;
    const myContentField = isUser1 ? "content_user1" : "content_user2";
    const partnerContentField = isUser1 ? "content_user2" : "content_user1";

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
            if (coupleId) fetchMilestones(coupleId); // Refresh local state
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
                        question={q.q}
                        icon={q.icon}
                        image={q.image}
                        milestone={milestones[q.id]}
                        myContentField={myContentField}
                        partnerContentField={partnerContentField}
                        onSave={handleSave}
                    />
                ))}
            </div>
        </div>
    );
}
