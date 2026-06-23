export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/resources/search
 * Searches published platform documents (past papers, notes, etc.)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')?.trim() ?? ''
    const docType = searchParams.get('type') ?? 'all'
    const level = searchParams.get('level') ?? 'all'
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let dbQuery = supabase
      .from('uploaded_documents')
      .select(`
        id, 
        title, 
        description,
        document_type, 
        zimsec_level, 
        year, 
        paper_number, 
        ai_summary, 
        topics, 
        file_size,
        subject:subjects(name, code)
      `)
      .eq('moderation_status', 'published')
      .order('created_at', { ascending: false })
      .limit(limit)

    // Apply filters
    if (query) {
      // Use OR for simple but effective search across title and summary
      dbQuery = dbQuery.or(`title.ilike.%${query}%,ai_summary.ilike.%${query}%`)
    }

    if (docType !== 'all') {
      dbQuery = dbQuery.eq('document_type', docType)
    }

    if (level !== 'all') {
      dbQuery = dbQuery.eq('zimsec_level', level)
    }

    const { data, error } = await dbQuery

    if (error) {
      console.error('Supabase search error:', error)
      throw error
    }

    return NextResponse.json({ resources: data ?? [] })
  } catch (error) {
    console.error('Resource search route error:', error)
    return NextResponse.json({ 
      error: 'Failed to search resources', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
