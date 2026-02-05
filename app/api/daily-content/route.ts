import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getISTDate } from "@/lib/utils";

export const runtime = 'edge';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST() {
  const supabase = await createClient();

  // 1. Calculate the "Effective Date" in IST based on 12:05 AM cutoff
  const istNow = getISTDate();
  const currentHour = istNow.getHours();
  const currentMinute = istNow.getMinutes();

  const effectiveDate = new Date(istNow);
  // If it's before 12:05 AM, it's still "yesterday" for inspiration purposes
  if (currentHour === 0 && currentMinute < 5) {
    effectiveDate.setDate(effectiveDate.getDate() - 1);
  }

  const todayStr = effectiveDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

  try {
    // 2. Check Database Cache First
    const { data: cachedData, error: cacheError } = await supabase
      .from('global_insights_cache')
      .select('content')
      .eq('insight_date', todayStr)
      .single();

    if (cachedData && !cacheError) {
      return NextResponse.json(cachedData.content);
    }

    // 3. Cache Miss: Call Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const prompt = `Generate romantic and thoughtful content for a couple's daily inspiration.
    
    Return a JSON object with exactly these three fields:
    1. "quote": A beautiful, romantic love quote (suitable for any couple)
    2. "challenge": A fun and romantic daily challenge for partners to do for each other.
    3. "tip": A helpful relationship tip to strengthen their bond.

    Keep each response concise (1-2 sentences max). Make it warm, loving, and encouraging.
    Return ONLY the JSON object, no additional text.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const content = JSON.parse(jsonMatch[0]);

      // 4. Store in Database Cache
      await supabase.from('global_insights_cache').upsert({
        insight_date: todayStr,
        content: content
      });

      // 5. Cleanup: Delete old cache entries (older than today)
      await supabase
        .from('global_insights_cache')
        .delete()
        .lt('insight_date', todayStr);

      return NextResponse.json(content);
    }

    throw new Error("Failed to parse AI response");
  } catch (error) {
    console.error("Error with daily content logic:", error);
    // Fallback content (static)
    return NextResponse.json({
      quote: "Love is not about how many days, months, or years you have been together. Love is about how much you love each other every single day.",
      challenge: "Write down three things you appreciate about your partner and share them tonight.",
      tip: "Remember to express gratitude daily - a simple 'thank you' can strengthen your bond immensely.",
    });
  }
}
