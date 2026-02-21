import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth-simple'
import { getUserImages } from '@/lib/auth-simple'

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const sessionData = await getSession(sessionToken)
    if (!sessionData || !sessionData.user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }
    
    const userId = sessionData.user.id
    
    // Get query parameters for pagination
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    
    // Fetch user images
    const images = await getUserImages(userId)
    
    // Format response
    const formattedImages = images.map(image => ({
      id: image.id,
      filename: image.filename,
      originalUrl: image.originalUrl,
      enhancedUrl: image.enhancedUrl,
      status: image.status,
      fileSize: image.fileSize,
      width: image.width,
      height: image.height,
      createdAt: image.createdAt,
      updatedAt: image.updatedAt
    }))
    
    return NextResponse.json({
      success: true,
      images: formattedImages,
      total: formattedImages.length
    })
    
  } catch (error) {
    console.error('API: Error listing images:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch images',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}