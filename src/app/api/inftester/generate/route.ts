import { NextRequest, NextResponse } from 'next/server'
import { getSynvowProvider } from '@/services/ai-providers/synvow'
import type { SynvowGenerateRequest } from '@/services/ai-providers/synvow'

export async function POST(request: NextRequest) {
  let body: Partial<SynvowGenerateRequest>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { model, prompt } = body
  if (!model || !prompt) {
    return NextResponse.json({ error: 'model and prompt are required' }, { status: 400 })
  }

  try {
    const provider = getSynvowProvider()
    const result = await provider.submitTask(body as SynvowGenerateRequest)
    return NextResponse.json({
      ...result,
      // Echo back the request payload so the client can display it
      requestPayload: body,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
