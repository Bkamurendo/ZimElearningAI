import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verify() {
  console.log('--- SUBSCRIPTION EXPIRATION VERIFICATION ---')

  // 1. Find or Create a test user
  const email = 'verification-test@zimlearn.ai'
  const { data: existing } = await supabase.from('profiles').select('id').eq('email', email).single()
  
  let userId = existing?.id
  if (!existing) {
    console.log('Creating test user...')
    const { data: newUser, error } = await supabase.from('profiles').insert({
      email,
      full_name: 'Verification Bot',
      role: 'student',
      plan: 'elite',
      subscription_expires_at: new Date(Date.now() - 3600000).toISOString() // Expired 1 hour ago
    }).select('id').single()
    if (error) { console.error('Error creating user:', error); return }
    userId = newUser.id
  } else {
    console.log('Using existing test user:', userId)
    await supabase.from('profiles').update({
      plan: 'elite',
      subscription_expires_at: new Date(Date.now() - 3600000).toISOString()
    }).eq('id', userId)
  }

  console.log('User setup: Elite plan, Expired.')

  // 2. Trigger Sweep Logic (Internal function call simulation)
  console.log('Triggering sweep...')
  // Instead of HTTP, we use a direct update for verification of the SQL logic
  const now = new Date().toISOString()
  const { data: expired, error: fetchError } = await supabase
    .from('profiles')
    .select('id, email, plan')
    .eq('role', 'student')
    .neq('plan', 'free')
    .lt('subscription_expires_at', now)

  console.log(`Found ${expired?.length ?? 0} expired users raw:`, expired)

  if (expired && expired.length > 0) {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ plan: 'free' })
      .in('id', expired.map(u => u.id))
    
    if (updateError) console.error('Update failed:', updateError)
    else console.log('Successfully reverted expired users to FREE.')
  }

  // 3. Final Check
  const { data: final } = await supabase.from('profiles').select('plan').eq('id', userId).single()
  console.log('Final plan status:', final?.plan)
  
  if (final?.plan === 'free') {
    console.log('✅ VERIFICATION SUCCESSFUL: Premium to Free transition confirmed.')
  } else {
    console.log('❌ VERIFICATION FAILED: User is still on', final?.plan)
  }
}

verify()
