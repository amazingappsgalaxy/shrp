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

    const url = new URL(request.url)
    const historyId = url.searchParams.get('id')

    if (!historyId) {
      return NextResponse.json({ error: 'History ID is required' }, { status: 400 })
    }

    if (!config.database.supabaseUrl || !config.database.supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 })
    }

    const supabase = createClient(
      config.database.supabaseUrl,
      config.database.supabaseServiceKey
    )

    const { data, error } = await supabase
      .from('history_items')
      .select('id, task_id, output_urls, model_name, page_name, status, generation_time_ms, settings, created_at')
      .eq('id', historyId)
      .eq('user_id', sessionData.user.id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'History item not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: data.id,
      taskId: data.task_id,
      outputUrls: data.output_urls || [],
      modelName: data.model_name,
      pageName: data.page_name,
      status: data.status,
      generationTimeMs: data.generation_time_ms,
      settings: data.settings || {},
      createdAt: data.created_at
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch history item' },
      { status: 500 }
    )
  }
}
