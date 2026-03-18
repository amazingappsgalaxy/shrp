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
    const maxLimit = page_name ? 200 : 100
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '24'), maxLimit)
    const cursorRaw = url.searchParams.get('cursor')
    // Cursor can be either a plain ISO timestamp (legacy) or a JSON compound cursor {ts, id}
    let cursorTs: string | null = null
    let cursorId: string | null = null
    if (cursorRaw) {
      try {
        const parsed = JSON.parse(cursorRaw) as { ts: string; id: string }
        cursorTs = parsed.ts
        cursorId = parsed.id
      } catch {
        cursorTs = cursorRaw  // legacy plain timestamp
      }
    }
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

      if (cursorTs) {
        if (cursorId) {
          // Compound cursor: items where (created_at, id) < (cursorTs, cursorId) for desc
          // Supabase doesn't do tuple comparisons, so we simulate:
          // (created_at < cursorTs) OR (created_at = cursorTs AND id < cursorId)
          if (orderAsc) {
            query = query.or(`created_at.gt.${cursorTs},and(created_at.eq.${cursorTs},id.gt.${cursorId})`)
          } else {
            query = query.or(`created_at.lt.${cursorTs},and(created_at.eq.${cursorTs},id.lt.${cursorId})`)
          }
        } else {
          if (orderAsc) query = query.gt('created_at', cursorTs)
          else query = query.lt('created_at', cursorTs)
        }
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

    // hasMore and cursor are derived from the RAW (unfiltered) data so that
    // expired items filtering doesn't falsely truncate pagination.
    const hasMore = data.length === limit
    const lastItem = data[data.length - 1]
    const nextCursor = hasMore && lastItem
      ? JSON.stringify({ ts: lastItem.created_at, id: lastItem.id })
      : null

    return NextResponse.json({
      items,
      hasMore,
      nextCursor
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch history' },
      { status: 500 }
    )
  }
}
