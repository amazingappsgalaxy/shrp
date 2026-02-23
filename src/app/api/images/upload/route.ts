import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth-simple'
import { uploadImage } from '@/lib/auth-simple'
import { uploadBuffer, getInputPath, mimeFromExt, extFromUrl } from '@/lib/bunny'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 API: File upload request received')

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

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      )
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum 10MB allowed.' },
        { status: 400 }
      )
    }

    console.log('📋 API: Upload details:', {
      filename: file.name,
      size: file.size,
      type: file.type,
      userId
    })

    try {
      // Get image dimensions
      const dimensions = await getImageDimensions(file)

      // Derive extension and content type
      const ext = extFromUrl(file.name) || 'jpg'
      const contentType = file.type || mimeFromExt(ext)

      // Build Bunny storage path: inputs/{today}/{userId}/{uuid}.{ext}
      const storagePath = getInputPath(userId, ext)

      // Convert File to Buffer and upload to Bunny CDN
      const buffer = Buffer.from(await file.arrayBuffer())
      const cdnUrl = await uploadBuffer(storagePath, buffer, contentType)

      console.log('✅ API: File uploaded to Bunny CDN:', cdnUrl)

      // Save image metadata to database (CDN URL stored as originalUrl)
      const imageData = {
        filename: file.name,
        fileSize: file.size,
        dimensions,
        originalUrl: cdnUrl
      }

      const savedImage = await uploadImage(userId, imageData)

      console.log('✅ API: Image metadata saved to database:', savedImage.id)

      return NextResponse.json({
        success: true,
        image: {
          id: savedImage.id,
          filename: file.name,
          url: cdnUrl,
          size: file.size,
          dimensions,
          uploadedAt: new Date().toISOString()
        }
      })

    } catch (uploadError) {
      console.error('❌ API: Upload failed:', uploadError)
      return NextResponse.json(
        {
          error: 'Upload failed',
          message: uploadError instanceof Error ? uploadError.message : 'Unknown error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('❌ API: File upload request failed:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Helper function to get image dimensions using sharp
async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  try {
    const sharp = (await import('sharp')).default
    const buffer = Buffer.from(await file.arrayBuffer())
    const metadata = await sharp(buffer).metadata()
    if (metadata.width && metadata.height) {
      return { width: metadata.width, height: metadata.height }
    }
  } catch (error) {
    console.error('Error getting image dimensions:', error)
  }
  return { width: 1920, height: 1080 }
}
