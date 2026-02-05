'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { submitMood } from '@/lib/actions/mood'
import { type MoodType, MOOD_EMOJIS, MOOD_COLORS } from '@/lib/constants'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { Loader2, Send, Heart, ChevronDown, ChevronUp, Plus, Minus } from 'lucide-react'

const MOODS: MoodType[] = ['happy', 'loved', 'excited', 'calm', 'sad', 'anxious', 'tired', 'grateful', 'flirty', 'teasing', 'needy', 'touchy', 'cuddly', 'romantic', 'turned on', 'craving you', 'affectionate', 'playful naughty', 'feeling desired', 'miss you badly']

interface MoodCheckInProps {
  hasPartner: boolean
  userMoods?: any[]
}

export function MoodCheckIn({ hasPartner, userMoods = [] }: MoodCheckInProps) {
  const latestMood = userMoods[0] // Since they are ordered by descending created_at
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null)
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const { toast } = useToast()

  // If there's a mood today and we haven't just submitted, 
  // we can show the "last shared" state unless user wants to update
  const hasSharedToday = userMoods.length > 0

  async function handleSubmit() {
    if (!selectedMood) return

    setIsSubmitting(true)
    const result = await submitMood(selectedMood, note)
    setIsSubmitting(false)

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'failed',
      })
    } else {
      setSubmitted(true)
      toast({
        title: 'Mood shared!',
        description: 'Your partner will see how you are feeling.',
        variant: 'success',
      })
    }
  }

  if (!hasPartner) {
    return (
      <Card className="border-dashed border-2 border-white/10 bg-transparent">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Heart className="w-12 h-12 text-primary/40 mb-4" />
          <h3 className="font-semibold text-lg mb-2 text-white">Pair with your partner</h3>
          <p className="text-sm text-white/70 max-w-xs">
            Connect with your partner to start sharing moods and see how they are feeling today.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Show shared state if submitted OR if we have shared today and not currently expanded/updating
  if (submitted || (hasSharedToday && !isExpanded)) {
    const moodToShow = submitted ? selectedMood : latestMood.mood
    const noteToShow = submitted ? note : latestMood.note

    return (
      <Card
        className="bg-transparent border-none shadow-none cursor-pointer group"
        onClick={() => setIsExpanded(true)}
      >
        <CardContent className="flex flex-col items-center justify-center py-1.5 md:py-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="text-6xl mb-4 animate-in zoom-in duration-500">
            {moodToShow && MOOD_EMOJIS[moodToShow as MoodType]}
          </div>
          <h3 className="font-semibold text-[10px] uppercase tracking-[0.3em] mb-1 text-white/40">You are feeling</h3>
          <p className="text-xl font-medium text-white capitalize">{moodToShow}</p>
          {noteToShow && (
            <p className="text-xs text-white/50 italic mt-2 max-w-[200px] truncate px-4">
              "{noteToShow}"
            </p>
          )}
          {userMoods.length > 1 && (
            <div className="space-y-2 pt-4 md:pt-6 border-t border-white/5 w-full mt-4">
              <p className="text-[9px] uppercase tracking-widest font-bold text-white/20 mb-2">Previous moods today</p>
              <div className="flex gap-2 pb-2 overflow-x-auto no-scrollbar justify-center">
                {userMoods.slice(1, 5).map((m, i) => (
                  <div key={i} className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl grayscale hover:grayscale-0 transition-all" title={m.note || m.mood} onClick={(e) => { e.stopPropagation(); }}>
                    {MOOD_EMOJIS[m.mood as MoodType]}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="mt-6 text-[10px] uppercase tracking-widest text-white/30 hover:text-white"
          >
            Update Mood
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className={cn(
        "bg-transparent border-none shadow-none transition-all duration-300 pt-4 relative",
        isExpanded ? "pb-10 gap-8" : "pb-4 gap-0"
      )}
      glassy={false}
    >
      <CardHeader
        className="flex flex-row items-center justify-between space-y-0 pb-2 cursor-pointer hover:bg-white/5 transition-colors rounded-t-[40px]"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="space-y-1">
          <CardTitle className="text-lg text-white">How are you feeling?</CardTitle>
          <CardDescription className="text-white/70">Share your mood with your partner</CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-transparent rounded-full w-8 h-8 p-0"
        >
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </Button>
      </CardHeader>
      <CardContent className={cn(
        "space-y-4 transition-all duration-300 overflow-hidden",
        isExpanded ? "max-h-[1000px] opacity-100 mt-2" : "max-h-0 opacity-0 p-0"
      )}>
        <div className="grid grid-cols-3 gap-2">
          {MOODS.map((mood) => (
            <button
              key={mood}
              onClick={() => setSelectedMood(mood)}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-xl border border-white/10 transition-all',
                selectedMood === mood
                  ? 'bg-primary/20 border-primary'
                  : 'bg-white/5 hover:bg-white/10'
              )}
            >
              <span className="text-3xl">{MOOD_EMOJIS[mood]}</span>
              <span className="text-xs capitalize text-white w-full truncate text-center font-medium opacity-90">{mood}</span>
            </button>
          ))}
        </div>

        {selectedMood && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <Textarea
              placeholder="Add a note (optional)..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="resize-none"
              rows={2}
            />
            <Button
              onClick={handleSubmit}
              variant="rosy"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sharing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Share Mood
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
