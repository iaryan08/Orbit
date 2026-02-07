"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Send, Undo2, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Point {
    x: number;
    y: number;
}

interface SharedDoodleProps {
    onSave?: (path: string) => Promise<any>;
    savedPath?: string;
    isReadOnly?: boolean;
}

export function SharedDoodle({ onSave, savedPath, isReadOnly = false }: SharedDoodleProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [allStrokes, setAllStrokes] = useState<Point[][]>([]);
    const [lastSyncedPath, setLastSyncedPath] = useState<string>("");
    const [isSending, setIsSending] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isAutoSaving, setIsAutoSaving] = useState(false);

    const isDrawing = useRef(false);
    const currentStroke = useRef<Point[]>([]);
    const allStrokesRef = useRef<Point[][]>([]);
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Sync ref with state for the redraw engine
    useEffect(() => {
        allStrokesRef.current = allStrokes;
    }, [allStrokes]);

    // Redraw engine - uses refs to avoid staleness
    const redraw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext("2d");
        if (!context) return;

        const dpr = window.devicePixelRatio || 1;
        context.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

        context.lineCap = "round";
        context.lineJoin = "round";
        context.strokeStyle = "#fb7185";
        context.lineWidth = 3;

        allStrokesRef.current.forEach(stroke => {
            if (stroke.length < 2) return;
            context.beginPath();
            context.moveTo(stroke[0].x, stroke[0].y);
            for (let i = 1; i < stroke.length; i++) {
                context.lineTo(stroke[i].x, stroke[i].y);
            }
            context.stroke();
        });

        if (isDrawing.current && currentStroke.current.length > 1) {
            context.beginPath();
            context.moveTo(currentStroke.current[0].x, currentStroke.current[0].y);
            for (let i = 1; i < currentStroke.current.length; i++) {
                context.lineTo(currentStroke.current[i].x, currentStroke.current[i].y);
            }
            context.stroke();
        }
    }, []);

    // Track if there are unsent changes
    const isDirty = useMemo(() => {
        const currentPathStr = JSON.stringify(allStrokes);
        if (allStrokes.length === 0 && (!lastSyncedPath || lastSyncedPath === "[]")) return false;
        return currentPathStr !== lastSyncedPath;
    }, [allStrokes, lastSyncedPath]);

    // Internal save function used by both Manual and Auto save
    const performSave = useCallback(async () => {
        if (!onSave || !isDirty || isSending) return;
        setIsSending(true);
        try {
            const pathData = JSON.stringify(allStrokesRef.current);
            await onSave(pathData);
            setLastSyncedPath(pathData);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error("Failed to save doodle", error);
        } finally {
            setIsSending(false);
            setIsAutoSaving(false);
        }
    }, [onSave, isDirty, isSending]);

    // Auto-save logic: 2s after last interaction
    useEffect(() => {
        if (isDirty && !isSending) {
            if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

            autoSaveTimerRef.current = setTimeout(() => {
                setIsAutoSaving(true);
                performSave();
            }, 2000);
        }

        return () => {
            if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        };
    }, [isDirty, isSending, performSave, allStrokes]);

    // Handle incoming data from DB
    useEffect(() => {
        if (savedPath && savedPath !== lastSyncedPath) {
            try {
                const parsed = JSON.parse(savedPath);
                if (Array.isArray(parsed)) {
                    const strokes = (parsed.length > 0 && !Array.isArray(parsed[0])) ? [parsed] : parsed;

                    const currentPathStr = JSON.stringify(allStrokes);
                    if (currentPathStr === lastSyncedPath || lastSyncedPath === "") {
                        setAllStrokes(strokes);
                        setLastSyncedPath(savedPath);
                    }
                }
            } catch (e) {
                console.error("Failed to parse saved doodle", e);
            }
        }
    }, [savedPath, lastSyncedPath, allStrokes]);

    // Setup and Resize Logic
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleResize = () => {
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.scale(dpr, dpr);
                redraw();
            }
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [redraw]);

    // Re-draw when allStrokes changes
    useEffect(() => {
        redraw();
    }, [allStrokes, redraw]);

    const getPos = (e: React.PointerEvent) => {
        const rect = canvasRef.current!.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const startDrawing = (e: React.PointerEvent) => {
        if (isReadOnly || isSending) return;
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        isDrawing.current = true;
        currentStroke.current = [getPos(e)];
    };

    const draw = (e: React.PointerEvent) => {
        if (!isDrawing.current) return;
        const pos = getPos(e);
        currentStroke.current.push(pos);
        redraw();
    };

    const stopDrawing = () => {
        if (!isDrawing.current) return;
        isDrawing.current = false;
        if (currentStroke.current.length > 1) {
            const newStrokes = [...allStrokesRef.current, [...currentStroke.current]];
            setAllStrokes(newStrokes);
        }
        currentStroke.current = [];
        redraw();
    };

    const handleUndo = () => {
        if (isReadOnly || isSending) return;
        setAllStrokes(prev => prev.slice(0, -1));
    };

    const clear = () => {
        if (isReadOnly || isSending) return;
        setAllStrokes([]);
    };

    return (
        <div className="relative w-full aspect-square md:aspect-[4/3] bg-[#1a1118]/10 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden shadow-2xl group/doodle">
            <canvas
                ref={canvasRef}
                className={cn(
                    "w-full h-full touch-none cursor-crosshair transition-opacity",
                    isSending ? "opacity-30" : "opacity-100"
                )}
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={stopDrawing}
                onPointerLeave={stopDrawing}
            />

            {!isReadOnly && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/20 backdrop-blur-2xl p-1.5 rounded-full border border-white/10 shadow-2xl transition-all duration-300 group-hover/doodle:scale-105">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="w-9 h-9 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                        onClick={handleUndo}
                        disabled={allStrokes.length === 0 || isSending}
                    >
                        <Undo2 className="w-4 h-4" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="w-9 h-9 rounded-full hover:bg-rose-500/20 text-white/60 hover:text-rose-400 transition-colors"
                        onClick={clear}
                        disabled={allStrokes.length === 0 || isSending}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            )}

            <div className="absolute top-4 left-5 flex items-center gap-2">
                <div className="p-1 px-2 rounded-full bg-rose-500/10 border border-rose-500/20">
                    <p className="text-[9px] font-bold text-rose-300 uppercase tracking-[0.2em]">Shared Guestbook</p>
                </div>
                {isDirty && !isSending && !isAutoSaving && (
                    <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 duration-500">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        <span className="text-[9px] text-white/40 font-medium italic">Unsent changes</span>
                    </div>
                )}
                {isAutoSaving && (
                    <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 duration-500">
                        <Loader2 className="w-3 h-3 text-rose-400 animate-spin" />
                        <span className="text-[9px] text-white/60 font-medium italic">Syncing...</span>
                    </div>
                )}
                {showSuccess && (
                    <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 duration-500">
                        <span className="text-[9px] text-purple-400 font-bold uppercase tracking-widest">Saved!</span>
                    </div>
                )}
            </div>
        </div>
    );
}
