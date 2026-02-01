import React from "react"
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Heart, MessageCircleHeart, ImageIcon, Gamepad2, Lock, Sparkles } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-24">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-primary/20 rounded-full blur-[100px] opacity-60 animate-pulse-slow" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-[120px] opacity-40 animate-pulse-slow" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl opacity-30" />
        </div>

        <div className="relative container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-10">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass border-white/10 text-secondary text-sm text-amber-400 font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(236,209,213,0.1)]">
              <Lock className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400">Private & Secure</span>
            </div>

            <h1 className="text-5xl md:text-8xl font-serif font-black text-white balance leading-[1] tracking-tight text-glow-white">
              Moon Between Us
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-rose-300 to-secondary mt-2 italic animate-pulse-slow"> Love & Connection</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light">
              A beautiful, private website just for the two of you. Share moods, write love letters,
              store memories, and play fun games together.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
              <Button size="lg" variant="premium" className="text-lg px-12 py-8 rounded-full shadow-2xl shadow-primary/20 transition-transform hover:scale-105" asChild>
                <Link href="/auth/sign-up">
                  <Heart className="w-5 h-5 mr-3 fill-current" />
                  Start Your Journey
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-12 py-8 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-primary rounded-full backdrop-blur-md transition-all hover:border-primary/30" asChild>
                <Link href="/auth/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6 text-glow-rose">
              Everything You Need
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-8 rounded-full opacity-50 " />
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed font-light">
              Designed with love to help you stay connected with your partner,
              no matter the distance.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            <FeatureCard
              icon={<Sparkles className="w-7 h-7" />}
              title="Daily Mood Check-in"
              description="Share how you're feeling and see your partner's mood in real-time with expressive emojis"
            />
            <FeatureCard
              icon={<MessageCircleHeart className="w-7 h-7" />}
              title="Love Letters Vault"
              description="Write and receive heartfelt letters that are securely stored forever"
            />
            <FeatureCard
              icon={<ImageIcon className="w-7 h-7" />}
              title="Shared Memories"
              description="Upload photos and create a beautiful timeline of your journey together"
            />
            <FeatureCard
              icon={<Gamepad2 className="w-7 h-7" />}
              title="Fun Couple Games"
              description="Play Truth or Dare, quizzes, and other games to keep the spark alive"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-10 glass-card p-16 rounded-[4rem] border-white/10 bg-black/30 relative overflow-hidden group">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 blur-[100px] rounded-full group-hover:bg-primary/30 transition-all duration-1000" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-secondary/10 blur-[100px] rounded-full group-hover:bg-secondary/20 transition-all duration-1000" />

            <Heart className="w-24 h-24 text-primary mx-auto filter drop-shadow-[0_0_25px_rgba(244,114,182,0.4)] animate-heart-bounce" fill="currentColor" />
            <h2 className="text-4xl md:text-6xl font-serif font-bold text-white leading-[1] text-glow-white">
              Start Your Love Story Today
            </h2>
            <p className="text-muted-foreground text-xl max-w-xl mx-auto leading-relaxed font-light">
              Create your private couple's space in seconds. It's free, secure, and made with love.
            </p>
            <Button size="lg" variant="premium" className="text-xl px-16 py-10 rounded-full shadow-[0_0_40px_rgba(244,114,182,0.3)] hover:shadow-[0_0_60px_rgba(244,114,182,0.5)] transition-all transform hover:scale-105" asChild>
              <Link href="/auth/sign-up">
                Create Your Space
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <Heart className="w-6 h-6 text-primary" fill="currentColor" />
              <span className="font-serif font-bold text-xl text-white tracking-tight">MoonBetweenUs</span>
            </div>
            <p className="text-muted-foreground font-medium text-sm">
              Made with love for couples everywhere
            </p>
            <div className="flex gap-6 text-sm font-bold uppercase tracking-widest text-muted-foreground/60">
              <a href="#" className="hover:text-primary transition-colors">Privacy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="glass-card p-10 hover:bg-white/5 transition-all duration-700 hover:translate-y-[-8px] hover:shadow-[0_20px_40px_-5px_rgba(0,0,0,0.5)] border-white/5 group relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/10 text-rose-300 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-500 shadow-[0_0_20px_rgba(244,114,182,0.15)] ring-1 ring-white/10">
        {icon}
      </div>
      <h3 className="font-bold text-2xl text-white mb-4 leading-tight group-hover:text-rose-300 transition-colors">{title}</h3>
      <p className="text-white/70 leading-relaxed font-medium group-hover:text-white/90 transition-colors">{description}</p>
    </div>
  )
}
