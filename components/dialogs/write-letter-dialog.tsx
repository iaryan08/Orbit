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
} from "@/components/ui/dialog";
import { Heart, Calendar, Sparkles, Send } from "lucide-react";
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
}

export function WriteLetterDialog({ open, onOpenChange, editingLetter, onSuccess }: WriteLetterDialogProps) {
    const router = useRouter();
    const { toast } = useToast();

    const [newLetter, setNewLetter] = useState({
        title: "",
        content: "",
        unlock_date: "",
    });
    const [generating, setGenerating] = useState(false);
    const [sending, setSending] = useState(false);

    // Reset form when dialog opens/closes or editing letter changes
    useEffect(() => {
        if (open) {
            if (editingLetter) {
                setNewLetter({
                    title: editingLetter.title,
                    content: editingLetter.content,
                    unlock_date: editingLetter.unlock_date ? editingLetter.unlock_date.split('T')[0] : "",
                });
            } else {
                setNewLetter({ title: "", content: "", unlock_date: "" });
            }
        }
    }, [open, editingLetter]);

    const handleSendLetter = async () => {
        setSending(true);
        try {
            if (editingLetter) {
                const res = await updateLetter(editingLetter.id, {
                    title: newLetter.title,
                    content: newLetter.content,
                    unlock_date: newLetter.unlock_date || null
                });

                if (res.error) throw new Error(res.error);

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
                });

                if (res.error) throw new Error(res.error);

                toast({
                    title: "Letter sent!",
                    description: newLetter.unlock_date
                        ? "Your letter will be delivered on the scheduled date."
                        : "Your love letter has been delivered.",
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
            <DialogContent className="sm:max-w-[500px] border border-white/10 bg-[#0d0509] backdrop-blur-[4px] shadow-[0_0_50px_rgba(244,63,94,0.2)] text-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 font-serif text-2xl text-rose-200">
                        <Heart className="h-6 w-6 text-rose-500 fill-rose-500 animate-pulse" />
                        {editingLetter ? "Edit Love Letter" : "Write a Love Letter"}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-6 mt-6">
                    <div className="space-y-2">
                        <Label htmlFor="letter-title" className="text-purple-200 font-medium tracking-wide uppercase text-xs">Title</Label>
                        <Input
                            id="letter-title"
                            placeholder="My Dearest..."
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
                            placeholder="Pour your heart out..."
                            value={newLetter.content}
                            onChange={(e) => setNewLetter(prev => ({ ...prev, content: e.target.value }))}
                            rows={8}
                            className="resize-none text-white placeholder:text-white/30 leading-relaxed p-4"
                        />
                    </div>
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
                    <Button onClick={handleSendLetter} className="w-full gap-2 h-12 text-lg font-bold" variant="rosy" disabled={!newLetter.content || sending}>
                        <Send className="h-5 w-5" />
                        {sending ? "Sending..." : editingLetter ? "Save Changes" : "Send with Love"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
