import { tebiClient, tebiConfig, tebiUtils, FILE_CATEGORIES, FileCategory } from '../tebi'
import { Job, EnhancementSettings, Preset } from '@/lib/types'

// Tebi.io API service
export class TebiApiService {
  private bucketName: string

  constructor() {
    this.bucketName = tebiConfig.bucketName
  }

  // Upload file to Tebi.io
  async uploadFile(
    file: File, 
    category: FileCategory = FILE_CATEGORIES.UPLOADS,
    metadata?: Record<string, string>
  ): Promise<{ key: string; url: string; size: number }> {
    try {
      const key = tebiUtils.generateFilename(file.name, category)
      
      const uploadParams = {
        Bucket: this.bucketName,
        Key: key,
        Body: file,
        ContentType: file.type,
        Metadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
          category,
          ...metadata,
        },
      }

      await tebiClient.putObject(uploadParams).promise()

      return {
        key,
        url: tebiUtils.getFileUrl(key),
        size: file.size,
      }
    } catch (error) {
      console.error('Error uploading file to Tebi:', error)
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Upload multiple files
  async uploadMultipleFiles(
    files: File[], 
    category: FileCategory = FILE_CATEGORIES.UPLOADS
  ): Promise<Array<{ key: string; url: string; size: number; originalName: string }>> {
    const uploadPromises = files.map(async (file) => {
      const result = await this.uploadFile(file, category)
      return {
        ...result,
        originalName: file.name,
      }
    })

    return Promise.all(uploadPromises)
  }

  // Delete file from Tebi.io
  async deleteFile(key: string): Promise<void> {
    try {
      await tebiClient.deleteObject({
        Bucket: this.bucketName,
        Key: key,
      }).promise()
    } catch (error) {
      console.error('Error deleting file from Tebi:', error)
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Get file metadata
  async getFileMetadata(key: string): Promise<Record<string, string> | null> {
    try {
      const result = await tebiClient.headObject({
        Bucket: this.bucketName,
        Key: key,
      }).promise()

      return result.Metadata || null
    } catch (error) {
      console.error('Error getting file metadata from Tebi:', error)
      return null
    }
  }

  // List files in a category
  async listFiles(category: FileCategory, prefix?: string): Promise<Array<{ key: string; url: string; size: number; lastModified: Date }>> {
    try {
      const listParams: any = {
        Bucket: this.bucketName,
        Prefix: prefix || category,
      }

      const result = await tebiClient.listObjectsV2(listParams).promise()
      
      if (!result.Contents) return []

      return result.Contents.map(item => ({
        key: item.Key!,
        url: tebiUtils.getFileUrl(item.Key!),
        size: item.Size || 0,
        lastModified: item.LastModified || new Date(),
      }))
    } catch (error) {
      console.error('Error listing files from Tebi:', error)
      return []
    }
  }

  // Generate presigned URL for direct upload
  async getPresignedUploadUrl(
    filename: string, 
    contentType: string, 
    category: FileCategory = FILE_CATEGORIES.UPLOADS
  ): Promise<{ uploadUrl: string; key: string; imageUrl: string }> {
    try {
      const key = tebiUtils.generateFilename(filename, category)
      
      const presignedUrl = await tebiClient.getSignedUrl('putObject', {
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType,
        Expires: 3600, // 1 hour
      })

      return {
        uploadUrl: presignedUrl,
        key,
        imageUrl: tebiUtils.getFileUrl(key),
      }
    } catch (error) {
      console.error('Error generating presigned URL:', error)
      throw new Error(`Failed to generate upload URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Generate presigned URL for file access
  async getPresignedAccessUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      return await tebiClient.getSignedUrl('getObject', {
        Bucket: this.bucketName,
        Key: key,
        Expires: expiresIn,
      })
    } catch (error) {
      console.error('Error generating access URL:', error)
      throw new Error(`Failed to generate access URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Copy file within Tebi.io
  async copyFile(sourceKey: string, destinationKey: string): Promise<void> {
    try {
      await tebiClient.copyObject({
        Bucket: this.bucketName,
        CopySource: `${this.bucketName}/${sourceKey}`,
        Key: destinationKey,
      }).promise()
    } catch (error) {
      console.error('Error copying file in Tebi:', error)
      throw new Error(`Failed to copy file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Move file (copy + delete)
  async moveFile(sourceKey: string, destinationKey: string): Promise<void> {
    try {
      await this.copyFile(sourceKey, destinationKey)
      await this.deleteFile(sourceKey)
    } catch (error) {
      console.error('Error moving file in Tebi:', error)
      throw new Error(`Failed to move file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Check if file exists
  async fileExists(key: string): Promise<boolean> {
    try {
      await tebiClient.headObject({
        Bucket: this.bucketName,
        Key: key,
      }).promise()
      return true
    } catch (error) {
      return false
    }
  }

  // Get file size
  async getFileSize(key: string): Promise<number> {
    try {
      const result = await tebiClient.headObject({
        Bucket: this.bucketName,
        Key: key,
      }).promise()
      
      return result.ContentLength || 0
    } catch (error) {
      console.error('Error getting file size from Tebi:', error)
      return 0
    }
  }

  // Create thumbnail and store in Tebi.io
  async createThumbnail(
    sourceKey: string, 
    width: number = 200, 
    height: number = 200
  ): Promise<{ key: string; url: string }> {
    try {
      // This would typically involve image processing
      // For now, we'll just copy the original file to thumbnails folder
      const thumbnailKey = tebiUtils.generateFilename(
        sourceKey.split('/').pop() || 'thumbnail.jpg',
        FILE_CATEGORIES.THUMBNAILS
      )
      
      await this.copyFile(sourceKey, thumbnailKey)
      
      return {
        key: thumbnailKey,
        url: tebiUtils.getFileUrl(thumbnailKey),
      }
    } catch (error) {
      console.error('Error creating thumbnail:', error)
      throw new Error(`Failed to create thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Clean up temporary files
  async cleanupTempFiles(olderThanHours: number = 24): Promise<number> {
    try {
      const tempFiles = await this.listFiles(FILE_CATEGORIES.TEMP)
      const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000)
      
      let deletedCount = 0
      
      for (const file of tempFiles) {
        if (file.lastModified < cutoffTime) {
          await this.deleteFile(file.key)
          deletedCount++
        }
      }
      
      return deletedCount
    } catch (error) {
      console.error('Error cleaning up temp files:', error)
      return 0
    }
  }
}

// Export singleton instance
export const tebiApi = new TebiApiService()

// Legacy API compatibility functions
export const mockApi = {
  // Upload image and get signed URL
  getUploadUrl: async (filename: string, contentType: string) => {
    return await tebiApi.getPresignedUploadUrl(filename, contentType)
  },

  // Create enhancement job
  createJob: async (imageUrl: string, settings: EnhancementSettings) => {
    // This would integrate with your job processing system
    const job: Job = {
      id: `job-${Date.now()}`,
      status: 'pending',
      inputImage: imageUrl,
      settings,
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    // Store job metadata in Tebi.io
    const jobKey = `jobs/${job.id}/metadata.json`
    const jobData = JSON.stringify(job)
    const jobBlob = new Blob([jobData], { type: 'application/json' })
    
    await tebiApi.uploadFile(
      new File([jobBlob], 'metadata.json'),
      FILE_CATEGORIES.TEMP,
      { jobId: job.id, type: 'job-metadata' }
    )
    
    return job
  },

  // Get job status
  getJobStatus: async (jobId: string) => {
    // Retrieve job metadata from Tebi.io
    const jobKey = `jobs/${jobId}/metadata.json`
    const metadata = await tebiApi.getFileMetadata(jobKey)
    
    if (!metadata) {
      throw new Error('Job not found')
    }
    
    // Parse job data and return
    return JSON.parse(metadata.jobData || '{}') as Job
  },

  // Get all jobs
  getJobs: async () => {
    // List all job metadata files
    const jobFiles = await tebiApi.listFiles(FILE_CATEGORIES.TEMP, 'jobs/')
    const jobs: Job[] = []
    
    for (const file of jobFiles) {
      if (file.key.endsWith('metadata.json')) {
        const metadata = await tebiApi.getFileMetadata(file.key)
        if (metadata?.jobData) {
          jobs.push(JSON.parse(metadata.jobData))
        }
      }
    }
    
    return jobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  },

  // Get presets
  getPresets: async () => {
    // Load presets from Tebi.io
    const presetsKey = 'config/presets.json'
    const metadata = await tebiApi.getFileMetadata(presetsKey)
    
    if (metadata?.presetsData) {
      return JSON.parse(metadata.presetsData) as Preset[]
    }
    
    // Return default presets if none exist
    return []
  },

  // Cancel job
  cancelJob: async (jobId: string) => {
    const job = await mockApi.getJobStatus(jobId)
    if (job) {
      job.status = 'cancelled'
      job.updatedAt = new Date()
      
      // Update job metadata in Tebi.io
      const jobKey = `jobs/${jobId}/metadata.json`
      const jobData = JSON.stringify(job)
      const jobBlob = new Blob([jobData], { type: 'application/json' })
      
      await tebiApi.uploadFile(
        new File([jobBlob], 'metadata.json'),
        FILE_CATEGORIES.TEMP,
        { jobId: job.id, type: 'job-metadata' }
      )
    }
    return job
  },

  // Retry job
  retryJob: async (jobId: string) => {
    const job = await mockApi.getJobStatus(jobId)
    if (job) {
      job.status = 'pending'
      job.progress = 0
      job.error = undefined
      job.updatedAt = new Date()
      
      // Update job metadata in Tebi.io
      const jobKey = `jobs/${jobId}/metadata.json`
      const jobData = JSON.stringify(job)
      const jobBlob = new Blob([jobData], { type: 'application/json' })
      
      await tebiApi.uploadFile(
        new File([jobBlob], 'metadata.json'),
        FILE_CATEGORIES.TEMP,
        { jobId: job.id, type: 'job-metadata' }
      )
    }
    return job
  },
}
