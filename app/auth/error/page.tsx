import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function AuthErrorPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md border-destructive/50 shadow-xl text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-destructive" />
          </div>
          <div>
            <CardTitle className="text-2xl font-serif">Authentication Error</CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              Something went wrong during authentication
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <p className="text-sm text-muted-foreground">
            There was a problem signing you in. This could be because the link expired 
            or there was an issue with your credentials. Please try again.
          </p>
        </CardContent>
        
        <CardFooter className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link href="/auth/login">Try Again</Link>
          </Button>
          <Button asChild variant="outline" className="w-full bg-transparent">
            <Link href="/auth/sign-up">Create New Account</Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}
