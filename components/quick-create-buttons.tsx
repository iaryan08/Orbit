"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PenLine, ImagePlus, FileLock2, Sparkles } from "lucide-react";
import { WriteLetterDialog } from "@/components/dialogs/write-letter-dialog";
import { AddMemoryDialog } from "@/components/dialogs/add-memory-dialog";
import { sendSpark } from "@/lib/actions/notifications";
import { useToast } from "@/hooks/use-toast";

export function QuickCreateButtons() {
    const [isWritingLetter, setIsWritingLetter] = useState(false);
    const [isAddingMemory, setIsAddingMemory] = useState(false);
    const [isSendingSpark, setIsSendingSpark] = useState(false);
    const { toast } = useToast();

    const handleSendSpark = async () => {
        setIsSendingSpark(true);
        const res = await sendSpark();
        if (res.success) {
            toast({
                title: "Spark Sent! ✨",
                description: "Your partner knows you're thinking of them.",
                className: "bg-purple-600 border-none text-white font-bold"
            });
        } else {
            toast({
                title: "Failed to send spark",
                description: res.error,
                variant: "destructive"
            });
        }
        setIsSendingSpark(false);
    };

    return (
        <>
            {/* Quick Create Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mt-4">
                <Button
                    variant="ghost"
                    className="relative rounded-[20px] md:rounded-2xl w-12 h-12 md:w-auto md:h-11 p-0 md:px-5 gap-2 bg-rose-500/10 hover:bg-rose-500/20 border border-white/10 backdrop-blur-xl shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 group"
                    onClick={() => setIsWritingLetter(true)}
                >
                    <FileLock2 className="w-5 h-5 md:w-4 md:h-4 text-rose-100 drop-shadow-sm" strokeWidth={2} />
                    <span className="hidden md:inline font-bold text-rose-50 text-sm tracking-tight">Send Whisper</span>
                </Button>

                <Button
                    variant="ghost"
                    className="relative rounded-[20px] md:rounded-2xl w-12 h-12 md:w-auto md:h-11 p-0 md:px-5 gap-2 bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-xl shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 group"
                    onClick={() => setIsAddingMemory(true)}
                >
                    <ImagePlus className="w-5 h-5 md:w-4 md:h-4 text-white drop-shadow-sm" strokeWidth={2} />
                    <span className="hidden md:inline font-bold text-white text-sm tracking-tight">Add Memory</span>
                </Button>

                <Button
                    variant="ghost"
                    className="relative rounded-[20px] md:rounded-2xl w-12 h-12 md:w-auto md:h-11 p-0 md:px-5 gap-2 bg-purple-500/10 hover:bg-purple-500/20 border border-white/10 backdrop-blur-xl shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 group"
                    onClick={handleSendSpark}
                    disabled={isSendingSpark}
                >
                    <Sparkles className={`w-5 h-5 md:w-4 md:h-4 text-purple-200 drop-shadow-sm transition-all ${isSendingSpark ? 'animate-spin' : ''}`} strokeWidth={2} />
                    <span className="hidden md:inline font-bold text-purple-50 text-sm tracking-tight">
                        {isSendingSpark ? 'Sending...' : 'Send Spark'}
                    </span>
                </Button>
            </div>

            {/* Dialogs */}
            <WriteLetterDialog
                open={isWritingLetter}
                onOpenChange={setIsWritingLetter}
                defaultWhisper={true}
            />
            <AddMemoryDialog open={isAddingMemory} onOpenChange={setIsAddingMemory} />
        </>
    );
}
