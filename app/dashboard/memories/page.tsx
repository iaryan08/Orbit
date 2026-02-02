"use client";

import React from "react"

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Camera, Plus, Calendar, MapPin, Heart, Upload, X, ImageIcon, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { markAsViewed, refreshDashboard, deleteMemory } from "@/lib/actions/auth";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Edit2 } from "lucide-react";


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
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newMemory, setNewMemory] = useState({
    title: "",
    description: "",
    location: "",
    memory_date: new Date().toISOString().split("T")[0],
  });
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    fetchMemories();
    markAsViewed('memories');

    // Set up Realtime listener
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("couple_id")
        .eq("id", user.id)
        .single();

      if (profile?.couple_id) {
        const channel = supabase
          .channel('realtime-memories')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'memories',
              filter: `couple_id=eq.${profile.couple_id}`
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

    const cleanup = setupRealtime();
    return () => {
      cleanup.then(fn => fn && fn());
    };
  }, []);
  const fetchMemories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("couple_id")
        .eq("id", user.id)
        .single();

      if (!profile?.couple_id) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("memories")
        .select("*")
        .eq("couple_id", profile.couple_id)
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

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            'image/jpeg',
            0.7 // quality
          );
        };
      };
    });
  };

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
    const compressedFiles = await Promise.all(files.map(file => compressImage(file)));
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
      const fileExt = file.name.split('.').pop();
      const fileName = `${coupleId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

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
        variant: "failed",
      });
      return;
    }

    setUploading(true);
    try {
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
          variant: "failed",
        });
        return;
      }

      // Upload images if any new ones selected
      const newImageUrls = selectedFiles.length > 0 ? await uploadImages(profile.couple_id) : [];

      if (editingMemory) {
        const { error } = await supabase
          .from("memories")
          .update({
            title: newMemory.title,
            description: newMemory.description,
            image_urls: [...existingImages, ...newImageUrls],
            location: newMemory.location || null,
            memory_date: newMemory.memory_date,
          })
          .eq("id", editingMemory.id);

        if (error) throw error;

        toast({
          title: "Memory updated!",
          description: "Your changes have been saved.",
        });
      } else {
        const { error } = await supabase.from("memories").insert({
          couple_id: profile.couple_id,
          user_id: user.id,
          title: newMemory.title,
          description: newMemory.description,
          image_urls: newImageUrls,
          location: newMemory.location || null,
          memory_date: newMemory.memory_date,
        });

        if (error) throw error;

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
        memory_date: new Date().toISOString().split("T")[0],
      });
      setSelectedFiles([]);
      setPreviewUrls([]);
      setExistingImages([]);
      setIsAdding(false);
      setEditingMemory(null);
      fetchMemories();
      router.refresh();
      await refreshDashboard();
    } catch (error) {
      console.error("Error saving memory:", error);
      toast({
        title: "Error",
        description: "Failed to save memory. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-semibold text-white flex items-center gap-3 text-glow-white">
            <Camera className="h-7 w-7 text-amber-200" />
            Our Memories
          </h1>
          <p className="text-rose-100/70 mt-1 uppercase tracking-widest text-[10px] font-bold">Capture and cherish your special moments</p>
        </div>
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <Button className="gap-2" variant="rosy" onClick={() => {
            setEditingMemory(null);
            setNewMemory({
              title: "",
              description: "",
              location: "",
              memory_date: new Date().toISOString().split("T")[0],
            });
            setPreviewUrls([]);
            setSelectedFiles([]);
            setExistingImages([]);
            setIsAdding(true);
          }}>
            <Plus className="h-4 w-4" />
            Add Memory
          </Button>
          <DialogContent className="sm:max-w-[500px] glass-card border-primary/10">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-serif">
                <Heart className="h-5 w-5 text-primary" />
                {editingMemory ? "Edit Memory" : "Capture a Memory"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Our special day..."
                  value={newMemory.title}
                  onChange={(e) => setNewMemory((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div>
                <Label>Photos</Label>
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
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                        >
                          <X className="h-3 w-3" />
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
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                        >
                          <X className="h-3 w-3" />
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
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What made this moment special..."
                  value={newMemory.description}
                  onChange={(e) => setNewMemory((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Date
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={newMemory.memory_date}
                    onChange={(e) => setNewMemory((prev) => ({ ...prev, memory_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="location" className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Location
                  </Label>
                  <Input
                    id="location"
                    placeholder="Where..."
                    value={newMemory.location}
                    onChange={(e) => setNewMemory((prev) => ({ ...prev, location: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                {editingMemory && (
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={async () => {
                      if (!confirm("Are you sure you want to delete this memory?")) return;
                      setUploading(true);
                      await deleteMemory(editingMemory.id);
                      setUploading(false);
                      setIsAdding(false);
                      setEditingMemory(null);
                      fetchMemories();
                      router.refresh();
                      await refreshDashboard();
                      toast({ title: "Memory deleted" });
                    }}
                    disabled={uploading}
                  >
                    {uploading ? "Deleting..." : "Delete"}
                  </Button>
                )}
                <Button onClick={saveMemory} className="flex-1" variant="rosy" disabled={uploading}>
                  {uploading ? "Saving..." : (editingMemory ? "Save Changes" : "Save Memory")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Heart className="h-8 w-8 animate-pulse text-primary" />
        </div>
      ) : memories.length === 0 ? (
        <Card className="border-dashed border-primary/10">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="h-12 w-12 text-primary/40 mb-4" />
            <h3 className="font-medium text-lg mb-2">No memories yet</h3>
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
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  {memory.image_urls.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-background/80 text-foreground text-xs px-2 py-1 rounded-full">
                      +{memory.image_urls.length - 1} more
                    </div>
                  )}
                  {memory.user_id === (supabase as any).auth?.user?.id && (
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
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="text-base font-serif font-bold text-white tracking-tight line-clamp-1 pb-1">{memory.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {memory.description && (
                  <p className="text-sm text-rose-50/70 line-clamp-2 mb-3 leading-relaxed">
                    {memory.description}
                  </p>
                )}
                <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest font-bold text-rose-200/40 pt-3 border-t border-white/5 pb-1">
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
      <Dialog open={!!selectedMemory} onOpenChange={() => setSelectedMemory(null)}>
        <DialogContent className="sm:max-w-[600px] glass-card border-primary/10">
          {selectedMemory && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif flex items-center justify-between">
                  <span>{selectedMemory.title}</span>
                  {selectedMemory.user_id === (supabase as any).auth?.user?.id && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white/50 hover:text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Close detail and open edit
                          const memoryToEdit = selectedMemory;
                          setSelectedMemory(null);
                          setEditingMemory(memoryToEdit);
                          setNewMemory({
                            title: memoryToEdit.title,
                            description: memoryToEdit.description || "",
                            location: memoryToEdit.location || "",
                            memory_date: memoryToEdit.memory_date,
                          });
                          setExistingImages(memoryToEdit.image_urls || []);
                          setPreviewUrls([]);
                          setSelectedFiles([]);
                          setIsAdding(true);
                        }}
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400/50 hover:text-red-400 hover:bg-red-500/10"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!confirm("Are you sure you want to delete this memory?")) return;
                          await deleteMemory(selectedMemory.id);
                          setSelectedMemory(null);
                          fetchMemories();
                          router.refresh();
                          await refreshDashboard();
                          toast({ title: "Memory deleted" });
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  )}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {selectedMemory.image_urls && selectedMemory.image_urls.length > 0 && (
                  <div className="relative h-[350px] w-full flex items-center justify-center overflow-hidden py-4">
                    <AnimatePresence initial={false}>
                      {selectedMemory.image_urls.map((url, index) => {
                        // Only show current and next image for performance/clarity
                        if (index < currentImageIndex || index > currentImageIndex + 1) return null;

                        const isTop = index === currentImageIndex;

                        return (
                          <motion.div
                            key={`${selectedMemory.id}-${index}`}
                            style={{
                              zIndex: selectedMemory.image_urls.length - index,
                              position: 'absolute'
                            }}
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{
                              scale: isTop ? 1 : 0.95,
                              opacity: 1,
                              y: isTop ? 0 : 10,
                              rotate: isTop ? 0 : (index % 2 === 0 ? 2 : -2)
                            }}
                            exit={{
                              x: isTop ? (Math.random() > 0.5 ? 500 : -500) : 0,
                              opacity: 0,
                              rotate: isTop ? (Math.random() > 0.5 ? 45 : -45) : 0,
                              transition: { duration: 0.4 }
                            }}
                            drag={isTop ? "x" : false}
                            dragConstraints={{ left: 0, right: 0 }}
                            onDragEnd={(_, info) => {
                              if (Math.abs(info.offset.x) > 100) {
                                if (currentImageIndex < selectedMemory.image_urls.length - 1) {
                                  setCurrentImageIndex(prev => prev + 1);
                                } else {
                                  // Loops back to start or stay at end? 
                                  // User said "browse", usually means circular or stop.
                                  // Let's loop back for better UX in "Tinder" style.
                                  setCurrentImageIndex(0);
                                }
                              }
                            }}
                            className="w-[90%] h-full cursor-grab active:cursor-grabbing"
                          >
                            <div className="relative w-full h-full bg-white/5 rounded-2xl overflow-hidden border border-white/10 shadow-2xl glass-card">
                              <Image
                                src={url || "/placeholder.svg"}
                                alt={`${selectedMemory.title} ${index + 1}`}
                                fill
                                className="object-cover"
                                draggable={false}
                              />
                              <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-full border border-white/10 font-bold uppercase tracking-widest">
                                {index + 1} / {selectedMemory.image_urls.length}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>

                    {/* Empty state when all swiped if no loop (but I added loop above) */}
                    {selectedMemory.image_urls.length > 1 && (
                      <div className="absolute top-1/2 left-4 -translate-y-1/2 opacity-20 hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full bg-black/20"
                          onClick={() => setCurrentImageIndex(prev => (prev === 0 ? selectedMemory.image_urls.length - 1 : prev - 1))}
                        >
                          <Heart className="h-4 w-4 -rotate-90" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                {selectedMemory.description && (
                  <p className="text-rose-50/90 leading-relaxed font-serif italic text-lg pb-1">{selectedMemory.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-rose-100/60 border-t border-white/10 pt-4 pb-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(selectedMemory.memory_date), "MMMM d, yyyy")}
                  </span>
                  {selectedMemory.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span className="text-amber-200/80">{selectedMemory.location}</span>
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
