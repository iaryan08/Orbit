'use client'

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { format } from "date-fns"
import { MapPin, X } from "lucide-react"
import Image from "next/image"

interface Memory {
    id: string
    title: string
    description: string
    image_urls: string[]
    location: string | null
    memory_date: string
}

interface MemoryDetailDialogProps {
    memory: Memory | null
    isOpen: boolean
    onClose: () => void
}

export function MemoryDetailDialog({ memory, isOpen, onClose }: MemoryDetailDialogProps) {
    if (!memory) return null

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                className="p-0 overflow-hidden border-none bg-black/60 backdrop-blur-xl sm:max-w-sm w-[90vw] transition-all duration-300"
                style={{
                    height: 'calc(var(--detail-height, 75vh))',
                    maxHeight: '800px'
                }}
            >
                {/* Override the default height for desktop in a more responsive way */}
                <style jsx global>{`
                    @media (min-width: 640px) {
                        [data-slot="dialog-content"] {
                            height: 75vh !important;
                            max-width: 400px !important;
                        }
                    }
                `}</style>

                <div className="relative w-full h-full flex flex-col group">
                    {/* Main Image Container */}
                    <div className="relative flex-1 overflow-hidden">
                        <Image
                            src={memory.image_urls[0] || "/placeholder.svg"}
                            alt={memory.title}
                            fill
                            className="object-cover"
                            priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                        {/* Custom Close Button since we hidden the default for cleaner look */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/40 text-white/70 hover:text-white hover:bg-black/60 transition-all backdrop-blur-md"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content Section */}
                    <div className="p-8 pb-10 bg-black/40 backdrop-blur-md border-t border-white/5 relative z-10 shrink-0">
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <h2 className="text-3xl font-serif font-bold text-white leading-tight tracking-tight">
                                    {memory.title}
                                </h2>

                                <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] font-black text-rose-300/60">
                                    <span>{format(new Date(memory.memory_date + "T12:00:00"), "MMMM do, yyyy")}</span>
                                    {memory.location && (
                                        <span className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {memory.location}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {memory.description && (
                                <p className="text-sm text-white/70 leading-relaxed font-medium italic opacity-80 border-l-2 border-rose-500/30 pl-4 py-1">
                                    "{memory.description}"
                                </p>
                            )}

                            {/* Additional images if any (shown as small thumbnails) */}
                            {memory.image_urls.length > 1 && (
                                <div className="flex gap-2 pt-2">
                                    {memory.image_urls.slice(1, 4).map((url, i) => (
                                        <div key={i} className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/10 opacity-60 hover:opacity-100 transition-opacity">
                                            <Image src={url} alt={`Memory detail ${i}`} fill className="object-cover" />
                                        </div>
                                    ))}
                                    {memory.image_urls.length > 4 && (
                                        <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[10px] text-white/40 font-bold">
                                            +{memory.image_urls.length - 4}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
