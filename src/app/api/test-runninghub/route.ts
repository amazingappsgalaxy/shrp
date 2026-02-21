import { NextRequest, NextResponse } from 'next/server'
import { EnhancementService } from '../../../services/ai-providers'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Test RunningHub: Starting test...')

    // Get the enhancement service
    const enhancementService = EnhancementService.getInstance()

    // Check provider status
    const providerStatus = enhancementService.getProviderStatus()
    console.log('🔍 Provider status:', providerStatus)

    const body = await request.json()
    const { imageUrl, settings } = body
    
    // Use a real image converted to base64
    let imageToUse = imageUrl
    if (!imageToUse) {
       try {
         // Use a reliable image URL (Google Logo or similar stable image)
         const resp = await fetch('https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png')
         if (!resp.ok) throw new Error(`Failed to fetch image: ${resp.status}`)
         const arrayBuffer = await resp.arrayBuffer()
         const buffer = Buffer.from(arrayBuffer)
         const base64 = buffer.toString('base64')
         const mimeType = resp.headers.get('content-type') || 'image/png'
         imageToUse = `data:${mimeType};base64,${base64}`
         console.log('✅ Fetched and converted Google logo to base64')
       } catch (e) {
         console.error('Failed to fetch test image:', e)
         // Fallback to 1x1 pixel if fetch fails
         imageToUse = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
       }
    }

    // Create test enhancement request
    const testRequest = {
      imageUrl: imageToUse,
      settings: settings || {
        mode: 'Subtle',
        denoise: 0.35,
        megapixels: 4,
        protections: {
          face: { skin: true, nose: true, mouth: true, upperLip: true, lowerLip: true },
          eyes: { eyeGeneral: true, rightEye: true, leftEye: true, rightBrow: true, leftBrow: true }
        }
      },
      userId: 'test-user-123',
      imageId: `test-${Date.now()}`
    }

    console.log(`🧪 Test RunningHub: Making enhancement request with model skin-editor...`)

    // Try enhancing with specified model
    const result = await enhancementService.enhanceImage(
      testRequest,
      'skin-editor'
    )

    console.log('✅ Test RunningHub: Enhancement result:', {
      success: result.success,
      hasUrl: !!result.enhancedUrl,
      enhancedUrl: result.enhancedUrl,
      error: result.error,
      message: result.message
    })

    return NextResponse.json({
      result,
      testInfo: {
        providerStatus,
        testRequest: {
          imageUrl: testRequest.imageUrl.startsWith('data:') ? 'base64 data...' : testRequest.imageUrl,
          userId: testRequest.userId,
          imageId: testRequest.imageId
        }
      }
    })

  } catch (error) {
    console.error('❌ Test RunningHub: Error:', error)
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Test endpoint ready' })
}
