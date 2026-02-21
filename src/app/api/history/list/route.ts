import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth-simple'
import { config } from '@/lib/config'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const sessionData = await getSession(sessionToken)
    if (!sessionData?.user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const userId = sessionData.user.id
    const url = new URL(request.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '24'), 50)
    const cursor = url.searchParams.get('cursor')
    const ids = url.searchParams.get('ids') // Support fetching specific items by ID

    if (!config.database.supabaseUrl || !config.database.supabaseServiceKey) {
      console.error('API: Supabase configuration missing')
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 })
    }

    const supabase = createClient(
      config.database.supabaseUrl,
      config.database.supabaseServiceKey
    )

    let query = supabase
      .from('history_items')
      .select('id, output_urls, status, created_at')
      .eq('user_id', userId)
      
    if (ids) {
      // If specific IDs requested, filter by them (for efficient polling)
      const idList = ids.split(',').filter(id => id.trim().length > 0)
      if (idList.length > 0) {
        query = query.in('id', idList)
      }
    } else {
      // Standard list fetch
      query = query
        .order('created_at', { ascending: false })
        .limit(limit)

      if (cursor) {
        query = query.lt('created_at', cursor)
      }
    }

    const { data, error } = await query

    if (error) {
      console.error('API: History fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const items = (data || []).map((item) => ({
      id: item.id,
      outputUrls: item.output_urls || [],
      status: item.status,
      createdAt: item.created_at
    }))

    const nextCursor = items.length === limit ? items[items.length - 1]?.createdAt : null

    return NextResponse.json({
      items,
      hasMore: items.length === limit,
      nextCursor
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch history' },
      { status: 500 }
    )
  }
}
