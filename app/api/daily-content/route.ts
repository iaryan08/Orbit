import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let userGender = 'user';
  let userName = 'Partner';

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('gender, display_name')
      .eq('id', user.id)
      .single();

    if (profile) {
      userGender = profile.gender || 'user';
      userName = profile.display_name || 'Partner';
    }
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Generate romantic and thoughtful content for a couple's daily inspiration. 
    The user's name is ${userName} and their gender is ${userGender}.
    
    Return a JSON object with exactly these three fields:
    1. "quote": A beautiful, romantic love quote (tailored for a ${userGender})
    2. "challenge": A fun and romantic daily challenge for ${userName} to do for their partner.
    3. "tip": A helpful relationship tip to strengthen their bond, considering the user is a ${userGender}.

    Keep each response concise (1-2 sentences max). Make it warm, loving, and encouraging.
    Return ONLY the JSON object, no additional text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const content = JSON.parse(jsonMatch[0]);
      return NextResponse.json(content);
    }

    // Fallback content
    return NextResponse.json({
      quote: "In all the world, there is no heart for me like yours.",
      challenge: "Send your partner a surprise love note today - hide it somewhere they will find it!",
      tip: "Take time to truly listen when your partner speaks. Active listening builds deeper connection.",
    });
  } catch (error) {
    console.error("Error generating daily content:", error);
    return NextResponse.json({
      quote: "Love grows more tremendously full, swift, poignant, as the years multiply.",
      challenge: "Share a favorite memory together and talk about why it means so much to you.",
      tip: "Small gestures of kindness every day matter more than grand gestures once in a while.",
    });
  }
}
