'use client'

import { useActionState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Heart, Mail, Lock, Loader2, AlertCircle } from 'lucide-react'
import { signIn } from '@/lib/actions/auth'
import { useToast } from '@/hooks/use-toast'

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(signIn, null)
  const { toast } = useToast()

  useEffect(() => {
    if (state?.error) {
      toast({
        title: 'Error signing in',
        description: state.error,
        variant: 'destructive',
      })
    }
  }, [state, toast])

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-lg relative z-10 border-border/50 shadow-2xl">
        <CardHeader className="text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-white/5 rounded-full flex items-center justify-center shadow-inner ring-1 ring-white/10 backdrop-blur-md">
            <svg width="0" height="0" className="absolute">
              <defs>
                <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f472b6" />
                  <stop offset="50%" stopColor="#e2556f" />
                  <stop offset="100%" stopColor="#d98b75" />
                </linearGradient>
              </defs>
            </svg>
            <Heart
              className="w-10 h-10 animate-heart-bounce drop-shadow-lg"
              style={{ fill: 'url(#heartGradient)' }}
              strokeWidth={1.5}
              stroke="rgba(255,255,255,0.2)"
            />
          </div>
          <div>
            <CardTitle className="text-4xl font-serif text-vibrant-animate tracking-tight">Welcome Back</CardTitle>
            <CardDescription className="text-rose-100/70 mt-2">
              Sign in to your love space
            </CardDescription>
          </div>
        </CardHeader>

        <form action={formAction}>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-rose-50 font-medium tracking-wide">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-300/40" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-12 text-rose-50 placeholder:text-white/30"
                  activeBorderClassName="border-veritas-pink"
                  required
                />
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-rose-50 font-medium tracking-wide">Password</Label>
                <div className="flex items-center gap-1 text-[10px] text-rose-300/60 uppercase tracking-widest font-bold">
                  <AlertCircle className="w-3 h-3" />
                  <span>Secure access</span>
                </div>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-300/40" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  className="pl-12 text-rose-50 placeholder:text-white/30"
                  activeBorderClassName="border-veritas-pink"
                  required
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-6 pt-2">
            <Button type="submit" className="w-full h-12 btn-auth-hover" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>

            <p className="text-sm text-rose-100/60 text-center">
              {"Don't have an account? "}
              <Link href="/auth/sign-up" className="text-primary hover:text-white hover:underline font-bold transition-colors">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  )
}
