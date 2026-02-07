"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Upload, X, Loader2, RotateCw } from "lucide-react";
import { optimizeImage } from "@/lib/image-optimization";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface UploadPolaroidDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function UploadPolaroidDialog({ open, onOpenChange }: UploadPolaroidDialogProps) {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [caption, setCaption] = useState("");
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [mode, setMode] = useState<'upload' | 'camera'>('upload');
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('user');
    const [cameraError, setCameraError] = useState<string | null>(null);
    const { toast } = useToast();
    const router = useRouter();
    const supabase = createClient();

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            const optimized = await optimizeImage(selected, 800, 800, 0.7);
            setFile(optimized);
            setPreview(URL.createObjectURL(optimized));
        }
    };

    useEffect(() => {
        if (!open) {
            // stop camera when dialog closes
            stopCamera();
            setMode('upload');
        }
        // cleanup on unmount
        return () => stopCamera();
    }, [open]);

    const startCamera = async (facing?: 'environment' | 'user') => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setCameraError('Camera not supported');
            return;
        }
        setCameraError(null);
        try {
            const facingModeToUse = facing || cameraFacing;
            const constraints: MediaStreamConstraints = { video: { facingMode: facingModeToUse } };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                try { await videoRef.current.play(); } catch {}
                try { videoRef.current.focus(); } catch {}
            }

            // try to apply continuous autofocus if supported
            try {
                const track = stream.getVideoTracks()[0];
                if (track && typeof (track as any).applyConstraints === 'function') {
                    try {
                        // @ts-ignore - may not be supported
                        await (track as any).applyConstraints({ advanced: [{ focusMode: 'continuous' }] });
                    } catch (e) {
                        // ignore constraint errors
                    }
                }
            } catch (e) {}

            setIsCameraActive(true);
        } catch (e: any) {
            console.error('Camera start failed', e);
            setCameraError(e?.message || 'Camera access denied');
            setIsCameraActive(false);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            try { videoRef.current.pause(); } catch {}
            videoRef.current.srcObject = null;
        }
        setIsCameraActive(false);
    };

    const capturePhoto = async () => {
        if (!videoRef.current) return;
        const video = videoRef.current;
        const w = video.videoWidth || 800;
        const h = video.videoHeight || 800;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        if (cameraFacing === 'user') {
            // mirror horizontally for front camera
            ctx.translate(w, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(video, 0, 0, w, h);
            // reset transform
            ctx.setTransform(1, 0, 0, 1, 0, 0);
        } else {
            ctx.drawImage(video, 0, 0, w, h);
        }
        return new Promise<void>((resolve) => {
            canvas.toBlob(async (blob) => {
                if (!blob) return resolve();
                const fileObj = new File([blob], `polaroid-${Date.now()}.png`, { type: blob.type });
                const optimized = await optimizeImage(fileObj, 800, 800, 0.7);
                setFile(optimized);
                setPreview(URL.createObjectURL(optimized));
                // stop camera after capture
                stopCamera();
                setMode('upload');
                resolve();
            }, 'image/png');
        });
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user");

            const { data: profile } = await supabase
                .from("profiles")
                .select("couple_id")
                .eq("id", user.id)
                .single();

            if (!profile?.couple_id) throw new Error("No couple linked");

            const fileName = `polaroids/${profile.couple_id}/${Date.now()}.webp`;
            const { error: uploadError } = await supabase.storage
                .from("memories")
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from("memories")
                .getPublicUrl(fileName);

            // Delete previous polaroids for this couple to keep only the latest one
            await supabase
                .from("polaroids")
                .delete()
                .eq("couple_id", profile.couple_id);

            // Save new polaroid
            const { error: dbError } = await supabase
                .from("polaroids")
                .insert({
                    image_url: publicUrl,
                    caption: caption,
                    user_id: user.id,
                    couple_id: profile.couple_id
                });

            if (dbError) {
                if (dbError.code === '42P01') {
                    throw new Error("Polaroids table missing. Please run the SQL setup in Supabase SQL Editor.");
                }
                throw dbError;
            }

            toast({
                title: "Polaroid developing...",
                description: "Your partner will see this moment soon.",
            });

            onOpenChange(false);
            setFile(null);
            setPreview(null);
            setCaption("");
            router.refresh();
        } catch (error: any) {
            toast({
                title: "Upload failed",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-[#0d0509] border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 font-serif text-xl">
                        Snap a Polaroid
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-4 mb-4">
                    <div className="flex gap-2">
                        <Button
                            variant={mode === 'upload' ? 'default' : 'ghost'}
                            onClick={() => { setMode('upload'); stopCamera(); }}
                            className="flex-1"
                        >
                            Upload
                        </Button>
                        <Button
                            variant={mode === 'camera' ? 'default' : 'ghost'}
                            onClick={async () => { setMode('camera'); await startCamera(); }}
                            className="flex-1"
                        >
                            Capture
                        </Button>
                    </div>
                    <div
                        className="group relative aspect-square w-full bg-white/5 rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center overflow-visible hover:border-rose-500/50 transition-colors cursor-pointer"
                        onClick={() => { if (mode === 'upload') fileInputRef.current?.click(); }}
                    >
                        {mode === 'camera' ? (
                            <div className="w-full h-full flex items-center justify-center relative">
                                {!isCameraActive && !preview && (
                                    <div className="text-xs text-white/40">Camera not available</div>
                                )}
                                <video
                                    ref={videoRef}
                                    className={`w-full h-full object-cover ${cameraFacing === 'user' ? 'scale-x-[-1]' : ''}`}
                                    playsInline
                                />
                                {preview && (
                                    <>
                                        <Image src={preview} alt="Preview" fill className="object-cover" />
                                        <div className="absolute inset-0 bg-black/40" />
                                    </>
                                )}

                                {/* Overlays: flip (top-right, mobile-only) and capture (bottom-center) */}
                                {!preview && (
                                    <>
                                        <div className="absolute top-2 right-2 md:hidden pointer-events-auto">
                                            <Button
                                                variant="ghost"
                                                onClick={async () => {
                                                    const newFacing = cameraFacing === 'environment' ? 'user' : 'environment';
                                                    setCameraFacing(newFacing);
                                                    stopCamera();
                                                    setTimeout(() => startCamera(newFacing), 150);
                                                }}
                                                className="h-10 w-10 p-0 flex items-center justify-center rounded-full bg-black/40"
                                            >
                                                <RotateCw className="w-4 h-4" />
                                            </Button>
                                        </div>

                                        <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-10 pointer-events-auto">
                                            <button onClick={capturePhoto} className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/20">
                                                <Camera className="w-6 h-6 text-white" />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : preview ? (
                            <>
                                <Image src={preview} alt="Preview" fill className="object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <Upload className="w-8 h-8 text-white" />
                                </div>
                            </>
                        ) : (
                            <div className="text-center p-6">
                                <Upload className="w-8 h-8 text-white/20 mx-auto mb-2" />
                                <p className="text-xs text-white/40">Select or drop a photo</p>
                            </div>
                        )}
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                        accept="image/*"
                    />

                    {mode === 'camera' && cameraError && (
                        <div className="w-full text-center text-xs text-rose-400 mt-2">
                            <div>{cameraError}</div>
                            <div className="mt-1 flex items-center justify-center gap-2">
                                <Button size="sm" onClick={() => startCamera()} className="h-8">Retry</Button>
                                <Button size="sm" variant="ghost" onClick={() => setMode('upload')} className="h-8">Upload Instead</Button>
                            </div>
                        </div>
                    )}

                    {mode === 'camera' && preview && (
                        <div className="flex gap-2 w-full">
                            <Button onClick={() => { setPreview(null); setFile(null); setMode('camera'); startCamera(); }} className="flex-1 h-12">Retake</Button>
                            <Button variant="ghost" onClick={() => { setMode('upload'); }} className="flex-1 h-12">Use Photo</Button>
                        </div>
                    )}

                    <div className="space-y-2 mt-8">
                        <Label className="text-[10px] uppercase tracking-widest text-white/40">Short Caption</Label>
                        <Input
                            placeholder="A sweet memory..."
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            className="bg-white/5 border-white/10"
                        />
                    </div>

                    <Button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="w-full h-12 bg-rose-600 hover:bg-rose-700 font-bold"
                    >
                        {uploading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Develop Image"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
