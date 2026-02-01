'use client'

import { useActionState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Heart, Mail, Lock, User, Loader2 } from 'lucide-react'
import { signUp } from '@/lib/actions/auth'
import { useToast } from '@/hooks/use-toast'

export default function SignUpPage() {
  const [state, formAction, isPending] = useActionState(signUp, null)
  const { toast } = useToast()

  useEffect(() => {
    if (state?.error) {
      toast({
        title: 'Error signing up',
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

      <Card className="w-full max-w-md relative z-10 border-border/50 shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Heart className="w-8 h-8 text-primary" fill="currentColor" />
          </div>
          <div>
            <CardTitle className="text-2xl font-serif text-rose-50 tracking-wide">Create Your Space</CardTitle>
            <CardDescription className="text-rose-100/70 mt-2">
              Start your journey of love together
            </CardDescription>
          </div>
        </CardHeader>

        <form action={formAction}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-rose-50/90 font-medium">Display Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-300/40" />
                <Input
                  id="displayName"
                  name="displayName"
                  type="text"
                  placeholder="Your name"
                  className="pl-10 h-11 bg-white/5 border-white/10 text-rose-50 placeholder:text-white/30"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-rose-50/90 font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-300/40" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10 h-11 bg-white/5 border-white/10 text-rose-50 placeholder:text-white/30"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-rose-50/90 font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-300/40" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Create a password"
                  className="pl-10 h-11 bg-white/5 border-white/10 text-rose-50 placeholder:text-white/30"
                  minLength={6}
                  required
                />
              </div>
              <p className="text-[10px] uppercase tracking-widest text-rose-100/40 font-bold ml-1">Must be at least 6 characters</p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full h-11 text-base font-bold shadow-lg shadow-primary/10" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>

            <p className="text-sm text-rose-100/60 text-center">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary hover:underline font-bold transition-colors">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  )
}
