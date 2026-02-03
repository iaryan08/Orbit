import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Heart, Calendar, Clock, Sparkles } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { format } from 'date-fns'

export default async function PartnerPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (!profile?.couple_id) return <div>No partner paired.</div>

    const { data: couple } = await supabase
        .from('couples')
        .select('*')
        .eq('id', profile.couple_id)
        .single()

    const partnerId = couple.user1_id === user.id ? couple.user2_id : couple.user1_id

    if (!partnerId) return <div>Waiting for partner...</div>

    const { data: partner } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', partnerId)
        .single()

    // Calculate stats
    const daysTogether = couple.paired_at
        ? Math.floor((new Date().getTime() - new Date(couple.paired_at).getTime()) / (1000 * 60 * 60 * 24))
        : 0

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-20 pt-10">
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-b from-rose-500/10 to-transparent blur-3xl h-64 rounded-full -z-10" />

                <div className="text-center space-y-6">
                    <div className="relative inline-block">
                        <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-white/10 shadow-2xl ring-4 ring-rose-500/20">
                            <AvatarImage src={partner.avatar_url} />
                            <AvatarFallback className="text-4xl bg-rose-950 text-rose-200">
                                {partner.display_name?.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="absolute bottom-2 right-2 bg-rose-500 text-white p-2 rounded-full shadow-lg border-2 border-black">
                            <Heart className="w-6 h-6 fill-current" />
                        </div>
                    </div>

                    <div>
                        <h1 className="text-4xl md:text-5xl font-romantic text-white font-bold tracking-wide">
                            {partner.display_name}
                        </h1>
                        <p className="text-rose-200/60 mt-2 uppercase tracking-[0.2em] text-xs font-bold">
                            Your Forever Partner
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card className="glass-card border-white/5">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-amber-300" />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-widest text-white/40 font-bold">Together Since</p>
                            <p className="text-xl font-serif text-white">
                                {couple.paired_at ? format(new Date(couple.paired_at), 'MMMM d, yyyy') : 'Recently'}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card border-white/5">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center">
                            <Clock className="w-6 h-6 text-rose-300" />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-widest text-white/40 font-bold">Days in Love</p>
                            <p className="text-xl font-serif text-white">{daysTogether} Days</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="glass-card p-8 text-center rounded-3xl border border-white/5 bg-black/20">
                <Sparkles className="w-8 h-8 text-amber-200/50 mx-auto mb-4" />
                <p className="text-lg font-serif italic text-white/80 leading-relaxed max-w-lg mx-auto">
                    "In all the world, there is no heart for me like yours. In all the world, there is no love for you like mine."
                </p>
                <p className="text-white/30 text-xs uppercase tracking-widest font-bold mt-4">— Maya Angelou</p>
            </div>
        </div>
    )
}
