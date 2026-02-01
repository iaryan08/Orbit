import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heart, Mail } from 'lucide-react'

export default function SignUpSuccessPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>
      
      <Card className="w-full max-w-md relative z-10 border-border/50 shadow-xl text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <Mail className="w-10 h-10 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-serif">Check Your Email</CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              {"We've sent you a confirmation link"}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Please check your email inbox and click the confirmation link to verify your account. 
            Once verified, you can sign in and start creating your love space!
          </p>
          
          <div className="flex items-center justify-center gap-2 text-primary">
            <Heart className="w-4 h-4" fill="currentColor" />
            <span className="text-sm font-medium">Love awaits!</span>
            <Heart className="w-4 h-4" fill="currentColor" />
          </div>
        </CardContent>
        
        <CardFooter>
          <Button asChild className="w-full">
            <Link href="/auth/login">Go to Sign In</Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}
