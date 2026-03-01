import { NextRequest, NextResponse } from 'next/server'
import { getSynvowProvider } from '@/services/ai-providers/synvow'
import type { SynvowModelType } from '@/services/ai-providers/synvow'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const taskId = searchParams.get('taskId')
  const type = (searchParams.get('type') ?? 'image') as SynvowModelType

  if (!taskId) {
    return NextResponse.json({ error: 'Missing taskId' }, { status: 400 })
  }

  try {
    const provider = getSynvowProvider()
    const result = await provider.pollTask(taskId, type)
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
