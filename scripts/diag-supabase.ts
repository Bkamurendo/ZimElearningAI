import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function checkHealth() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    console.error('Missing credentials')
    return
  }

  const supabase = createClient(url, key)

  console.log('--- Supabase Deep Health Check ---')
  
  // 1. Check latency
  const start = Date.now()
  const { data: profiles, error: pError } = await supabase.from('profiles').select('id').limit(1)
  const end = Date.now()

  if (pError) {
    console.log('❌ Database Query Error:', pError.message)
    if (pError.message.includes('timeout') || pError.message.includes('522')) {
        console.log('⚠️ DIAGNOSIS: Connection Timeout. The database is either sleeping or under extreme load.')
    }
  } else {
    console.log(`✅ Database Query: OK (${end - start}ms)`)
  }

  // 2. Check Vector Table (The likely culprit for quota)
  const { data: vData, error: vError } = await supabase.from('knowledge_vectors').select('count', { count: 'exact', head: true })
  if (vError) {
    console.log('❌ Vector Table Error:', vError.message)
  } else {
    console.log(`📊 Vector Count: ${vData.length} chunks`)
  }

  // 3. Try to reach the REST API directly
  try {
      const resp = await fetch(`${url}/rest/v1/?apikey=${key}`)
      console.log(`🌐 Edge Runtime Status: ${resp.status} ${resp.statusText}`)
  } catch (err: any) {
      console.log('❌ Edge Runtime Unreachable:', err.message)
  }
}

checkHealth()
