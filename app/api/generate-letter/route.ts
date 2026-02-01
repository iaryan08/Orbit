import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const generationPrompt = `Write a heartfelt, romantic love letter based on this theme: "${prompt}". 
    
    Guidelines:
    - Make it personal and emotional
    - Keep it between 100-200 words
    - Use beautiful, poetic language
    - Express deep love and appreciation
    - Make it suitable for a couple who truly love each other
    
    Write only the letter content, no salutation or signature needed.`;

    const result = await model.generateContent(generationPrompt);
    const response = await result.response;
    const content = response.text();

    return NextResponse.json({ content });
  } catch (error) {
    console.error("Error generating letter:", error);
    return NextResponse.json({
      content: "My darling, every moment with you feels like a beautiful dream I never want to wake from. Your smile lights up my world, and your love gives me strength I never knew I had. I am endlessly grateful for the love we share, for the laughter, the quiet moments, and everything in between. You are my heart, my home, my forever love.",
    });
  }
}
