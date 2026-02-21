

import fs from 'fs'
import path from 'path'
import { RunningHubProvider } from '../services/ai-providers/runninghub/runninghub-provider'
import type { EnhancementRequest } from '../services/ai-providers/common/types'

process.env.RUNNINGHUB_API_KEY = process.env.RUNNINGHUB_API_KEY || ''

const provider = new RunningHubProvider({
  apiKey: process.env.RUNNINGHUB_API_KEY || '',
  baseUrl: 'https://www.runninghub.ai'
})

const imageUrl = 'https://i.postimg.cc/jjm6CGTD/8d4b95bc-73c3-46d5-a89c-77c61e3b8d6f.png'

type CaseConfig = {
  label: string
  smartUpscale: boolean
  upscaleResolution?: '4k' | '8k'
}

const cases: CaseConfig[] = [
  { label: 'Smart Upscale Disabled', smartUpscale: false, upscaleResolution: '4k' },
  { label: 'Smart Upscale Enabled 4K', smartUpscale: true, upscaleResolution: '4k' },
  { label: 'Smart Upscale Enabled 8K', smartUpscale: true, upscaleResolution: '8k' }
]

const runCase = async (testCase: CaseConfig) => {
  console.log(`🚀 Starting Real API Test: ${testCase.label}`)

  const request: EnhancementRequest = {
    userId: 'test-user-123',
    imageId: `test-image-${Date.now()}`,
    imageUrl,
    settings: {
      prompt: 'Enhance skin details, preserve identity, high quality',
      mode: 'Subtle',
      denoise: 0.2,
      maxshift: 1.0,
      megapixels: 4,
      guidance: 80,
      smartUpscale: testCase.smartUpscale,
      upscaleResolution: testCase.upscaleResolution
    }
  }

  console.log('Sending request to RunningHub...')
  const result = await provider.enhanceImage(request, 'skin-editor')

  if (!result.success || !result.enhancedUrl) {
    console.error('❌ Task Failed:', result.error)
    throw new Error(`Task Failed: ${result.error}`)
  }

  const outputUrls = Array.isArray(result.enhancedUrl) ? result.enhancedUrl : [result.enhancedUrl]
  console.log('✅ Task Completed Successfully!')
  console.log('Output URLs:', outputUrls)

  const downloadTargets = outputUrls.slice(0, testCase.smartUpscale ? 2 : 1)
  for (const [index, outputUrl] of downloadTargets.entries()) {
    console.log('Downloading image...')
    const response = await fetch(outputUrl)
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const outputPath = path.resolve(
      process.cwd(),
      `output_${testCase.label.replace(/\s+/g, '_').toLowerCase()}_${index + 1}.jpg`
    )
    fs.writeFileSync(outputPath, buffer)
    console.log(`📸 IMAGE SAVED TO: ${outputPath}`)
  }

  return outputUrls
}

const runTest = async () => {
  try {
    const results: Record<string, string[]> = {}
    for (const testCase of cases) {
      results[testCase.label] = await runCase(testCase)
    }
    console.log('✅ All tests completed')
    console.log(results)
  } catch (error) {
    console.error('❌ Execution Error:', error)
  }
}

runTest()
