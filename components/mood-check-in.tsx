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

const MOODS: MoodType[] = ['happy', 'loved', 'excited', 'calm', 'sad', 'tired', 'grateful', 'flirty', 'missing you badly', 'cuddly', 'romantic', 'passionate', 'craving you', 'playful']

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
  const [isCustomMode, setIsCustomMode] = useState(false)
  const [customLabel, setCustomLabel] = useState('')
  const [customEmoji, setCustomEmoji] = useState('')
  const { toast } = useToast()

  // If there's a mood today and we haven't just submitted, 
  // we can show the "last shared" state unless user wants to update
  const hasSharedToday = userMoods.length > 0

  async function handleSubmit() {
    if (!selectedMood && !isCustomMode) return
    if (isCustomMode && (!customLabel || !customEmoji)) {
      toast({ title: 'Missing info', description: 'Please provide both an emoji and a label.', variant: 'failed' })
      return
    }

    setIsSubmitting(true)
    const moodToSubmit = isCustomMode ? `CUSTOM:${customEmoji}:${customLabel}` : selectedMood!
    const result = await submitMood(moodToSubmit, note)
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
      // Reset custom form
      setCustomLabel('')
      setCustomEmoji('')
      setIsCustomMode(false)
    }
  }

  const parseMood = (moodStr: string) => {
    if (moodStr?.startsWith('CUSTOM:')) {
      const [, emoji, label] = moodStr.split(':')
      return { emoji, label }
    }
    return { emoji: MOOD_EMOJIS[moodStr as MoodType] || '✨', label: moodStr }
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
    const { emoji: moodEmoji, label: moodLabel } = parseMood(submitted ? (isCustomMode ? `CUSTOM:${customEmoji}:${customLabel}` : selectedMood!) : latestMood.mood)
    const noteToShow = submitted ? note : latestMood.note

    return (
      <Card
        className="bg-transparent border-none shadow-none cursor-pointer group h-full"
        onClick={() => { setIsExpanded(true); setSubmitted(false); }}
      >
        <CardContent className="flex items-center justify-between p-3 relative overflow-hidden h-full min-h-[70px]">
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="flex items-center gap-5 flex-1 min-w-0">
            <div className="relative shrink-0">
              <div className="text-3xl animate-in zoom-in duration-500 relative z-10">
                {moodEmoji}
              </div>
              <div className="absolute -top-1 -right-1">
                <Heart className="w-3 h-3 text-rose-500/60 fill-rose-500/20" />
              </div>
            </div>

            <div className="flex flex-col min-w-0">
              <p className="text-sm font-bold text-white tracking-widest uppercase truncate leading-none mb-1.5 opacity-90 group-hover:text-rose-100 transition-colors">
                {moodLabel}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] leading-none shrink-0">Your Vibe</span>
                {noteToShow && (
                  <>
                    <div className="w-1 h-1 rounded-full bg-white/10 shrink-0" />
                    <p className="text-[10px] text-white/30 italic truncate">
                      "{noteToShow}"
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 pl-4 ml-auto shrink-0">
            <span className="text-[8px] font-black text-rose-300/40 uppercase tracking-widest">{hasSharedToday ? 'Shared' : 'Update'}</span>
            {userMoods.length > 1 && (
              <div className="flex gap-1 items-center">
                {userMoods.slice(1, 4).map((m, i) => (
                  <div key={i} className="text-[10px] opacity-20 hover:opacity-100 transition-all grayscale hover:grayscale-0">
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
              onClick={() => { setSelectedMood(mood); setIsCustomMode(false); }}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-xl border border-white/10 transition-all',
                selectedMood === mood && !isCustomMode
                  ? 'bg-primary/20 border-primary'
                  : 'bg-white/5 hover:bg-white/10'
              )}
            >
              <span className="text-3xl">{MOOD_EMOJIS[mood]}</span>
              <span className="text-xs capitalize text-white w-full truncate text-center font-medium opacity-90">{mood}</span>
            </button>
          ))}
          <button
            onClick={() => { setIsCustomMode(true); setSelectedMood(null); }}
            className={cn(
              'flex flex-col items-center gap-1 p-2 rounded-xl border border-white/10 transition-all',
              isCustomMode
                ? 'bg-primary/20 border-primary'
                : 'bg-white/5 hover:bg-white/10'
            )}
          >
            <span className="text-3xl"><Plus className="w-8 h-8 text-white/40" /></span>
            <span className="text-xs capitalize text-white w-full truncate text-center font-medium opacity-90">Custom</span>
          </button>
        </div>

        {isCustomMode && (
          <div className="grid grid-cols-4 gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="col-span-1">
              <input
                type="text"
                placeholder="😊"
                value={customEmoji}
                onChange={(e) => setCustomEmoji(e.target.value.split(/(\s+)/)[0])} // Just first emoji
                className="w-full h-10 bg-white/5 border border-white/10 rounded-xl text-center text-xl text-white outline-none focus:border-primary/40"
                maxLength={2}
              />
            </div>
            <div className="col-span-3">
              <input
                type="text"
                placeholder="Mood ..."
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-3 text-sm text-white outline-none focus:border-primary/40"
                maxLength={20}
              />
            </div>
          </div>
        )}

        {(selectedMood || isCustomMode) && (
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
