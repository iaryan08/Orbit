import { createClient } from '@/lib/supabase/server'
import { AdminTools } from '@/components/admin-tools'
import { redirect } from 'next/navigation'

export default async function AdminPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (!profile?.couple_id) {
        return (
            <div className="flex items-center justify-center min-h-screen text-white/50">
                You must be paired to use admin tools.
            </div>
        )
    }

    const { data: couple } = await supabase
        .from('couples')
        .select('*')
        .eq('id', profile.couple_id)
        .single()

    if (!couple) {
        return (
            <div className="flex items-center justify-center min-h-screen text-white/50">
                Invalid couple data.
            </div>
        )
    }

    const partnerId = couple.user1_id === user.id ? couple.user2_id : couple.user1_id

    if (!partnerId) {
        return (
            <div className="flex items-center justify-center min-h-screen text-white/50">
                No partner found.
            </div>
        )
    }

    return (
        <div className="max-w-md mx-auto py-12 px-6">
            <h1 className="text-3xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-200 to-amber-200 mb-8 text-center tracking-wider">
                Admin Console
            </h1>
            <AdminTools partnerId={partnerId} userId={user.id} />
        </div>
    )
}
