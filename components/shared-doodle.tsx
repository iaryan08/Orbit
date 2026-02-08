"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Send, Undo2, Loader2, Sparkles, CheckCircle2, Pen, Eraser, Hand, Palette, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Point {
    x: number;
    y: number;
}

interface Stroke {
    points: Point[];
    color: string;
    width: number;
    isEraser?: boolean;
}

interface SharedDoodleProps {
    onSave?: (path: string) => Promise<any>;
    savedPath?: string;
    isReadOnly?: boolean;
}

export function SharedDoodle({ onSave, savedPath, isReadOnly = false }: SharedDoodleProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [allStrokes, setAllStrokes] = useState<Stroke[]>([]);
    const [activeTool, setActiveTool] = useState<'pan' | 'pen' | 'eraser'>('pan');
    const [color, setColor] = useState('#fb7185');
    const [lastSyncedPath, setLastSyncedPath] = useState<string>("");
    const [isSending, setIsSending] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isAutoSaving, setIsAutoSaving] = useState(false);

    const isDrawing = useRef(false);
    const currentStroke = useRef<Point[]>([]);
    const allStrokesRef = useRef<Stroke[]>([]);
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Sync ref with state for the redraw engine
    useEffect(() => {
        allStrokesRef.current = allStrokes;
    }, [allStrokes]);

    // Redraw engine - uses refs to avoid staleness
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

        const drawStroke = (points: Point[], strokeColor: string, width: number, isEraser?: boolean) => {
            if (points.length < 2) return;
            context.beginPath();
            context.strokeStyle = isEraser ? "#000000" : strokeColor; // Eraser color doesn't matter for destination-out
            context.lineWidth = width;
            context.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';

            context.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                context.lineTo(points[i].x, points[i].y);
            }
            context.stroke();
        };

        allStrokesRef.current.forEach(stroke => {
            drawStroke(stroke.points, stroke.color, stroke.width, stroke.isEraser);
        });

        if (isDrawing.current && currentStroke.current.length > 1) {
            drawStroke(currentStroke.current, color, activeTool === 'eraser' ? 20 : 3, activeTool === 'eraser');
        }

        // Reset composite operation
        context.globalCompositeOperation = 'source-over';
    }, [color, activeTool]);

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
            }, 3000);
        }

        return () => {
            if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        };
    }, [isDirty, isSending, performSave, allStrokes]);

    // Handle incoming data from DB
    // Handle incoming data from DB with migration
    useEffect(() => {
        if (savedPath && savedPath !== lastSyncedPath) {
            try {
                const parsed = JSON.parse(savedPath);
                if (Array.isArray(parsed)) {
                    let strokes: Stroke[] = [];
                    if (parsed.length > 0) {
                        // Check if it's new format (Stroke[]) or old format (Point[][])
                        // A Stroke has 'points', 'color', etc.
                        if (parsed[0].points) {
                            strokes = parsed;
                        } else if (Array.isArray(parsed[0])) {
                            // Convert old Point[][] to Stroke[]
                            strokes = parsed.map((points: any) => ({
                                points,
                                color: '#fb7185',
                                width: 3,
                                isEraser: false
                            }));
                        } else if (parsed[0].x !== undefined) {
                            // Point[] single stroke? Unlikely for Point[][], usually wrapped.
                            // But handle just in case.
                            strokes = [{ points: parsed, color: '#fb7185', width: 3, isEraser: false }];
                        }
                    }

                    const currentPathStr = JSON.stringify(allStrokes);
                    // Avoid overwrite if conflict? For now trust server if different.
                    // But wait, if allStrokes is empty locally, we accept server.
                    // Ideally check timestamps but we don't have them.
                    setAllStrokes(strokes);
                    setLastSyncedPath(savedPath);
                }
            } catch (e) {
                console.error("Failed to parse saved doodle", e);
            }
        }
    }, [savedPath, lastSyncedPath]);

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
        if (isReadOnly || isSending || activeTool === 'pan') return;
        e.preventDefault(); // crucial for touch
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        isDrawing.current = true;

        // Capture pointer to track outside canvas
        (e.target as HTMLElement).setPointerCapture(e.pointerId);

        currentStroke.current = [getPos(e)];
        redraw();
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
            const newStroke: Stroke = {
                points: [...currentStroke.current],
                color: color,
                width: activeTool === 'eraser' ? 20 : 3,
                isEraser: activeTool === 'eraser'
            };
            const newStrokes = [...allStrokesRef.current, newStroke];
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
        <div className="relative w-full h-[400px] md:h-full bg-[#1a1118]/10 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden shadow-xl group/doodle">
            {/* Triple-sized (3x Width, 2x Height) Scrollable Canvas Area */}
            <div className="w-full h-full overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] relative">
                <canvas
                    ref={canvasRef}
                    className={cn(
                        "w-[300%] h-[200%] min-h-[800px] transition-opacity block",
                        activeTool !== 'pan' ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing",
                        isSending ? "opacity-30" : "opacity-100",
                        activeTool !== 'pan' && "touch-none"
                    )}
                    onPointerDown={startDrawing}
                    onPointerMove={draw}
                    onPointerUp={stopDrawing}
                    onPointerLeave={stopDrawing}
                />

            </div>

            {!isReadOnly && (
                <>
                    {/* View/Pan Mode: Show Edit Button */}
                    {activeTool === 'pan' && (
                        <div className="absolute bottom-4 right-4 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 z-10">
                            {/* Actions (Undo/Clear) */}
                            <div className="flex items-center gap-1 bg-black/10 backdrop-blur-sm rounded-full p-1 border border-white/5">
                                <Button
                                    variant="ghost" size="icon"
                                    className="w-8 h-8 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                                    onClick={handleUndo}
                                    disabled={allStrokes.length === 0 || isSending}
                                >
                                    <Undo2 className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="ghost" size="icon"
                                    className="w-8 h-8 rounded-full hover:bg-rose-500/20 text-white/40 hover:text-rose-400 transition-colors"
                                    onClick={clear}
                                    disabled={allStrokes.length === 0 || isSending}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Enter Draw Mode FAB */}
                            <Button
                                size="icon"
                                className="w-10 h-10 rounded-full bg-rose-500 hover:bg-rose-600 text-white shadow-lg border border-white/10"
                                onClick={() => setActiveTool('pen')}
                            >
                                <Pen className="w-4 h-4" />
                            </Button>
                        </div>
                    )}

                    {/* Edit/Draw Mode: Show Tools */}
                    {activeTool !== 'pan' && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/30 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/10 shadow-lg animate-in slide-in-from-bottom-4 zoom-in-95 z-10">
                            {/* Colors */}
                            <div className="flex items-center gap-1.5 mr-1">
                                {['#fb7185', '#fcd34d', '#4ade80', '#60a5fa', '#ffffff'].map(c => (
                                    <button
                                        key={c}
                                        className={cn(
                                            "w-4 h-4 rounded-full transition-all ring-1 ring-white/10 hover:scale-110",
                                            color === c && activeTool === 'pen' ? "scale-125 ring-2 ring-white shadow-lg shadow-white/20" : "opacity-80 hover:opacity-100"
                                        )}
                                        style={{ backgroundColor: c }}
                                        onClick={() => {
                                            setColor(c);
                                            setActiveTool('pen');
                                        }}
                                    />
                                ))}
                            </div>

                            <div className="w-px h-4 bg-white/10" />

                            {/* Eraser */}
                            <Button
                                variant="ghost" size="icon"
                                className={cn(
                                    "w-7 h-7 rounded-full hover:bg-white/10 transition-colors",
                                    activeTool === 'eraser' ? "bg-white/20 text-white" : "text-white/60 hover:text-white"
                                )}
                                onClick={() => setActiveTool(activeTool === 'eraser' ? 'pen' : 'eraser')}
                            >
                                <Eraser className="w-3.5 h-3.5" />
                            </Button>

                            <Button
                                variant="ghost" size="icon"
                                className="w-7 h-7 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                onClick={handleUndo}
                                disabled={allStrokes.length === 0}
                            >
                                <Undo2 className="w-3.5 h-3.5" />
                            </Button>

                            <div className="w-px h-4 bg-white/10" />

                            {/* Close / Exit Draw Mode */}
                            <Button
                                variant="ghost" size="icon"
                                className="w-7 h-7 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                onClick={() => setActiveTool('pan')}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </>
            )}

            <div className="absolute top-4 left-5 flex items-center gap-2 z-10">
                <div className="p-1 px-2 rounded-full bg-rose-500/10 border border-rose-500/20 backdrop-blur-md">
                    <p className="text-[9px] font-bold text-rose-300 uppercase tracking-[0.2em]">Shared Guestbook</p>
                </div>
                {isDirty && !isSending && !isAutoSaving && (
                    <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 duration-500">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    </div>
                )}
                {isAutoSaving && (
                    <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 duration-500">
                        <Loader2 className="w-3 h-3 text-rose-400 animate-spin" />
                    </div>
                )}
            </div>
        </div>
    );
}
