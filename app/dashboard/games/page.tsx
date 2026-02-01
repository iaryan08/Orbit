"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Gamepad2, Heart, Flame, Sparkles, MessageCircle, Dice6 } from "lucide-react";
import { TruthOrDare } from "@/components/games/truth-or-dare";
import { WouldYouRather } from "@/components/games/would-you-rather";
import { LoveQuiz } from "@/components/games/love-quiz";

type GameType = "menu" | "truth-or-dare" | "would-you-rather" | "love-quiz";

const games = [
  {
    id: "truth-or-dare" as const,
    title: "Truth or Dare",
    description: "Spicy questions and fun challenges for couples",
    icon: Flame,
    badge: "Popular",
    color: "text-orange-500",
  },
  {
    id: "would-you-rather" as const,
    title: "Would You Rather",
    description: "Fun dilemmas to discover more about each other",
    icon: MessageCircle,
    badge: "Fun",
    color: "text-blue-500",
  },
  {
    id: "love-quiz" as const,
    title: "Love Quiz",
    description: "Test how well you know your partner",
    icon: Heart,
    badge: "Romantic",
    color: "text-primary",
  },
];

export default function GamesPage() {
  const [activeGame, setActiveGame] = useState<GameType>("menu");

  if (activeGame === "truth-or-dare") {
    return <TruthOrDare onBack={() => setActiveGame("menu")} />;
  }

  if (activeGame === "would-you-rather") {
    return <WouldYouRather onBack={() => setActiveGame("menu")} />;
  }

  if (activeGame === "love-quiz") {
    return <LoveQuiz onBack={() => setActiveGame("menu")} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-semibold text-white flex items-center gap-3 text-glow-white">
          <Gamepad2 className="h-7 w-7 text-amber-200" />
          Couple Games
        </h1>
        <p className="text-white/60 mt-1 uppercase tracking-widest text-[10px] font-bold">Have fun and connect with playful activities</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => (
          <Card
            key={game.id}
            className="cursor-pointer transition-all duration-500 hover:shadow-2xl hover:border-primary/60 hover:-translate-y-2 group relative overflow-hidden"
            onClick={() => setActiveGame(game.id)}
          >
            <div className="absolute top-0 right-0 p-16 bg-white/5 blur-[40px] rounded-full pointer-events-none group-hover:bg-primary/10 transition-colors" />

            <CardHeader className="relative z-10">
              <div className="flex items-start justify-between">
                <div className={`p-4 rounded-2xl bg-black/40 border border-white/10 ${game.color} group-hover:scale-110 transition-transform duration-500`}>
                  <game.icon className="h-7 w-7" />
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[9px] uppercase tracking-[0.2em] font-black border px-2 py-0.5",
                      game.badge === "Popular" && "bg-[#008000]/20 text-green-400 border-green-500/30",
                      game.badge === "Fun" && "bg-blue-500/20 text-blue-300 border-blue-500/30",
                      game.badge === "Romantic" && "bg-rose-500/20 text-rose-300 border-rose-500/30"
                    )}
                  >
                    {game.badge}
                  </Badge>
                  <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-amber-200/80">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                    Real-time Multi-sync
                  </div>
                </div>
              </div>
              <CardTitle className="text-xl mt-6 text-white font-serif font-bold text-glow-white">{game.title}</CardTitle>
              <CardDescription className="text-white/60 line-clamp-2 leading-relaxed text-sm mt-1">{game.description}</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <Button className="w-full btn-rosy rounded-xl py-6 font-black uppercase tracking-widest text-xs group-hover:shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all">
                Play Online
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed border-white/10 bg-white/5">
        <CardContent className="flex flex-col items-center justify-center py-10">
          <Sparkles className="h-10 w-10 text-amber-200/60 mb-4 animate-pulse" />
          <h3 className="font-bold text-white text-lg mb-2">More Games Coming Soon!</h3>
          <p className="text-white/50 text-center text-sm uppercase tracking-widest font-medium">
            We are working on exciting new games for couples
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
