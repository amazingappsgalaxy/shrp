import { NextRequest, NextResponse, after } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth-simple'
import { config } from '@/lib/config'

// Output files are deleted from Bunny CDN after 31 days — keep in sync with cleanup-media.mjs
const OUTPUT_RETENTION_DAYS = 31

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
    const page_name = url.searchParams.get('page_name')
    const orderAsc = url.searchParams.get('order') === 'asc'
    // Allow higher limit for page-specific fetches (up to 200 tasks)
    const maxLimit = page_name ? 200 : 50
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '24'), maxLimit)
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

    // Always select the rich set — extra fields are silently ignored by existing callers
    let query = supabase
      .from('history_items')
      .select('id, output_urls, status, created_at, settings, model_name')
      .eq('user_id', userId)

    if (page_name) {
      query = query.eq('page_name', page_name)
    }

    if (ids) {
      // If specific IDs requested, filter by them (for efficient polling)
      const idList = ids.split(',').filter(id => id.trim().length > 0)
      if (idList.length > 0) {
        query = query.in('id', idList)
      }
    } else {
      // Standard list fetch
      query = query
        .order('created_at', { ascending: orderAsc })
        .limit(limit)

      if (cursor) {
        if (orderAsc) query = query.gt('created_at', cursor)
        else query = query.lt('created_at', cursor)
      }
    }

    const { data, error } = await query

    if (error) {
      console.error('API: History fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate expiry cutoff
    const expiryCutoff = new Date()
    expiryCutoff.setUTCDate(expiryCutoff.getUTCDate() - OUTPUT_RETENTION_DAYS)

    // Split into valid and expired
    const validData = (data || []).filter(item => new Date(item.created_at) >= expiryCutoff)
    const expiredIds = (data || [])
      .filter(item => new Date(item.created_at) < expiryCutoff)
      .map(item => item.id)

    // Delete expired items in background (removes them from history page too)
    if (expiredIds.length > 0) {
      after(async () => {
        const supabaseAfter = createClient(config.database.supabaseUrl, config.database.supabaseServiceKey)
        await supabaseAfter.from('history_items').delete().in('id', expiredIds)
        console.log(`🧹 history/list: deleted ${expiredIds.length} expired item(s)`)
      })
    }

    const items = validData.map((item) => ({
      id: item.id,
      outputUrls: item.output_urls || [],
      status: item.status,
      createdAt: item.created_at,
      modelName: item.model_name ?? null,
      settings: (item.settings as Record<string, unknown>) ?? {},
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
