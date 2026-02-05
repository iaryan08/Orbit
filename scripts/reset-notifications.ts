import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') })
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function resetAllNotifications() {
    console.log('Starting global notification reset...')

    // 1. Clear all in-app notifications
    console.log('Clearing all notifications...')
    const { error: notifError } = await supabase
        .from('notifications')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Dummy condition to delete all

    if (notifError) {
        console.error('Error clearing notifications:', notifError)
    } else {
        console.log('Successfully cleared all notifications.')
    }

    // 2. Clear all push subscriptions
    console.log('Clearing all push subscriptions...')
    const { error: subError } = await supabase
        .from('push_subscriptions')
        .delete()
        .neq('id', 0) // Dummy condition for integer ID

    if (subError) {
        console.error('Error clearing push subscriptions:', subError)
    } else {
        console.log('Successfully cleared all push subscriptions.')
    }

    console.log('Reset complete.')
}

resetAllNotifications()
