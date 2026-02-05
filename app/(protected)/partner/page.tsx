
import { fetchDashboardData } from '@/lib/actions/consolidated'
import { LunaraTabPartner } from '@/components/lunara/lunara-tab-partner'
import { LunaraHeader } from '@/components/lunara/lunara-header'
import { redirect } from 'next/navigation'

export default async function LunaraPartnerPage() {
    const result = await fetchDashboardData()
    if (!result.success || !result.data) {
        redirect('/dashboard')
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 pt-12 pb-8 px-6 md:px-8">
            <LunaraHeader tab="partner" />
            <div className="min-h-[500px]">
                <LunaraTabPartner data={result.data} />
            </div>
        </div>
    )
}
