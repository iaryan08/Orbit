"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PenLine, ImageIcon } from "lucide-react";
import { WriteLetterDialog } from "@/components/dialogs/write-letter-dialog";
import { AddMemoryDialog } from "@/components/dialogs/add-memory-dialog";

export function QuickCreateButtons() {
    const [isWritingLetter, setIsWritingLetter] = useState(false);
    const [isAddingMemory, setIsAddingMemory] = useState(false);

    return (
        <>
            {/* Quick Create Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mt-6">
                <Button
                    variant="rosy"
                    className="rounded-2xl px-6 h-11 gap-2 backdrop-blur-md"
                    onClick={() => setIsWritingLetter(true)}
                >
                    <PenLine className="w-4 h-4" />
                    Write Letter
                </Button>
                <Button
                    variant="outline"
                    className="rounded-2xl px-6 h-11 gap-2 bg-white/5 border-white/10 hover:bg-amber-50/90 hover:border-amber-200/50 hover:text-amber-700 backdrop-blur-md text-rose-100 transition-all"
                    onClick={() => setIsAddingMemory(true)}
                >
                    <ImageIcon className="w-4 h-4" />
                    Add Memory
                </Button>
            </div>

            {/* Dialogs */}
            <WriteLetterDialog open={isWritingLetter} onOpenChange={setIsWritingLetter} />
            <AddMemoryDialog open={isAddingMemory} onOpenChange={setIsAddingMemory} />
        </>
    );
}
