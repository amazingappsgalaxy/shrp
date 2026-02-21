import { Job, EnhancementSettings, Preset } from '@/lib/types'

// Mock data
export const mockPresets: Preset[] = [
  {
    id: 'portrait-enhance',
    name: 'Portrait Enhance',
    description: 'Perfect for faces and portraits',
    thumbnail: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop',
    settings: {
      preset: 'portrait-enhance',
      intensity: 75,
      skinSmoothing: 60,
      detailEnhancement: 40,
      colorCorrection: 20,
      noiseReduction: 30,
      sharpening: 25,
    },
    category: 'portrait',
    premium: false,
  },
  {
    id: 'landscape-vivid',
    name: 'Landscape Vivid',
    description: 'Enhance nature and landscapes',
    thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop',
    settings: {
      preset: 'landscape-vivid',
      intensity: 80,
      skinSmoothing: 10,
      detailEnhancement: 35,
      colorCorrection: 30,
      noiseReduction: 20,
      sharpening: 35,
    },
    category: 'landscape',
    premium: false,
  },
  {
    id: 'product-sharp',
    name: 'Product Sharp',
    description: 'Crisp and clean for products',
    thumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop',
    settings: {
      preset: 'product-sharp',
      intensity: 60,
      skinSmoothing: 5,
      detailEnhancement: 45,
      colorCorrection: 10,
      noiseReduction: 15,
      sharpening: 50,
    },
    category: 'product',
    premium: false,
  },
]

export const mockJobs: Job[] = [
  {
    id: 'job-1',
    status: 'completed',
    originalImage: 'https://images.unsplash.com/photo-1554080353-a576cf803bda?w=600&h=400&fit=crop',
    enhancedImage: 'https://images.unsplash.com/photo-1554080353-a576cf803bda?w=600&h=400&fit=crop&sat=100&con=110',
    settings: mockPresets[0]!.settings,
    progress: 100,
    createdAt: new Date(Date.now() - 3600000),
    completedAt: new Date(Date.now() - 3000000),
  },
  {
    id: 'job-2',
    status: 'processing',
    originalImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop',
    settings: mockPresets[1]!.settings,
    progress: 65,
    createdAt: new Date(Date.now() - 1800000),
  },
  {
    id: 'job-3',
    status: 'pending',
    originalImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=400&fit=crop',
    settings: mockPresets[2]!.settings,
    progress: 0,
    createdAt: new Date(Date.now() - 900000),
  },
]

// Mock API functions
export const mockApi = {
  // Upload image and get signed URL
  getUploadUrl: async (filename: string, contentType: string) => {
    await delay(500)
    return {
      uploadUrl: `https://mock-tebi.io/upload/${filename}`,
      imageUrl: `https://mock-tebi.io/images/${filename}`,
    }
  },

  // Create enhancement job
  createJob: async (imageUrl: string, settings: EnhancementSettings) => {
    await delay(1000)
    const job: Job = {
      id: `job-${Date.now()}`,
      status: 'pending',
      originalImage: imageUrl,
      settings,
      progress: 0,
      createdAt: new Date(),
    }
    mockJobs.unshift(job)
    return job
  },

  // Get job status
  getJobStatus: async (jobId: string) => {
    await delay(500)
    const job = mockJobs.find(j => j.id === jobId)
    if (!job) throw new Error('Job not found')

    // Simulate job progress
    if (job.status === 'pending') {
      job.status = 'processing'
      job.progress = 10
    } else if (job.status === 'processing') {
      job.progress = Math.min(100, job.progress + Math.random() * 30)
      if (job.progress >= 100) {
        job.status = 'completed'
        job.enhancedImage = job.originalImage + '?enhanced=true'
        job.completedAt = new Date()
      }
    }
    return job
  },

  // Get all jobs
  getJobs: async () => {
    await delay(300)
    return mockJobs
  },

  // Get presets
  getPresets: async () => {
    await delay(200)
    return mockPresets
  },

  // Cancel job
  cancelJob: async (jobId: string) => {
    await delay(500)
    const job = mockJobs.find(j => j.id === jobId)
    if (job) {
      job.status = 'failed'
      job.error = 'Cancelled'
      job.completedAt = new Date()
    }
    return job
  },

  // Retry job
  retryJob: async (jobId: string) => {
    await delay(500)
    const job = mockJobs.find(j => j.id === jobId)
    if (job) {
      job.status = 'pending'
      job.progress = 0
      job.error = undefined
      job.completedAt = undefined
    }
    return job
  },
}

// Helper function to simulate network delay
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Webhook simulation
export const webhookSimulator = {
  simulateCallback: async (jobId: string) => {
    const job = mockJobs.find(j => j.id === jobId)
    if (!job) return

    // Simulate webhook callback after random delay
    const timeout = Math.random() * 5000 + 2000
    setTimeout(() => {
      job.status = 'completed'
      job.progress = 100
      job.enhancedImage = job.originalImage + '?enhanced=true'
      job.completedAt = new Date()
      
      // In real app, this would trigger webhook
      console.log('Webhook triggered for job:', jobId)
    }, timeout)
  },
}
