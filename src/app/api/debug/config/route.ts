import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY || ''
  const dodoEnv = process.env.DODO_ENVIRONMENT || 'NOT SET'
  const nodeEnv = process.env.NODE_ENV || 'NOT SET'

  return NextResponse.json({
    dodoEnvironment: dodoEnv,
    nodeEnv,
    apiKeyPrefix: apiKey ? apiKey.substring(0, 8) + '...' : 'NOT SET',
    apiKeyLength: apiKey.length,
    creatorMonthlyProductId: process.env.DODO_CREATOR_MONTHLY_PRODUCT_ID || 'NOT SET',
  })
}
