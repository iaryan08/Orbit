"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, Quote, Heart } from "lucide-react";
import { cn, getISTDate } from "@/lib/utils";

interface DailyContentData {
  quote: string;
  challenge: string;
  tip: string;
}

const fallbackContent: DailyContentData = {
  quote: "Love is not about how many days, months, or years you have been together. Love is about how much you love each other every single day.",
  challenge: "Write down three things you appreciate about your partner and share them tonight over dinner.",
  tip: "Remember to express gratitude daily - a simple 'thank you' can strengthen your bond immensely.",
};

export function DailyContent() {
  const [content, setContent] = useState<DailyContentData>(fallbackContent);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"quote" | "challenge" | "tip">("quote");

  const fetchAIContent = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/daily-content", {
        method: "POST",
      });
      if (response.ok) {
        const data = await response.json();
        setContent(data);
      }
    } catch (error) {
      console.error("Failed to fetch AI content:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if we have cached content for today
    const cached = localStorage.getItem("dailyContent");
    const cachedDate = localStorage.getItem("dailyContentDate");

    // Get current time in IST (India Standard Time)
    const istDate = getISTDate();

    // Create a date string for "today" in IST based on 1 AM cutoff
    // If it's before 1 AM IST, use yesterday's date as "today"
    const cutoffHour = 1;
    const effectiveDate = new Date(istDate);
    if (istDate.getHours() < cutoffHour) {
      effectiveDate.setDate(effectiveDate.getDate() - 1);
    }
    const today = effectiveDate.toDateString();

    if (cached && cachedDate === today) {
      setContent(JSON.parse(cached));
    } else {
      fetchAIContent().then(() => {
        localStorage.setItem("dailyContent", JSON.stringify(content));
        localStorage.setItem("dailyContentDate", today);
      });
    }
  }, []);

  const tabs = [
    { id: "quote" as const, label: "Quote", icon: Quote },
    { id: "challenge" as const, label: "Challenge", icon: Heart },
    { id: "tip" as const, label: "Tip", icon: Sparkles },
  ];

  return (
    <Card className="border-none bg-transparent shadow-none" glassy={false}>
      <CardHeader className="pb-4 md:pb-2 p-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-serif text-white">
            <Sparkles className="h-5 w-5 text-cyan-400" />
            Daily Inspiration
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchAIContent}
            disabled={loading}
            className="h-8 w-8 text-white/70 hover:text-green-400 hover:bg-green-500/10 transition-all duration-300 group"
          >
            <RefreshCw className={cn(
              "h-4 w-4 transition-all duration-300 group-hover:text-glow-green",
              loading ? "animate-spin" : ""
            )} />
          </Button>
        </div>
        <div className="flex gap-1 mt-4 md:mt-2 p-1 bg-white/5 rounded-xl relative border border-white/5 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Button
                key={tab.id}
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 text-[9px] md:text-[10px] uppercase tracking-wider font-bold transition-all duration-300 relative z-10 h-9 md:h-10 px-2 md:px-4",
                  isActive ? "text-white" : "text-white/40 hover:text-white"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="daily-nav-indicator"
                    className="absolute inset-0 bg-white/10 border border-white/10 rounded-lg shadow-sm"
                    transition={{
                      type: "spring",
                      bounce: 0.2,
                      stiffness: 140,
                      damping: 18,
                    }}
                  />
                )}
                <tab.icon className={cn("h-3 w-3 relative z-10", isActive && "mr-1.5")} />
                {isActive && <span className="relative z-10">{tab.label}</span>}
              </Button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="px-0 pt-6">
        <div className="min-h-[100px] flex items-center justify-center">
          {loading ? (
            <div className="flex items-center gap-2 text-rose-100/60">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-[10px] uppercase tracking-widest font-bold">Getting inspiration...</span>
            </div>
          ) : (
            <p className="text-center text-rose-50 italic leading-relaxed text-sm md:text-base selection:bg-rose-500/30 px-4">
              {activeTab === "quote" && `"${content.quote}"`}
              {activeTab === "challenge" && content.challenge}
              {activeTab === "tip" && content.tip}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
