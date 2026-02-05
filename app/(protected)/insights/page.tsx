import { createClient } from '@/lib/supabase/server'

import { getDailyInsights } from '@/lib/actions/insights'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, BookOpen, Heart, Lightbulb } from 'lucide-react'
import Image from 'next/image'

export default async function InsightsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase
        .from('profiles')
        .select('couple_id')
        .eq('id', user.id)
        .single()

    if (!profile?.couple_id) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
                <Sparkles className="w-12 h-12 text-amber-200/50" />
                <h2 className="text-2xl font-serif text-white/90">Connect with your partner first</h2>
                <p className="text-white/50">Insights are tailored for couples.</p>
            </div>
        )
    }

    const { data: rawInsights, success } = await getDailyInsights(profile.couple_id)

    // Ensure insights is an array before mapping
    const insights = Array.isArray(rawInsights) ? rawInsights : []

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-rose-100 flex items-center justify-center gap-3">
                    <Sparkles className="w-10 h-10 text-amber-300 animate-pulse" />
                    Daily Insights
                </h1>
                <p className="text-rose-200/60 max-w-lg mx-auto">
                    Spark conversation and deepen your connection with daily tips, articles, and wisdom.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {insights.length > 0 ? (
                    insights.map((item: any, i: number) => (
                        <Card key={i} className="overflow-hidden glass-card border-white/5 hover:border-white/10 transition-all group">
                            <div className="relative h-48 w-full">
                                <Image
                                    src={item.image_url || "/placeholder.svg"}
                                    alt={item.title}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                <div className="absolute bottom-4 left-4 right-4">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300 bg-black/50 backdrop-blur-md px-2 py-1 rounded-full mb-2 inline-block">
                                        {item.category}
                                    </span>
                                    <h3 className="text-xl font-bold text-white font-serif leading-tight">{item.title}</h3>
                                </div>
                            </div>
                            <CardContent className="p-6">
                                <p className="text-white/70 leading-relaxed text-sm line-clamp-4">
                                    {item.content}
                                </p>
                                {item.source && (
                                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-white/40 uppercase tracking-widest font-bold">
                                        <span>Source: {item.source}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-2 text-center py-12 text-white/40">
                        <p>Gathering fresh insights for you...</p>
                    </div>
                )}
            </div>
        </div>
    )
}
