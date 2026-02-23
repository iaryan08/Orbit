import { Suspense } from 'react'
import { fetchBucketListData, fetchOnThisDayData } from '@/lib/actions/consolidated'
import { SharedBucketList } from '@/components/shared-bucket-list'
import { OnThisDay } from '@/components/on-this-day'
import { DailyContent as DailyContentUI } from '@/components/daily-content'
import { ScrollReveal } from '@/components/scroll-reveal'

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
    const data = await fetchOnThisDayData(coupleId)
    if (data.memories.length === 0 && data.milestones.length === 0) return null

    return (
        <ScrollReveal className="h-full lg:col-span-2" delay={0.4}>
            <div className="h-full min-h-[400px]">
                <OnThisDay memories={data.memories} milestones={data.milestones} partnerName={partnerName} />
            </div>
        </ScrollReveal>
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
