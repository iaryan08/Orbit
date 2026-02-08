"use client";



import React from "react"

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MemoryDetailDialog } from "@/components/memory-detail-dialog";
import { Camera, Plus, Calendar, MapPin, Heart, ImageIcon, Trash2, Edit2, Maximize2 } from "lucide-react";
import { AddMemoryDialog } from "@/components/dialogs/add-memory-dialog";
import { createClient } from "@/lib/supabase/client";
import { markAsViewed, refreshDashboard, deleteMemory } from "@/lib/actions/auth";
import { FullScreenImageModal } from "@/components/full-screen-image-modal";
import { createMemory, updateMemory } from "@/lib/actions/memories";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import Image from "next/image";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { getTodayIST } from "@/lib/utils";
import { optimizeImage } from "@/lib/image-optimization";
import { useAppMode } from "@/components/app-mode-context";


interface Memory {
    id: string;
    title: string;
    description: string;
    image_urls: string[];
    location: string | null;
    memory_date: string;
    created_at: string;
    user_id: string;
}

export default function MemoriesPage() {
    const router = useRouter();
    const { coupleId } = useAppMode();
    const [memories, setMemories] = useState<Memory[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
    const [uploading, setUploading] = useState(false);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [newMemory, setNewMemory] = useState({
        title: "",
        description: "",
        location: "",
        memory_date: getTodayIST(),
    });
    const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const { toast } = useToast();
    const supabase = createClient();
    const searchParams = useSearchParams();

    // Deep linking for notifications
    useEffect(() => {
        const openId = searchParams.get('open');
        if (openId && memories.length > 0) {
            const memoryToOpen = memories.find(m => m.id === openId);
            if (memoryToOpen) {
                setSelectedMemory(memoryToOpen);
            }
        }
    }, [searchParams, memories]);

    useEffect(() => {
        fetchMemories();
        markAsViewed('memories');

        // Set up Realtime listener
        const setupRealtime = async () => {
            if (coupleId) {
                const channel = supabase
                    .channel('realtime-memories')
                    .on(
                        'postgres_changes',
                        {
                            event: 'INSERT',
                            schema: 'public',
                            table: 'memories',
                            filter: `couple_id=eq.${coupleId}`
                        },
                        () => {
                            fetchMemories();
                        }
                    )
                    .subscribe();

                return () => {
                    supabase.removeChannel(channel);
                };
            }
        };

        // Get current user ID
        supabase.auth.getUser().then(({ data }) => {
            if (data?.user) setUserId(data.user.id);
        });

        const cleanup = setupRealtime();
        return () => {
            cleanup.then(fn => fn && fn());
        };
    }, [coupleId]);
    const fetchMemories = async () => {
        try {
            if (!coupleId) {
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from("memories")
                .select("*")
                .eq("couple_id", coupleId)
                .order("memory_date", { ascending: false });

            if (error) throw error;
            // Filter out memories with no images
            const filteredData = (data || []).filter(m => m.image_urls && m.image_urls.length > 0);
            setMemories(filteredData);
        } catch (error) {
            console.error("Error fetching memories:", error);
        } finally {
            setLoading(false);
        }
    };

    // We'll use the shared utility now
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length + selectedFiles.length > 10) {
            toast({
                title: "Too many files",
                description: "You can upload up to 10 images per memory.",
                variant: "destructive",
            });
            return;
        }

        setUploading(true);
        // Convert all to WebP for faster uploads and reduced bandwidth
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

    const uploadImages = async (coupleId: string): Promise<string[]> => {
        const urls: string[] = [];

        for (const file of selectedFiles) {
            // Already converted to .webp in handleFileSelect
            const fileName = `${coupleId}/${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;

            const { data, error } = await supabase.storage
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
                description: "Please upload at least one photo to capture this memory.",
                variant: "destructive",
            });
            return;
        }

        setUploading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            if (!coupleId) {
                toast({
                    title: "Not paired yet",
                    description: "You need to be paired with your partner first.",
                    variant: "destructive",
                });
                return;
            }

            // Upload images if any new ones selected
            const newImageUrls = selectedFiles.length > 0 ? await uploadImages(coupleId) : [];
            const allImageUrls = [...existingImages, ...newImageUrls];

            if (editingMemory) {
                const res = await updateMemory(editingMemory.id, {
                    title: newMemory.title,
                    description: newMemory.description,
                    image_urls: allImageUrls,
                    location: newMemory.location || null,
                    memory_date: newMemory.memory_date,
                })

                if (res.error) throw new Error(res.error)

                toast({
                    title: "Memory updated!",
                    description: "Your changes have been saved.",
                });
            } else {
                const res = await createMemory({
                    title: newMemory.title,
                    description: newMemory.description,
                    image_urls: newImageUrls, // For new memory, just new images
                    location: newMemory.location || null,
                    memory_date: newMemory.memory_date,
                })

                if (res.error) throw new Error(res.error)

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
            setIsAdding(false);
            setEditingMemory(null);
            fetchMemories();
            router.refresh();
            await refreshDashboard();
        } catch (error: any) {
            console.error("Error saving memory:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to save memory. Please try again.",
                variant: "destructive",
            });
        } finally {
            setUploading(false);
        }
    };

    const { scrollY } = useScroll();
    const opacity = useTransform(scrollY, [0, 50], [1, 0]);

    return (
        <div className="container mx-auto px-4 py-8 space-y-6 pt-14">
            <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                    <Camera className="h-6 w-6 text-amber-200 drop-shadow-[0_0_10px_rgba(253,243,165,0.8)]" />
                    <h1 className="text-2xl md:text-3xl font-serif font-semibold text-white text-glow-white">
                        Our Memories
                    </h1>
                </div>

                <motion.div style={{ opacity }}>
                    <Button className="w-10 h-10 p-0 rounded-full" variant="rosy" onClick={() => {
                        setEditingMemory(null);
                        setIsAdding(true);
                    }}>
                        <Plus className="h-4 w-4" />
                    </Button>
                </motion.div>

                <AddMemoryDialog
                    open={isAdding}
                    onOpenChange={setIsAdding}
                    editingMemory={editingMemory}
                    onSuccess={() => {
                        fetchMemories();
                        setEditingMemory(null);
                    }}
                    onDelete={async (id) => {
                        await deleteMemory(id);
                        fetchMemories();
                        setEditingMemory(null);
                        toast({ title: "Memory deleted" });
                    }}
                />
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Heart className="h-8 w-8 animate-pulse text-primary" />
                </div>
            ) : memories.length === 0 ? (
                <Card className="border-dashed border-primary/10 bg-transparent">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <ImageIcon className="h-12 w-12 text-primary/40 mb-4" />
                        <h3 className="font-medium text-lg mb-2 text-white">No memories yet</h3>
                        <p className="text-white/50 text-center mb-6">
                            Start capturing your special moments together
                        </p>
                        <Button onClick={() => setIsAdding(true)} variant="rosy">
                            Add Your First Memory
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {memories.map((memory, index) => (
                        <Card
                            key={memory.id}
                            className="cursor-pointer overflow-hidden transition-all hover:shadow-lg hover:border-primary/40 group/card"
                            onClick={() => {
                                setSelectedMemory(memory);
                                setCurrentImageIndex(0);
                            }}
                        >
                            {memory.image_urls && memory.image_urls.length > 0 ? (
                                <div className="relative aspect-video">
                                    <Image
                                        src={memory.image_urls[0] || "/placeholder.svg"}
                                        alt={memory.title}
                                        fill
                                        className="object-cover"
                                        priority={index < 4}
                                        loading={index < 4 ? undefined : "lazy"}
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
                                    {memory.image_urls.length > 1 && (
                                        <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-md px-2 py-1 rounded text-[10px] text-white/90 font-bold">
                                            +{memory.image_urls.length - 1} more
                                        </div>
                                    )}
                                    {userId === memory.user_id && (
                                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 bg-black/40 text-white/70 hover:text-white hover:bg-black/60 rounded-full"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingMemory(memory);
                                                    setNewMemory({
                                                        title: memory.title,
                                                        description: memory.description || "",
                                                        location: memory.location || "",
                                                        memory_date: memory.memory_date,
                                                    });
                                                    setExistingImages(memory.image_urls || []);
                                                    setPreviewUrls([]);
                                                    setSelectedFiles([]);
                                                    setIsAdding(true);
                                                }}
                                            >
                                                <Edit2 className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 bg-black/40 text-red-400/70 hover:text-red-400 hover:bg-black/60 rounded-full"
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    if (!confirm("Are you sure you want to delete this memory?")) return;
                                                    await deleteMemory(memory.id);
                                                    fetchMemories();
                                                    router.refresh();
                                                    await refreshDashboard();
                                                    toast({ title: "Memory deleted" });
                                                }}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="aspect-video bg-secondary flex items-center justify-center">
                                    <ImageIcon className="h-10 w-10 text-muted-foreground" />
                                </div>
                            )}
                            <CardHeader className="px-3 pb-0 -mt-[20px] -mb-[20px]">
                                <CardTitle className="text-base font-serif font-bold text-white tracking-tight line-clamp-1">{memory.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="px-3 pt-1 pb-3">
                                {memory.description && (
                                    <p className="text-xs text-rose-50/50 line-clamp-2 mb-2 leading-relaxed italic">
                                        {memory.description}
                                    </p>
                                )}
                                <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest font-bold text-rose-200/20 pt-2 border-t border-white/5">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {format(new Date(memory.memory_date), "MMM d, yyyy")}
                                    </span>
                                    {memory.location && (
                                        <span className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            <span className="text-amber-200/60 truncate">{memory.location}</span>
                                        </span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Memory Detail Modal */}
            <MemoryDetailDialog
                isOpen={!!selectedMemory}
                memory={selectedMemory}
                onClose={() => setSelectedMemory(null)}
            />
            {/* Full Screen Image Viewer */}
            <FullScreenImageModal
                src={fullScreenImage}
                onClose={() => setFullScreenImage(null)}
            />
        </div >
    );
}
