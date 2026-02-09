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
    // Manually add 5:30 for Vercel/Server environments if they are in UTC
    // Most cloud providers use UTC by default
    const isUTC = date.getTimezoneOffset() === 0
    if (isUTC) {
      date.setHours(date.getHours() + 5)
      date.setMinutes(date.getMinutes() + 30)
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const parseMood = (moodStr: string) => {
    if (moodStr?.startsWith('CUSTOM:')) {
      const [, emoji, label] = moodStr.split(':')
      return { emoji, label }
    }
    return { emoji: MOOD_EMOJIS[moodStr as MoodType] || '✨', label: moodStr }
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
  const { emoji: moodEmoji, label: moodLabel } = parseMood(latestMood.mood)

  return (
    <Card className="bg-transparent border-none shadow-none h-full relative group" glassy={false}>
      <CardContent className="flex items-center justify-between p-3 relative overflow-hidden h-full min-h-[70px]">
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative shrink-0">
            <Avatar className="w-10 h-10 ring-1 ring-rose-200/10">
              <AvatarImage src={partnerAvatar || undefined} />
              <AvatarFallback className="bg-rose-50/10 text-rose-200 text-xs">
                {partnerName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 text-base bg-black/40 backdrop-blur-md rounded-full w-5 h-5 flex items-center justify-center border border-white/10">
              {moodEmoji}
            </div>
          </div>

          <div className="flex flex-col min-w-0">
            <p className="text-sm font-bold text-white tracking-widest uppercase whitespace-normal break-words leading-none mb-0.5 opacity-90 group-hover:text-rose-100 transition-colors">
              {partnerName}
            </p>
            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-1.5">
              <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] leading-none shrink-0">Vibes</span>
              {latestMood.note ? (
                <>
                  <div className="hidden md:block w-1 h-1 rounded-full bg-white/10 shrink-0" />
                  <p className="text-[10px] text-white/30 italic whitespace-normal break-words md:flex-1 md:min-w-0 text-left">
                    "{latestMood.note}"
                  </p>
                </>
              ) : (
                <>
                  <div className="hidden md:block w-1 h-1 rounded-full bg-white/10 shrink-0" />
                  <p className="text-[10px] text-white/30 italic whitespace-normal break-words capitalize md:flex-1 md:min-w-0 text-left">
                    {moodLabel}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 pl-4 ml-auto shrink-0">
          <div className="flex items-center gap-1 text-[8px] font-black text-white/20 uppercase tracking-widest" suppressHydrationWarning>
            <Clock className="w-2.5 h-2.5" />
            {formatTime(latestMood.created_at)}
          </div>
          {moods.length > 1 && (
            <div className="flex gap-1 items-center">
              {moods.slice(1, 4).map((m, i) => (
                <div key={i} className="text-[10px] opacity-20 hover:opacity-100 transition-[opacity,filter] grayscale hover:grayscale-0">
                  {parseMood(m.mood).emoji}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
