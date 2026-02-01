import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MOOD_EMOJIS, MOOD_COLORS, type MoodType } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { Heart, Clock } from 'lucide-react'

interface PartnerMoodProps {
  partnerName: string
  partnerAvatar?: string | null
  moods: Array<{
    mood: MoodType
    note: string | null
    created_at: string
  }>
}

export function PartnerMood({ partnerName, partnerAvatar, moods }: PartnerMoodProps) {
  const formatTime = (timeString: string) => {
    const date = new Date(timeString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (moods.length === 0) {
    return (
      <Card className="border-dashed border-2 border-white/5 bg-transparent h-full" glassy={false}>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center h-full">
          <Avatar className="w-16 h-16 mb-4 ring-2 ring-rose-200/5">
            <AvatarImage src={partnerAvatar || undefined} />
            <AvatarFallback className="bg-rose-50/5 text-rose-200 text-xl">
              {partnerName?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
          <h3 className="font-semibold text-[10px] uppercase tracking-widest mb-1 text-white/40">{partnerName || 'Your Partner'}</h3>
          <p className="text-xs text-white/60">{"No mood shared yet today"}</p>
        </CardContent>
      </Card>
    )
  }

  const latestMood = moods[0]

  return (
    <Card className="bg-transparent border-none shadow-none h-full" glassy={false}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="w-12 h-12 ring-2 ring-rose-200/10 shadow-glow-rose">
              <AvatarImage src={partnerAvatar || undefined} />
              <AvatarFallback className="bg-rose-50/10 text-rose-200">
                {partnerName?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 bg-background/80 backdrop-blur-md rounded-full p-1 border border-white/10 text-xl shadow-lg">
              {MOOD_EMOJIS[latestMood.mood]}
            </div>
          </div>
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2 text-white/90 font-serif">
              {partnerName}
              <Heart className="w-3 h-3 text-rose-300/80 fill-current animate-pulse-slow" />
            </CardTitle>
            <CardDescription className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-white/40 font-bold">
              Current Vibe
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2 h-full">
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <Clock className="w-12 h-12 text-white" />
            </div>
            <p className="text-sm text-white/90 leading-relaxed relative z-10">
              {latestMood.note ? `"${latestMood.note}"` : `Feeling ${latestMood.mood} right now`}
            </p>
            <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold text-white/30 mt-3 relative z-10">
              <Clock className="w-3 h-3" />
              {formatTime(latestMood.created_at)}
            </div>
          </div>

          {moods.length > 1 && (
            <div className="space-y-2 pt-2 border-t border-white/5">
              <p className="text-[9px] uppercase tracking-widest font-bold text-white/20 mb-2">Previous moods today</p>
              <div className="flex gap-2 pb-2 overflow-x-auto no-scrollbar">
                {moods.slice(1, 5).map((m, i) => (
                  <div key={i} className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl grayscale hover:grayscale-0 transition-all cursor-help relative group/mood" title={m.note || m.mood}>
                    {MOOD_EMOJIS[m.mood]}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md text-[8px] text-white px-2 py-1 rounded opacity-0 group-hover/mood:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                      {formatTime(m.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
