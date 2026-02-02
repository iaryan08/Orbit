'use server'

import { createClient } from '@/lib/supabase/server'
import { getTodayIST } from '@/lib/utils'
import { revalidatePath } from 'next/cache'
import Parser from 'rss-parser'
import { GoogleGenerativeAI } from '@google/generative-ai'

// --- Configuration ---
const parser = new Parser()
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '')

// RSS Feeds Map - Expanded to cover all 8 categories
const FEED_URLS = {
    // Sex Tips & Pleasure
    sex_tips: "https://www.psychologytoday.com/us/front/sex/feed",
    pleasure: "https://www.psychologytoday.com/us/front/orgasm/feed",

    // Relationships & Communication
    relationships: "https://www.psychologytoday.com/us/front/relationships/feed",
    marriage: "https://www.psychologytoday.com/us/front/marriage/feed",

    // Health & Reproductive
    health_news: "https://www.sciencedaily.com/rss/health_medicine/sexual_health.xml",
    reproductive: "https://www.sciencedaily.com/rss/health_medicine/reproductive_health.xml",
    womens_health: "https://www.sciencedaily.com/rss/health_medicine/womens_health.xml",

    // Mental Health & Connection
    well_being: "https://www.psychologytoday.com/us/front/well-being/feed",
    intimacy: "https://www.psychologytoday.com/us/front/intimacy/feed",
}
const GLOBAL_ID = '00000000-0000-0000-0000-000000000000' // Use a static UUID for global cache

// --- Main Actions ---

/**
 * Fetches RSS content globally. Designed to be called by a CRON job at 6 AM IST.
 */
export async function syncGlobalRSS() {
    const supabase = await createClient()
    const today = getTodayIST()

    console.log(`[Cron] Syncing Global RSS for ${today}`)

    const rssContent = await fetchRSSFeeds()

    // Save/Upsert to Global entry
    const { error } = await supabase
        .from('couple_insights')
        .upsert({
            couple_id: GLOBAL_ID,
            insight_date: today,
            content: rssContent
        }, { onConflict: 'couple_id, insight_date' })

    if (error) {
        console.error("Error caching global RSS:", error)
        return { success: false, error }
    }

    return { success: true, count: rssContent.length }
}

/**
 * Main function used by the UI. 
 * Combines cached Global RSS + Personalized Gemini Tip.
 */
export async function getDailyInsights(coupleId: string) {
    const supabase = await createClient()
    const today = getTodayIST()

    console.log(`[Insights] Fetching insights for couple ${coupleId} on ${today}`)

    // 1. Check if we already have cached combined content for this couple today
    const { data: existingCouple } = await supabase
        .from('couple_insights')
        .select('content')
        .eq('couple_id', coupleId)
        .eq('insight_date', today)
        .single()

    if (existingCouple && existingCouple.content && (existingCouple.content as any[]).length >= 8) {
        console.log('[Insights] ✅ Returning cached content for couple')
        return { success: true, data: existingCouple.content, source: 'couple-cache' }
    }

    // 2. Fetch GLOBAL RSS cache (populated by 6AM cron job)
    console.log('[Insights] Fetching global RSS cache...')
    const { data: globalRSS } = await supabase
        .from('couple_insights')
        .select('content')
        .eq('couple_id', GLOBAL_ID)
        .eq('insight_date', today)
        .single()

    let rssContent = (globalRSS?.content || []) as any[]
    console.log(`[Insights] Global RSS cache has ${rssContent.length} items`)

    // Fallback: If global cache is empty, fetch live RSS (shouldn't happen if cron works)
    if (rssContent.length < 10) {
        console.warn('[Insights] ⚠️ Global RSS cache is low/empty, fetching live...')
        rssContent = await fetchRSSFeeds()
        console.log(`[Insights] Live RSS fetched: ${rssContent.length} items`)
    }

    // 3. Generate "Just For You" tips via Gemini (couple-specific)
    console.log('[Insights] Generating couple-specific "Just For You" tips...')
    const justForYouTips = await generateJustForYouTips(coupleId)
    console.log(`[Insights] Generated ${justForYouTips.length} "Just For You" tips`)

    // 4. Combine RSS (7 categories) + Gemini ("Just For You")
    const combinedContent = [
        ...justForYouTips,
        ...rssContent
    ]

    console.log(`[Insights] Final combined content: ${combinedContent.length} items`)
    console.log('[Insights] Categories:', [...new Set(combinedContent.map(i => i.category))])

    // 5. Cache combined content for this couple
    await supabase
        .from('couple_insights')
        .upsert({
            couple_id: coupleId,
            insight_date: today,
            content: combinedContent
        }, { onConflict: 'couple_id, insight_date' })

    console.log('[Insights] ✅ Cached combined content for couple')

    return { success: true, data: combinedContent, source: 'fresh-cached' }
}

