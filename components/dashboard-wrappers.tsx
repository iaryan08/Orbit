import { fetchBucketListData, fetchOnThisDayData } from '@/lib/actions/consolidated'
import { SharedBucketList } from '@/components/shared-bucket-list'
import { OnThisDay } from '@/components/on-this-day'
import { DailyContent as DailyContentUI } from '@/components/daily-content'
import { ScrollReveal } from '@/components/scroll-reveal'

function hasContent(value: unknown) {
    if (value === null || value === undefined) return false
    if (typeof value === 'string') return value.trim().length > 0
    if (Array.isArray(value)) return value.length > 0
    return true
}

function getValidOnThisDay(data: { memories: any[]; milestones: any[] }) {
    const memories = (data.memories || []).filter((m: any) =>
        hasContent(m?.title) || hasContent(m?.description) || hasContent(m?.image_urls)
    )

    const milestones = (data.milestones || []).filter((m: any) =>
        hasContent(m?.category) || hasContent(m?.content_user1) || hasContent(m?.content_user2)
    )

    return { memories, milestones }
}

export async function BucketListWrapper({ coupleId }: { coupleId: string }) {
    const items = await fetchBucketListData(coupleId)
    return (
        <ScrollReveal className="h-full lg:col-span-2" delay={0.45}>
            <div className="h-full min-h-[400px]">
                <SharedBucketList initialItems={items} />
            </div>
        </ScrollReveal>
    )
}

export async function OnThisDayWrapper({ coupleId, partnerName }: { coupleId: string, partnerName: string }) {
    const raw = await fetchOnThisDayData(coupleId)
    const data = getValidOnThisDay(raw)
    if (data.memories.length === 0 && data.milestones.length === 0) return null

    return (
        <ScrollReveal className="h-full lg:col-span-2" delay={0.4}>
            <div className="h-full min-h-[400px]">
                <OnThisDay memories={data.memories} milestones={data.milestones} partnerName={partnerName} />
            </div>
        </ScrollReveal>
    )
}

export async function CoupleMomentsWrapper({ coupleId, partnerName }: { coupleId: string, partnerName: string }) {
    const [onThisDayRaw, bucketItems] = await Promise.all([
        fetchOnThisDayData(coupleId),
        fetchBucketListData(coupleId)
    ])
    const onThisDayData = getValidOnThisDay(onThisDayRaw)

    const hasOnThisDay = onThisDayData.memories.length > 0 || onThisDayData.milestones.length > 0

    return (
        <>
            {hasOnThisDay && (
                <ScrollReveal className="h-full lg:col-span-2" delay={0.4}>
                    <div className="h-full min-h-[400px]">
                        <OnThisDay
                            memories={onThisDayData.memories}
                            milestones={onThisDayData.milestones}
                            partnerName={partnerName}
                        />
                    </div>
                </ScrollReveal>
            )}
            <ScrollReveal className={hasOnThisDay ? "h-full lg:col-span-2" : "h-full lg:col-span-4"} delay={0.45}>
                <div className="h-full min-h-[400px]">
                    <SharedBucketList initialItems={bucketItems} />
                </div>
            </ScrollReveal>
        </>
    )
}

export function DailyContentWrapper() {
    return (
        <ScrollReveal className="lg:col-span-2 h-full" delay={0.3}>
            <div className="glass-card p-4 md:p-5 flex flex-col justify-between relative overflow-hidden group h-[400px] lg:h-[340px]">
                <DailyContentUI />
            </div>
        </ScrollReveal>
    )
}

export function DashboardSkeleton({ className }: { className?: string }) {
    return <div className={`rounded-3xl bg-white/5 animate-pulse ${className}`} />
}
