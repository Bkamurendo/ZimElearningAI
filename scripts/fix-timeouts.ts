import path from 'path'
import dotenv from 'dotenv'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'

async function fastFix() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabase = createClient(supabaseUrl!, supabaseKey!)

  console.log('Marking timeout docs as PDF_PARSE_FAILED_TIMEOUT...')
  
  const { data, error } = await supabase
    .from('uploaded_documents')
    .update({ extracted_text: '[PDF_PARSE_FAILED_TIMEOUT] Document too large or complex.' })
    .in('title', [
        'Ties That Bind The Story of an Afro Cherokee Family in Slavery and',
        'ZJC Focus on Combined Science Form 2'
    ])
    .select('id, title')
    
  console.log('Updated:', data)
  if (error) console.error(error)
}

fastFix()
