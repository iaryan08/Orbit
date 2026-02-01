const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findCouple() {
    const { data, error } = await supabase
        .from('couples')
        .select('id, user1_id')
        .eq('couple_code', 'KYBCRU')
        .single();

    if (error) {
        console.error('Error:', error);
        process.exit(1);
    }

    console.log('COUPLE_ID:', data.id);
    console.log('USER_ID:', data.user1_id);
}

findCouple();
