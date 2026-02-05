import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = 'edge';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { phase, day, partnerName } = await req.json();

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Generate 4 specific, actionable, and thoughtful ways to support a partner who is currently in their ${phase} (Day ${day} of their cycle).
    
    The partner's name is ${partnerName}. 
    
    The suggestions should be categorized into these 4 types:
    1. "physical" (e.g., foot massage, heating pad)
    2. "emotional" (e.g., extra listening, affirmation)
    3. "logistical" (e.g., doing a chore she usually does, cooking)
    4. "surprise" (e.g., a small treat, a flower)

    Return a JSON array of objects, where each object has:
    - "id": a unique string
    - "type": one of the 4 categories above
    - "text": the specific suggestion (concise, 1 sentence)
    - "description": why this helps during this specific cycle phase

    Keep it romantic, supportive, and practical.
    Return ONLY the JSON array, no additional text.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const suggestions = JSON.parse(jsonMatch[0]);
            return NextResponse.json(suggestions);
        }

        throw new Error("Invalid AI response format");
    } catch (error: any) {
        console.error("Error generating support suggestions:", error);
        return NextResponse.json([
            { id: '1', type: 'physical', text: 'Prepare a warm tea and bring a heating pad.', description: 'Helps with physical comfort during this phase.' },
            { id: '2', type: 'emotional', text: 'Listen intently without offering solutions.', description: 'Emotional support is highly valued now.' },
            { id: '3', type: 'logistical', text: 'Take care of dinner tonight.', description: 'Reduces her mental load and stress.' },
            { id: '4', type: 'surprise', text: 'Get her favorite healthy snack.', description: 'A small gesture that shows you care.' }
        ]);
    }
}
