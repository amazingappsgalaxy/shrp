import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { message: 'Password reset is not available yet. Please contact support at support@sharpii.ai' },
    { status: 200 }
  )
}
