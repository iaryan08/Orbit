"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Heart, Plus, Calendar, Lock, Sparkles, Send, Mail, MailOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { openLetter, sendLetter as sendLetterAction, updateLetter } from "@/lib/actions/letters";
import { markAsViewed, refreshDashboard } from "@/lib/actions/auth";
import { getTodayIST } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Edit2 } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";

interface LoveLetter {
    id: string;
    title: string;
    content: string;
    sender_id: string;
    receiver_id: string;
    unlock_date: string | null;
    is_read: boolean;
    read_at?: string; // Added field
    created_at: string;
    sender_name?: string;
}

export default function LettersPage() {
    const router = useRouter();
    const [letters, setLetters] = useState<LoveLetter[]>([]);
    const [loading, setLoading] = useState(true);
    const [isWriting, setIsWriting] = useState(false);
    const [selectedLetter, setSelectedLetter] = useState<LoveLetter | null>(null);
    const [newLetter, setNewLetter] = useState({
        title: "",
        content: "",
        unlock_date: "",
    });
    const [generating, setGenerating] = useState(false);
    const [editingLetter, setEditingLetter] = useState<LoveLetter | null>(null);
    const { toast } = useToast();
    const supabase = createClient();

    useEffect(() => {
        fetchLetters();
        markAsViewed('letters');

        // Set up Realtime listener
        const setupRealtime = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from("profiles")
                .select("couple_id")
                .eq("id", user.id)
                .single();

            if (profile?.couple_id) {
                const channel = supabase
                    .channel('realtime-letters')
                    .on(
                        'postgres_changes',
                        {
                            event: 'INSERT',
                            schema: 'public',
                            table: 'love_letters',
                            filter: `couple_id=eq.${profile.couple_id}`
                        },
                        () => {
                            fetchLetters();
                        }
                    )
                    .subscribe();

                return () => {
                    supabase.removeChannel(channel);
                };
            }
        };

        const cleanup = setupRealtime();
        return () => {
            cleanup.then(fn => fn && fn());
        };
    }, []);

    const fetchLetters = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get user's couple
            const { data: profile } = await supabase
                .from("profiles")
                .select("couple_id")
                .eq("id", user.id)
                .single();

            if (!profile?.couple_id) {
                setLoading(false);
                return;
            }

            // Update the query to include letters where sender_id is current user OR (unlock_date is null or passed)
            const { data: lettersData, error: lettersError } = await supabase
                .from("love_letters")
                .select('*')
                .eq("couple_id", profile.couple_id)
                .or(`sender_id.eq.${user.id},unlock_date.is.null,unlock_date.lte.${new Date().toISOString()}`)
                .order("created_at", { ascending: false });

            if (lettersError) throw lettersError;

            if (!lettersData || lettersData.length === 0) {
                setLetters([]);
                return;
            }

            // Get unique sender IDs
            const senderIds = Array.from(new Set(lettersData.map(l => l.sender_id)));

            // Fetch profiles for senders
            const { data: profilesData, error: profilesError } = await supabase
                .from("profiles")
                .select("id, display_name")
                .in("id", senderIds);

            if (profilesError) throw profilesError;

            // Create a map of id -> display_name
            const profileMap = new Map(profilesData?.map(p => [p.id, p.display_name]) || []);

            const formattedLetters = lettersData.map(letter => ({
                ...letter,
                sender_name: profileMap.get(letter.sender_id) || "Your Love",
            }));

            setLetters(formattedLetters);
        } catch (error) {
            console.error("Error fetching letters:", JSON.stringify(error, null, 2));
            toast({
                title: "Error",
                description: "Could not load letters. Please try refreshing.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSendLetter = async () => {
        try {
            if (editingLetter) {
                const res = await updateLetter(editingLetter.id, {
                    title: newLetter.title,
                    content: newLetter.content,
                    unlock_date: newLetter.unlock_date || null
                })

                if (res.error) throw new Error(res.error)

                toast({
                    title: "Letter updated!",
                    description: "Your changes have been saved.",
                    variant: "success",
                });
            } else {
                const res = await sendLetterAction({
                    title: newLetter.title,
                    content: newLetter.content,
                    unlock_date: newLetter.unlock_date || null
                })

                if (res.error) throw new Error(res.error)

                toast({
                    title: "Letter sent!",
                    description: newLetter.unlock_date
                        ? "Your letter will be delivered on the scheduled date."
                        : "Your love letter has been delivered.",
                    variant: "success",
                });
            }

            setNewLetter({ title: "", content: "", unlock_date: "" });
            setEditingLetter(null);
            setIsWriting(false);
            fetchLetters();
            router.refresh();
            await refreshDashboard();
        } catch (error: any) {
            console.error("Error sending letter:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to send letter. Please try again.",
                variant: "destructive",
            });
        }
    };


    const generateAILetter = async () => {
        setGenerating(true);
        try {
            const response = await fetch("/api/generate-letter", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: newLetter.title || "a romantic love letter" }),
            });

            if (response.ok) {
                const data = await response.json();
                setNewLetter(prev => ({ ...prev, content: data.content }));
            }
        } catch (error) {
            console.error("Error generating letter:", error);
        } finally {
            setGenerating(false);
        }
    };

    const markAsRead = async (letterId: string) => {
        try {
            const result = await openLetter(letterId);

            if (result && result.success && result.read_at) {
                setLetters(prev =>
                    prev.map(l => (l.id === letterId ? { ...l, is_read: true, read_at: result.read_at } : l))
                );
            }
        } catch (error) {
            console.error("Error marking letter as read:", error);
        }
    };

    const receivedLetters = letters.filter(l => l.receiver_id !== l.sender_id);
    const sentLetters = letters.filter(l => l.sender_id === l.receiver_id);

    const { scrollY } = useScroll();
    const opacity = useTransform(scrollY, [0, 50], [1, 0]);

    return (
        <div className="container mx-auto px-4 py-8 space-y-6 pt-14">
            <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                    <Mail className="h-6 w-6 text-amber-200 drop-shadow-[0_0_10px_rgba(253,243,165,0.8)]" />
                    <h1 className="text-2xl md:text-3xl font-serif font-semibold text-white text-glow-white">
                        Love Letters
                    </h1>
                </div>

                <motion.div style={{ opacity }}>
                    <Dialog open={isWriting} onOpenChange={setIsWriting}>
                        <Button className="w-10 h-10 p-0 rounded-full" variant="rosy" onClick={() => {
                            setEditingLetter(null);
                            setNewLetter({ title: "", content: "", unlock_date: "" });
                            setIsWriting(true);
                        }}>
                            <Plus className="h-4 w-4" />
                        </Button>
                        <DialogContent className="sm:max-w-[500px] border border-white/10 bg-[#1a0b10]/70 backdrop-blur-[8px] shadow-[0_0_50px_rgba(244,63,94,0.15)] text-white">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-3 font-serif text-2xl text-rose-200">
                                    <Heart className="h-6 w-6 text-rose-500 fill-rose-500 animate-pulse" />
                                    {editingLetter ? "Edit Love Letter" : "Write a Love Letter"}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6 mt-6">
                                <div className="space-y-2">
                                    <Label htmlFor="title" className="text-amber-100 font-medium tracking-wide uppercase text-xs">Title</Label>
                                    <Input
                                        id="title"
                                        placeholder="My Dearest..."
                                        value={newLetter.title}
                                        onChange={(e) => setNewLetter(prev => ({ ...prev, title: e.target.value }))}
                                        className="bg-white/5 border-white/10 focus:border-rose-400/50 text-white placeholder:text-white/30 h-12 rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="content" className="text-amber-100 font-medium tracking-wide uppercase text-xs">Your Message</Label>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={generateAILetter}
                                            disabled={generating}
                                            className="text-xs text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 h-6 px-2"
                                        >
                                            <Sparkles className="h-3 w-3 mr-1" />
                                            {generating ? "Writing..." : "AI Assist"}
                                        </Button>
                                    </div>
                                    <Textarea
                                        id="content"
                                        placeholder="Pour your heart out..."
                                        value={newLetter.content}
                                        onChange={(e) => setNewLetter(prev => ({ ...prev, content: e.target.value }))}
                                        rows={8}
                                        className="resize-none bg-white/5 border-white/10 focus:border-rose-400/50 text-white placeholder:text-white/30 rounded-xl leading-relaxed p-4"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="scheduled" className="flex items-center gap-2 text-amber-100 font-medium tracking-wide uppercase text-xs">
                                        <Calendar className="h-3.5 w-3.5" />
                                        Schedule Delivery (Optional)
                                    </Label>
                                    <Input
                                        id="scheduled"
                                        type="date"
                                        value={newLetter.unlock_date}
                                        onChange={(e) => setNewLetter(prev => ({ ...prev, unlock_date: e.target.value }))}
                                        min={getTodayIST()}
                                        className="mt-1 bg-white/5 border-white/10 focus:border-rose-400/50 text-white/80 h-12 rounded-xl"
                                    />
                                </div>
                                <Button onClick={handleSendLetter} className="w-full gap-2 h-12 text-lg font-bold shadow-lg shadow-rose-500/20" variant="rosy" disabled={!newLetter.content}>
                                    <Send className="h-5 w-5" />
                                    {editingLetter ? "Save Changes" : "Send with Love"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </motion.div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Heart className="h-8 w-8 animate-pulse text-primary" />
                </div>
            ) : letters.length === 0 ? (
                <Card className="border-dashed border-primary/30 bg-transparent">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Mail className="h-12 w-12 text-primary/40 mb-4" />
                        <h3 className="font-medium text-lg mb-2 text-white">No letters yet</h3>
                        <p className="text-white/50 text-center mb-6">
                            Start writing heartfelt messages to your partner
                        </p>
                        <Button onClick={() => setIsWriting(true)} variant="outline">
                            Write Your First Letter
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {letters.map((letter) => (
                        <Card
                            key={letter.id}
                            className={`cursor-pointer transition-all hover:translate-y-[-4px] card-border-premium group ${!letter.is_read ? "ring-2 ring-primary/40 bg-primary/10" : ""}`}
                            onClick={() => {
                                setSelectedLetter(letter);
                                if (!letter.is_read) markAsRead(letter.id);
                            }}
                        >
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <CardTitle className="text-base font-bold text-white tracking-tight line-clamp-1">
                                        {letter.title || "Untitled Letter"}
                                    </CardTitle>
                                    <div className="flex items-center gap-2">
                                        {letter.sender_id === (supabase as any).auth?.user?.id && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-white/20 hover:text-rose-300 hover:bg-rose-500/10 rounded-full"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingLetter(letter);
                                                    setNewLetter({
                                                        title: letter.title,
                                                        content: letter.content,
                                                        unlock_date: letter.unlock_date ? letter.unlock_date.split('T')[0] : "",
                                                    });
                                                    setIsWriting(true);
                                                }}
                                            >
                                                <Edit2 className="h-3 w-3" />
                                            </Button>
                                        )}
                                        {!letter.is_read ? (
                                            <Mail className="h-4 w-4 text-emerald-400 shrink-0 filter drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
                                        ) : (
                                            <MailOpen className="h-4 w-4 text-white/40 shrink-0" />
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-white/70 line-clamp-3 mb-4 leading-relaxed italic">
                                    {letter.content}
                                </p>
                                <div className="flex items-center justify-between text-[10px] uppercase tracking-widest font-bold text-white/40 pt-4 border-t border-white/5">
                                    <div className="flex flex-col gap-1">
                                        <span>From: <span className="text-white/60">{letter.sender_name}</span></span>
                                        {letter.read_at && letter.sender_id === (supabase as any).auth?.user?.id && (
                                            <span className="text-emerald-400/80 flex items-center gap-1 normal-case tracking-normal font-medium">
                                                <MailOpen className="h-3 w-3" />
                                                Read {format(new Date(letter.read_at), "MMM d, h:mm a")}
                                            </span>
                                        )}
                                    </div>
                                    <span>{format(new Date(letter.created_at), "MMM d, yyyy")}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )
            }

            {/* Letter Detail Modal */}
            <Dialog open={!!selectedLetter} onOpenChange={() => setSelectedLetter(null)}>
                <DialogContent className="sm:max-w-[600px] glass-dialog-vibrant border-none p-0 flex flex-col max-h-[85vh]">
                    {selectedLetter && (
                        <>
                            <DialogHeader className="p-6 pb-0">
                                <DialogTitle className="flex items-center gap-3 font-serif text-2xl text-rose-400">
                                    <Heart className="h-6 w-6 text-rose-500 fill-rose-500" />
                                    {selectedLetter?.title || "Love Letter"}
                                </DialogTitle>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40">From: <span className="text-rose-200/60">{selectedLetter?.sender_name}</span></span>
                                    <span className="text-white/20">•</span>
                                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40">{selectedLetter?.created_at ? format(new Date(selectedLetter.created_at), "MMMM d, yyyy") : ""}</span>
                                </div>
                            </DialogHeader>

                            <ScrollArea className="flex-1 p-6 overflow-y-auto">
                                <div className="prose prose-pink max-w-none">
                                    <p className="whitespace-pre-wrap leading-relaxed text-rose-50 font-serif italic text-lg">
                                        {selectedLetter?.content}
                                    </p>
                                </div>
                            </ScrollArea>

                            <div className="p-6 bg-black/20 border-t border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {selectedLetter.sender_id === (supabase as any).auth?.user?.id && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 rounded-full gap-2"
                                            onClick={() => {
                                                const letter = selectedLetter;
                                                setSelectedLetter(null);
                                                setEditingLetter(letter);
                                                setNewLetter({
                                                    title: letter.title,
                                                    content: letter.content,
                                                    unlock_date: letter.unlock_date ? letter.unlock_date.split('T')[0] : "",
                                                });
                                                setIsWriting(true);
                                            }}
                                        >
                                            <Edit2 className="h-3 w-3" />
                                            Edit Letter
                                        </Button>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <Heart className="h-4 w-4 text-rose-500/40" fill="currentColor" />
                                        <span className="text-[10px] uppercase tracking-widest font-bold text-white/30 italic">With all my love</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div >
    );
}
