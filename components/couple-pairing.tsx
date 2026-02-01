'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { joinCouple, generatePairCode } from '@/lib/actions/auth'
import { useToast } from '@/hooks/use-toast'
import { Heart, Link2, Copy, Users, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface CouplePairingProps {
  userPairCode?: string | null
}

export function CouplePairing({ userPairCode }: CouplePairingProps) {
  const [pairCode, setPairCode] = useState('')
  const [myPairCode, setMyPairCode] = useState(userPairCode || '')
  const [isJoining, setIsJoining] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  async function handleGenerateCode() {
    setIsGenerating(true)
    const result = await generatePairCode()
    setIsGenerating(false)

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else if (result.pairCode) {
      setMyPairCode(result.pairCode)
      toast({
        title: 'Code Generated!',
        description: 'Share this code with your partner to connect.',
      })
      router.refresh()
    }
  }

  async function handleJoin() {
    if (!pairCode.trim()) return

    setIsJoining(true)
    const result = await joinCouple(pairCode)
    setIsJoining(false)

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Paired successfully!',
        description: 'You are now connected with your partner.',
      })
      router.refresh()
    }
  }

  async function copyPairCode() {
    const codeToCopy = myPairCode || userPairCode
    if (!codeToCopy) return
    await navigator.clipboard.writeText(codeToCopy)
    setCopied(true)
    toast({
      title: 'Copied!',
      description: 'Share this code with your partner.',
    })
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
          <Heart className="w-8 h-8 text-primary" fill="currentColor" />
        </div>
        <CardTitle className="text-xl font-serif">Connect with Your Partner</CardTitle>
        <CardDescription>
          Pair your accounts to start sharing moods, memories, and love
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="join" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="join" className="gap-2">
              <Link2 className="w-4 h-4" />
              Join
            </TabsTrigger>
            <TabsTrigger value="invite" className="gap-2">
              <Users className="w-4 h-4" />
              Invite
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="join" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="pairCode">Enter Pair Code</Label>
              <Input
                id="pairCode"
                placeholder="XXXXXX"
                value={pairCode}
                onChange={(e) => setPairCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="text-center text-lg tracking-widest font-mono"
              />
            </div>
            <Button 
              onClick={handleJoin} 
              className="w-full"
              disabled={isJoining || pairCode.length !== 6}
            >
              {isJoining ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4 mr-2" />
                  Connect
                </>
              )}
            </Button>
          </TabsContent>
          
          <TabsContent value="invite" className="space-y-4 mt-4">
            {myPairCode || userPairCode ? (
              <>
                <div className="space-y-2">
                  <Label>Your Pair Code</Label>
                  <div className="flex gap-2">
                    <Input
                      value={myPairCode || userPairCode || ''}
                      readOnly
                      className="text-center text-lg tracking-widest font-mono bg-muted"
                    />
                    <Button variant="outline" size="icon" onClick={copyPairCode}>
                      <Copy className={`w-4 h-4 ${copied ? 'text-green-500' : ''}`} />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Share this code with your partner so they can connect with you
                </p>
              </>
            ) : (
              <div className="text-center py-4 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Generate a unique code to share with your partner
                </p>
                <Button 
                  onClick={handleGenerateCode} 
                  className="w-full"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4 mr-2" />
                      Generate Invite Code
                    </>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
