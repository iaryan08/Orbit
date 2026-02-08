import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

async function check() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, display_name, city, timezone, latitude, longitude, updated_at')
        .order('updated_at', { ascending: false })
        .limit(2)

    if (error) {
        console.error('Error:', error)
        return
    }

    console.log('Recent Profile Updates:')
    profiles.forEach(p => {
        console.log(`- ${p.display_name} (${p.id}):`)
        console.log(`  City: ${p.city}`)
        console.log(`  Timezone: ${p.timezone}`)
        console.log(`  Lat/Lng: ${p.latitude}, ${p.longitude}`)
        console.log(`  Updated At: ${p.updated_at}`)
    })
}

check()
