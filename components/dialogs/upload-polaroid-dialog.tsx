"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Upload, X, Loader2 } from "lucide-react";
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
                        <Camera className="w-5 h-5 text-rose-400" />
                        Snap a Polaroid
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                    <div
                        className="group relative aspect-square w-full bg-white/5 rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden hover:border-rose-500/50 transition-colors cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {preview ? (
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

                    <div className="space-y-2">
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