// --- Internal Helpers ---

async function fetchRSSFeeds() {
    const items: any[] = []

    // Pool of diverse Unsplash image IDs for random selection
    const imagePool = [
        "photo-1518568814500-bf0f8d125f46", "photo-1522673607200-164d1b6ce486",
        "photo-1516589178581-6cd7833ae3b2", "photo-1511988617509-a57c8a288659",
        "photo-1505751172876-fa1923c5c528", "photo-1584515933487-779824d29309",
        "photo-1494587351196-bbf5f29cff42", "photo-1519708227418-c8fd9a32b7a2",
        "photo-1529333166437-7750a6dd5a70", "photo-1576091160550-2173dba999ef",
        "photo-1518199266791-5375a83190b7", "photo-1515377905703-c4788e51af15",
        "photo-1508214751196-bcfd4ca60f91", "photo-1542596768-5d1d21f1cf98",
        "photo-1579165466741-7f35a4755657", "photo-1573496359142-b8d87734a5a2",
        "photo-1521791055366-0d553872125f", "photo-1532938911079-1b06ac7ceec7"
    ]

    // Function to get random unique image
    const getRandomImage = () => {
        const randomId = imagePool[Math.floor(Math.random() * imagePool.length)]
        return `https://images.unsplash.com/${randomId}?w=800&auto=format&fit=crop&q=80`
    }

    try {
        const [sexFeed, pleasureFeed, newsFeed, reproFeed, womensFeed, relFeed, marriageFeed, wellBeingFeed, intimacyFeed] = await Promise.all([
            parser.parseURL(FEED_URLS.sex_tips).catch(() => null),
            parser.parseURL(FEED_URLS.pleasure).catch(() => null),
            parser.parseURL(FEED_URLS.health_news).catch(() => null),
            parser.parseURL(FEED_URLS.reproductive).catch(() => null),
            parser.parseURL(FEED_URLS.womens_health).catch(() => null),
            parser.parseURL(FEED_URLS.relationships).catch(() => null),
            parser.parseURL(FEED_URLS.marriage).catch(() => null),
            parser.parseURL(FEED_URLS.well_being).catch(() => null),
            parser.parseURL(FEED_URLS.intimacy).catch(() => null),
        ])

        // SEX TIPS
        if (sexFeed) {
            sexFeed.items.slice(0, 8).forEach((item: any) => {
                items.push({
                    category: "Sex Tips",
                    title: item.title,
                    content: item.contentSnippet || item.content?.substring(0, 400) + "...",
                    image_url: getRandomImage()
                })
            })
        }

        // ORGASM & PLEASURE
        if (pleasureFeed) {
            pleasureFeed.items.slice(0, 6).forEach((item: any) => {
                items.push({
                    category: "Orgasm & Pleasure",
                    title: item.title,
                    content: item.contentSnippet || item.content?.substring(0, 400) + "...",
                    image_url: getRandomImage()
                })
            })
        }

        // LATEST NEWS
        if (newsFeed) {
            newsFeed.items.slice(0, 8).forEach((item: any) => {
                items.push({
                    category: "Latest News",
                    title: item.title,
                    content: item.contentSnippet || item.content?.substring(0, 400) + "...",
                    image_url: getRandomImage()
                })
            })
        }

        // REPRODUCTIVE HEALTH
        if (reproFeed) {
            reproFeed.items.slice(0, 6).forEach((item: any) => {
                items.push({
                    category: "Reproductive Health",
                    title: item.title,
                    content: item.contentSnippet || item.content?.substring(0, 400) + "...",
                    image_url: getRandomImage()
                })
            })
        }
        if (womensFeed) {
            womensFeed.items.slice(0, 6).forEach((item: any) => {
                items.push({
                    category: "Reproductive Health",
                    title: item.title,
                    content: item.contentSnippet || item.content?.substring(0, 400) + "...",
                    image_url: getRandomImage()
                })
            })
        }

        // LET'S TALK
        if (relFeed) {
            relFeed.items.slice(0, 7).forEach((item: any) => {
                items.push({
                    category: "Let's Talk",
                    title: item.title,
                    content: item.contentSnippet || item.content?.substring(0, 400) + "...",
                    image_url: getRandomImage()
                })
            })
        }

        // COMMON WORRIES
        if (marriageFeed) {
            marriageFeed.items.slice(0, 5).forEach((item: any) => {
                items.push({
                    category: "Common Worries",
                    title: item.title,
                    content: item.contentSnippet || item.content?.substring(0, 400) + "...",
                    image_url: getRandomImage()
                })
            })
        }
        if (intimacyFeed) {
            intimacyFeed.items.slice(0, 5).forEach((item: any) => {
                items.push({
                    category: "Common Worries",
                    title: item.title,
                    content: item.contentSnippet || item.content?.substring(0, 400) + "...",
                    image_url: getRandomImage()
                })
            })
        }

        console.log(`[RSS] Fetched ${items.length} total items from all feeds`)
        return items
    } catch (error) {
        console.error("RSS fetch error:", error)
        return []
    }
}

