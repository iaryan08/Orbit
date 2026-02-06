"use client";

import { useState, useRef, useEffect } from "react";
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
import { Heart, Calendar, MapPin, Upload, X } from "lucide-react";
import { createMemory, updateMemory } from "@/lib/actions/memories";
import { refreshDashboard } from "@/lib/actions/auth";
import { getTodayIST } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { optimizeImage } from "@/lib/image-optimization";
import { createClient } from "@/lib/supabase/client";
import { useAppMode } from "@/components/app-mode-context";

interface EditingMemory {
    id: string;
    title: string;
    description: string;
    image_urls: string[];
    location: string | null;
    memory_date: string;
}

interface AddMemoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingMemory?: EditingMemory | null;
    onSuccess?: () => void;
    onDelete?: (id: string) => Promise<void>;
}

export function AddMemoryDialog({ open, onOpenChange, editingMemory, onSuccess, onDelete }: AddMemoryDialogProps) {
    const router = useRouter();
    const { toast } = useToast();
    const { coupleId } = useAppMode();
    const supabase = createClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [newMemory, setNewMemory] = useState({
        title: "",
        description: "",
        location: "",
        memory_date: getTodayIST(),
    });
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>([]);

    // Reset form when dialog opens/closes or editing memory changes
    useEffect(() => {
        if (open) {
            if (editingMemory) {
                setNewMemory({
                    title: editingMemory.title,
                    description: editingMemory.description || "",
                    location: editingMemory.location || "",
                    memory_date: editingMemory.memory_date,
                });
                setExistingImages(editingMemory.image_urls || []);
            } else {
                setNewMemory({
                    title: "",
                    description: "",
                    location: "",
                    memory_date: getTodayIST(),
                });
                setExistingImages([]);
            }
            setPreviewUrls([]);
            setSelectedFiles([]);
        }
    }, [open, editingMemory]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const totalCount = files.length + selectedFiles.length + existingImages.length;
        if (totalCount > 10) {
            toast({
                title: "Too many files",
                description: "You can upload up to 10 images per memory.",
                variant: "destructive",
            });
            return;
        }

        setUploading(true);
        const compressedFiles = await Promise.all(files.map(file => optimizeImage(file)));
        setUploading(false);

        const newPreviews = compressedFiles.map((file) => URL.createObjectURL(file));
        setPreviewUrls((prev) => [...prev, ...newPreviews]);
        setSelectedFiles((prev) => [...prev, ...compressedFiles]);
    };

    const removeFile = (index: number) => {
        URL.revokeObjectURL(previewUrls[index]);
        setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const removeExistingImage = (index: number) => {
        setExistingImages((prev) => prev.filter((_, i) => i !== index));
    };

    const uploadImages = async (coupleIdToUse: string): Promise<string[]> => {
        const urls: string[] = [];

        for (const file of selectedFiles) {
            const fileName = `${coupleIdToUse}/${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;

            const { error } = await supabase.storage
                .from('memories')
                .upload(fileName, file);

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('memories')
                .getPublicUrl(fileName);

            urls.push(publicUrl);
        }

        return urls;
    };

    const saveMemory = async () => {
        if (!newMemory.title) {
            toast({
                title: "Title required",
                description: "Please give your memory a title.",
                variant: "destructive",
            });
            return;
        }

        if (selectedFiles.length === 0 && existingImages.length === 0) {
            toast({
                title: "Photo required",
                description: "Please upload at least one photo.",
                variant: "destructive",
            });
            return;
        }

        setUploading(true);
        try {
            let coupleIdToUse = coupleId;

            // If no coupleId from context, try to fetch it
            if (!coupleIdToUse) {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data: profile } = await supabase
                    .from("profiles")
                    .select("couple_id")
                    .eq("id", user.id)
                    .single();

                if (!profile?.couple_id) {
                    toast({
                        title: "Not paired yet",
                        description: "You need to be paired with your partner first.",
                        variant: "destructive",
                    });
                    return;
                }
                coupleIdToUse = profile.couple_id;
            }

            // Upload new images
            const newImageUrls = selectedFiles.length > 0 && coupleIdToUse ? await uploadImages(coupleIdToUse) : [];
            const allImageUrls = [...existingImages, ...newImageUrls];

            if (editingMemory) {
                const res = await updateMemory(editingMemory.id, {
                    title: newMemory.title,
                    description: newMemory.description,
                    image_urls: allImageUrls,
                    location: newMemory.location || null,
                    memory_date: newMemory.memory_date,
                });

                if (res.error) throw new Error(res.error);

                toast({
                    title: "Memory updated!",
                    description: "Your changes have been saved.",
                });
            } else {
                const res = await createMemory({
                    title: newMemory.title,
                    description: newMemory.description,
                    image_urls: newImageUrls,
                    location: newMemory.location || null,
                    memory_date: newMemory.memory_date,
                });

                if (res.error) throw new Error(res.error);

                toast({
                    title: "Memory saved!",
                    description: "Your precious moment has been captured.",
                });
            }

            // Cleanup
            previewUrls.forEach((url) => URL.revokeObjectURL(url));
            setNewMemory({
                title: "",
                description: "",
                location: "",
                memory_date: getTodayIST(),
            });
            setSelectedFiles([]);
            setPreviewUrls([]);
            setExistingImages([]);
            onOpenChange(false);
            onSuccess?.();
            router.refresh();
            await refreshDashboard();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to save memory.",
                variant: "destructive",
            });
        } finally {
            setUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] border border-white/10 bg-[#150818]/85 backdrop-blur-[8px] shadow-[0_0_50px_rgba(244,63,94,0.2)] text-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 font-serif text-2xl text-rose-200">
                        <Heart className="h-6 w-6 text-rose-500 fill-rose-500 animate-pulse" />
                        {editingMemory ? "Edit Memory" : "Capture a Memory"}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                    <div>
                        <Label htmlFor="memory-title" className="text-amber-100 font-medium tracking-wide uppercase text-xs">Title <span className="text-rose-400">*</span></Label>
                        <Input
                            id="memory-title"
                            placeholder="Our special day..."
                            value={newMemory.title}
                            onChange={(e) => setNewMemory((prev) => ({ ...prev, title: e.target.value }))}
                            className="text-white placeholder:text-white/30 mt-1.5"
                        />
                    </div>

                    <div>
                        <Label className="text-amber-100 font-medium tracking-wide uppercase text-xs">Photos <span className="text-rose-400">*</span></Label>
                        <div className="mt-2 space-y-2">
                            <div className="grid grid-cols-3 gap-2">
                                {/* Existing Images */}
                                {existingImages.map((url, index) => (
                                    <div key={`existing-${index}`} className="relative aspect-square">
                                        <Image
                                            src={url || "/placeholder.svg"}
                                            alt={`Existing ${index + 1}`}
                                            fill
                                            className="object-cover rounded-lg"
                                        />
                                        <button
                                            onClick={() => removeExistingImage(index)}
                                            className="absolute -top-2 -right-2 bg-white/20 text-white rounded-full p-2 hover:bg-white/40 transition-all cursor-pointer"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                ))}

                                {/* New Previews */}
                                {previewUrls.map((url, index) => (
                                    <div key={`new-${index}`} className="relative aspect-square">
                                        <Image
                                            src={url || "/placeholder.svg"}
                                            alt={`Preview ${index + 1}`}
                                            fill
                                            className="object-cover rounded-lg"
                                        />
                                        <button
                                            onClick={() => removeFile(index)}
                                            className="absolute -top-2 -right-2 bg-white/20 text-white rounded-full p-2 hover:bg-white/40 transition-all cursor-pointer"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {(existingImages.length + previewUrls.length) < 10 && (
                                <Button
                                    variant="outline"
                                    className="w-full h-20 border-dashed bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/40 transition-all text-white/70 hover:text-white"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload className="h-5 w-5 mr-2" />
                                    Upload Photos ({existingImages.length + previewUrls.length}/10)
                                </Button>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="memory-description" className="text-amber-100 font-medium tracking-wide uppercase text-xs">Description</Label>
                        <Textarea
                            id="memory-description"
                            placeholder="What made this moment special..."
                            value={newMemory.description}
                            onChange={(e) => setNewMemory((prev) => ({ ...prev, description: e.target.value }))}
                            rows={3}
                            className="text-white placeholder:text-white/30 mt-1.5"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="memory-date" className="flex items-center gap-1 text-amber-100 font-medium tracking-wide uppercase text-xs">
                                <Calendar className="h-3 w-3" />
                                Date
                            </Label>
                            <Input
                                id="memory-date"
                                type="date"
                                value={newMemory.memory_date}
                                onChange={(e) => setNewMemory((prev) => ({ ...prev, memory_date: e.target.value }))}
                                className="text-white/80 mt-1.5"
                            />
                        </div>
                        <div>
                            <Label htmlFor="memory-location" className="flex items-center gap-1 text-amber-100 font-medium tracking-wide uppercase text-xs">
                                <MapPin className="h-3 w-3" />
                                Location
                            </Label>
                            <Input
                                id="memory-location"
                                placeholder="Where..."
                                value={newMemory.location}
                                onChange={(e) => setNewMemory((prev) => ({ ...prev, location: e.target.value }))}
                                className="text-white placeholder:text-white/30 mt-1.5"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        {editingMemory && onDelete && (
                            <Button
                                variant="destructive"
                                className="flex-1"
                                onClick={async () => {
                                    if (!confirm("Are you sure you want to delete this memory?")) return;
                                    setDeleting(true);
                                    await onDelete(editingMemory.id);
                                    setDeleting(false);
                                    onOpenChange(false);
                                }}
                                disabled={uploading || deleting}
                            >
                                {deleting ? "Deleting..." : "Delete"}
                            </Button>
                        )}
                        <Button onClick={saveMemory} className="flex-1 gap-2 h-12 text-lg font-bold" variant="rosy" disabled={uploading || deleting}>
                            {uploading ? "Saving..." : editingMemory ? "Save Changes" : "Save Memory"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
