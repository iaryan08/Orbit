"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Heart, Calendar, Sparkles, Send, Lock, EyeOff } from "lucide-react";
import { sendLetter as sendLetterAction, updateLetter } from "@/lib/actions/letters";
import { refreshDashboard } from "@/lib/actions/auth";
import { getTodayIST } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface EditingLetter {
    id: string;
    title: string;
    content: string;
    unlock_date: string | null;
}

interface WriteLetterDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingLetter?: EditingLetter | null;
    onSuccess?: () => void;
    defaultWhisper?: boolean;
}

export function WriteLetterDialog({ open, onOpenChange, editingLetter, onSuccess, defaultWhisper = false }: WriteLetterDialogProps) {
    const router = useRouter();
    const { toast } = useToast();

    const [newLetter, setNewLetter] = useState({
        title: "",
        content: "",
        unlock_date: "",
    });
    const [isOneTime, setIsOneTime] = useState(defaultWhisper);
    const [generating, setGenerating] = useState(false);
    const [sending, setSending] = useState(false);

    // Reset form when dialog opens/closes or editing letter changes
    useEffect(() => {
        if (open) {
            setIsOneTime(defaultWhisper);
            if (editingLetter) {
                setNewLetter({
                    title: editingLetter.title,
                    content: editingLetter.content,
                    unlock_date: editingLetter.unlock_date ? editingLetter.unlock_date.split('T')[0] : "",
                });
                // Assuming editing doesn't support changing type effectively without more logic, keeping basic
            } else {
                setNewLetter({ title: "", content: "", unlock_date: "" });
            }
        }
    }, [open, editingLetter, defaultWhisper]);

    const handleSendLetter = async () => {
        setSending(true);
        try {
            if (editingLetter) {
                // ... update logic (skipping one-time update for now as it's complex)
                const res = await updateLetter(editingLetter.id, {
                    title: newLetter.title,
                    content: newLetter.content,
                    unlock_date: newLetter.unlock_date || null
                });
                if (res.error) throw new Error(res.error);
                toast({ title: "Letter updated!", description: "Your changes have been saved.", variant: "success" });
            } else {
                const res = await sendLetterAction({
                    title: newLetter.title,
                    content: newLetter.content,
                    unlock_date: newLetter.unlock_date || null,
                    isOneTime: isOneTime
                });

                if (res.error) throw new Error(res.error);

                toast({
                    title: isOneTime ? "Whisper Sent" : "Letter sent!",
                    description: isOneTime
                        ? "Your secret message has been sent. It will vanish after viewing."
                        : (newLetter.unlock_date ? "Your letter will be delivered on the scheduled date." : "Your love letter has been delivered."),
                });
            }

            setNewLetter({ title: "", content: "", unlock_date: "" });
            onOpenChange(false);
            onSuccess?.();
            router.refresh();
            await refreshDashboard();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to send letter.",
                variant: "destructive",
            });
        } finally {
            setSending(false);
        }
    };

    // ... generateAILetter ...
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`sm:max-w-[500px] border border-white/10 backdrop-blur-[10px] shadow-[0_0_50px_rgba(244,63,94,0.2)] text-white transition-colors duration-500 ${isOneTime ? 'bg-black/90' : 'bg-[#0d0509]'}`}>
                <DialogHeader>
                    <DialogTitle className={`flex items-center gap-3 font-serif text-2xl ${isOneTime ? 'text-rose-100' : 'text-rose-200'}`}>
                        {isOneTime ? (
                            <Lock className="h-6 w-6 text-rose-500 fill-rose-500/20 animate-pulse" />
                        ) : (
                            <Heart className="h-6 w-6 text-rose-500 fill-rose-500 animate-pulse" />
                        )}
                        {editingLetter ? "Edit Love Letter" : (isOneTime ? "Send Secret Whisper" : "Write a Love Letter")}
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Write a heartfelt message to your partner.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 mt-6">
                    {/* Mode Toggle */}
                    {!editingLetter && (
                        <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${isOneTime ? 'bg-rose-500/20 text-rose-400' : 'bg-white/5 text-white/40'}`}>
                                    {isOneTime ? <EyeOff className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                                </div>
                                <div className="text-sm">
                                    {isOneTime ? (
                                        <>
                                            <p className="font-medium text-white/90">Whisper Mode</p>
                                            <p className="text-xs text-white/50">Message vanishes after viewing</p>
                                        </>
                                    ) : null}
                                </div>
                            </div>
                            <Switch checked={isOneTime} onCheckedChange={setIsOneTime} />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="letter-title" className="text-purple-200 font-medium tracking-wide uppercase text-xs">Title</Label>
                        <Input
                            id="letter-title"
                            placeholder={isOneTime ? "Top Secret..." : "My Dearest..."}
                            value={newLetter.title}
                            onChange={(e) => setNewLetter(prev => ({ ...prev, title: e.target.value }))}
                            className="text-white placeholder:text-white/30"
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="letter-content" className="text-purple-200 font-medium tracking-wide uppercase text-xs">Your Message <span className="text-rose-400">*</span></Label>
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
                            id="letter-content"
                            placeholder={isOneTime ? "Write a secret message..." : "Pour your heart out..."}
                            value={newLetter.content}
                            onChange={(e) => setNewLetter(prev => ({ ...prev, content: e.target.value }))}
                            rows={8}
                            className={`resize-none text-white placeholder:text-white/30 leading-relaxed p-4 ${isOneTime ? 'bg-rose-950/10 border-rose-500/20 focus:border-rose-500/50' : ''}`}
                        />
                    </div>

                    {!isOneTime && (
                        <div className="space-y-2">
                            <Label htmlFor="letter-scheduled" className="flex items-center gap-2 text-purple-200 font-medium tracking-wide uppercase text-xs">
                                <Calendar className="h-3.5 w-3.5" />
                                Schedule Delivery
                            </Label>
                            <Input
                                id="letter-scheduled"
                                type="date"
                                value={newLetter.unlock_date}
                                onChange={(e) => setNewLetter(prev => ({ ...prev, unlock_date: e.target.value }))}
                                min={getTodayIST()}
                                className="mt-1 text-white/80"
                            />
                        </div>
                    )}

                    <Button onClick={handleSendLetter} className={`w-full gap-2 h-12 text-lg font-bold ${isOneTime ? 'bg-rose-600 hover:bg-rose-700 data-[state=open]:bg-rose-700' : ''}`} variant={isOneTime ? "default" : "rosy"} disabled={!newLetter.content || sending}>
                        {isOneTime ? <Lock className="h-5 w-5" /> : <Send className="h-5 w-5" />}
                        {sending ? "Sending..." : editingLetter ? "Save Changes" : (isOneTime ? "Send Secret Whisper" : "Send with Love")}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