/**
 * Generate couple-specific "Just For You" tips using Gemini AI
 * This is the ONLY category that uses Gemini (to minimize costs)
 * All other categories come from cached RSS feeds
 */
async function generateJustForYouTips(coupleId: string) {
    // Fallback content if Gemini fails
    const fallbackTips = [
        { category: "Just For You", title: "Daily Connection Ritual", content: "Spend 5 uninterrupted minutes sharing your day. No phones, just presence.", image_url: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&auto=format&fit=crop" },
        { category: "Just For You", title: "Mindful Intimacy", content: "Try focusing entirely on sensations rather than outcomes. Explore touch without expectations.", image_url: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&auto=format&fit=crop" },
        { category: "Just For You", title: "Weekly Check-In", content: "Set aside time each week to discuss what's working and what needs attention in your relationship.", image_url: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&auto=format&fit=crop" },
    ]

    if (!process.env.GOOGLE_API_KEY) {
        return fallbackTips
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" })
        const prompt = `Generate EXACTLY 4 personalized wellness tips for a couple in the "Just For You" category.

These tips should be about:
- Daily connection rituals
- Emotional intimacy
- Quality time together
- Relationship maintenance
- Mindfulness practices

Requirements:
- Each tip must have a unique, creative title (NOT "Tip #1")
- Content should be warm, intimate, and actionable
- Return EXACTLY 4 items as JSON array
- ALL items must have category "Just For You"

Format: [{ "category": "Just For You", "title": "Creative title here", "content": "Helpful advice..." }]`

        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()

        console.log("[Gemini] Generated tips raw:", text)

        const jsonBlock = text.replace(/```json/g, '').replace(/```/g, '').trim()
        const data = JSON.parse(jsonBlock)

        // Ensure all tips are "Just For You" category and add images
        return data.map((tip: any) => ({
            category: "Just For You",
            title: tip.title,
            content: tip.content,
            image_url: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&auto=format&fit=crop"
        }))
    } catch (e) {
        console.error("[Gemini] Just For You tip generation failed:", e)
        return fallbackTips
    }
}

