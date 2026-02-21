import { NextResponse } from 'next/server'
import { config } from '@/lib/config'

export async function GET() {
  return NextResponse.json({
    hasServiceKey: !!config.database.supabaseServiceKey,
    hasUrl: !!config.database.supabaseUrl,
    nodeEnv: process.env.NODE_ENV,
    serviceKeyLength: config.database.supabaseServiceKey?.length
  })
}
