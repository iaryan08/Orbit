import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const prompt = `Generate romantic and thoughtful content for a couple's daily inspiration. Return a JSON object with exactly these three fields:
    1. "quote": A beautiful, romantic love quote (can be original or from famous sources)
    2. "challenge": A fun and romantic daily challenge for couples to do together
    3. "tip": A helpful relationship tip to strengthen their bond

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
