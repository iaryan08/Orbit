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
} from "@/components/ui/dialog";
import { Heart, Plus, Calendar, Lock, Sparkles, Send, Mail, MailOpen } from "lucide-react";
import { WriteLetterDialog } from "@/components/dialogs/write-letter-dialog";
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
import { useAppMode } from "@/components/app-mode-context";

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
    const { coupleId } = useAppMode();
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
            if (coupleId) {
                const channel = supabase
                    .channel('realtime-letters')
                    .on(
                        'postgres_changes',
                        {
                            event: 'INSERT',
                            schema: 'public',
                            table: 'love_letters',
                            filter: `couple_id=eq.${coupleId}`
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

            if (!coupleId) {
                setLoading(false);
                return;
            }

            // Update the query to include letters where sender_id is current user OR (unlock_date is null or passed)
            const { data: lettersData, error: lettersError } = await supabase
                .from("love_letters")
                .select('*')
                .eq("couple_id", coupleId)
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
                    <Button className="w-10 h-10 p-0 rounded-full" variant="rosy" onClick={() => {
                        setEditingLetter(null);
                        setIsWriting(true);
                    }}>
                        <Plus className="h-4 w-4" />
                    </Button>
                </motion.div>

                <WriteLetterDialog
                    open={isWriting}
                    onOpenChange={setIsWriting}
                    editingLetter={editingLetter}
                    onSuccess={() => {
                        fetchLetters();
                        setEditingLetter(null);
                    }}
                />
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
                                    <CardTitle className="text-base font-bold text-white tracking-tight line-clamp-2 leading-snug">
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
                                <p className="text-sm text-white/70 line-clamp-4 mb-6 leading-relaxed italic">
                                    {letter.content}
                                </p>
                                <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.2em] font-bold text-white/30 pt-4 border-t border-white/5">
                                    <div className="flex flex-col gap-1.5">
                                        <span>From: <span className="text-white/50">{letter.sender_name}</span></span>
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
