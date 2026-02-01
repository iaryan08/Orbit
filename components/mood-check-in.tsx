'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { submitMood } from '@/lib/actions/mood'
import { type MoodType, MOOD_EMOJIS, MOOD_COLORS } from '@/lib/constants'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { Loader2, Send, Heart } from 'lucide-react'

const MOODS: MoodType[] = ['happy', 'loved', 'excited', 'calm', 'sad', 'anxious', 'tired', 'grateful', 'flirty', 'teasing', 'needy', 'touchy', 'cuddly', 'romantic', 'turned on', 'craving you', 'affectionate', 'playful naughty', 'feeling desired', 'miss you badly']

interface MoodCheckInProps {
  hasPartner: boolean
}

export function MoodCheckIn({ hasPartner }: MoodCheckInProps) {
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null)
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { toast } = useToast()

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

  if (submitted) {
    return (
      <Card className="bg-transparent border-none shadow-none">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-6xl mb-4">{selectedMood && MOOD_EMOJIS[selectedMood]}</div>
          <h3 className="font-semibold text-lg mb-2 text-white">Mood Shared!</h3>
          <p className="text-sm text-white/80">
            Your partner can now see how you are feeling today.
          </p>
          <Button
            variant="rosy"
            className="mt-4"
            onClick={() => {
              setSubmitted(false)
              setSelectedMood(null)
              setNote('')
            }}
          >
            Update My Mood
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-transparent border-none shadow-none" glassy={false}>
      <CardHeader>
        <CardTitle className="text-lg text-white">How are you feeling?</CardTitle>
        <CardDescription className="text-white/70">Share your mood with your partner</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          {MOODS.map((mood) => (
            <button
              key={mood}
              onClick={() => setSelectedMood(mood)}
              className={cn(
                'flex flex-col items-center gap-1 p-3 rounded-xl border border-white/10 transition-all',
                selectedMood === mood
                  ? 'bg-primary/20 border-primary'
                  : 'bg-white/5 hover:bg-white/10'
              )}
            >
              <span className="text-2xl">{MOOD_EMOJIS[mood]}</span>
              <span className="text-xs capitalize text-white">{mood}</span>
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
