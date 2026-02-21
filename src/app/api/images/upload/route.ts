import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth-simple'
import { uploadImage } from '@/lib/auth-simple'

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
      
      // Upload to RunningHub
      const runningHubApiKey = process.env.RUNNINGHUB_API_KEY;
      if (!runningHubApiKey) {
        throw new Error('RUNNINGHUB_API_KEY is not configured');
      }

      const runningHubFormData = new FormData();
      runningHubFormData.append('file', file);
      runningHubFormData.append('apikey', runningHubApiKey);
      runningHubFormData.append('apiKey', runningHubApiKey);

      const response = await fetch('https://www.runninghub.cn/task/openapi/upload', {
        method: 'POST',
        body: runningHubFormData,
      });

      if (!response.ok) {
        throw new Error(`RunningHub upload failed: ${response.statusText}`);
      }

      const data = await response.json();
       // RunningHub returns { code: 0, msg: 'success', data: { fileName: 'api/...' } }
       const remoteKey = data.data?.fileName || data.fileName;
       
       if (!remoteKey) {
          throw new Error('RunningHub did not return a file key (fileName)');
       }
 
       console.log('✅ API: File uploaded to RunningHub:', remoteKey)
       
       // For internal use, we might need a URL. But RunningHub only gives a key.
       // We'll use the key as the URL for now, assuming the consumer knows how to handle it.
       const uploadResult = { url: remoteKey }
      
      // Save image metadata to database
      const imageData = {
        filename: file.name,
        fileSize: file.size,
        dimensions,
        originalUrl: uploadResult.url
      }
      
      const savedImage = await uploadImage(userId, imageData)
      
      console.log('✅ API: Image metadata saved to database:', savedImage.id)
      
      return NextResponse.json({
        success: true,
        image: {
          id: savedImage.id,
          filename: file.name,
          url: uploadResult.url,
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

// Helper function to get image dimensions (server-side)
async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  // For now, return default dimensions since we're in a server environment
  // In production, you might want to use a library like 'sharp' or 'image-size'
  // to extract actual image dimensions from the file buffer
  
  try {
    // Convert File to Buffer for server-side processing
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // For now, return default dimensions
    // TODO: Implement actual image dimension detection using sharp or similar
    return {
      width: 1920, // Default width
      height: 1080 // Default height
    }
  } catch (error) {
    console.error('Error getting image dimensions:', error)
    return {
      width: 1920,
      height: 1080
    }
  }
}
