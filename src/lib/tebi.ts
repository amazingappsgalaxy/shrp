import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, HeadObjectCommand } from '@aws-sdk/client-s3'

// Tebi.io S3-Compatible Client Implementation using AWS SDK v3
class TebiClient {
  private s3Client: S3Client
  private bucketName: string

  constructor(config: any) {
    const endpoint = config.endpoint
    const accessKeyId = config.credentials.accessKeyId
    const secretAccessKey = config.credentials.secretAccessKey
    const region = config.region || 'us-east-1'
    
    this.bucketName = config.bucketName
    
    // Initialize AWS S3 Client with Tebi.io endpoint
    this.s3Client = new S3Client({
      endpoint: endpoint,
      region: region,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
      forcePathStyle: true, // Required for S3-compatible services
      // Browser-specific configuration to handle streaming issues
      requestHandler: {
        requestTimeout: 30000,
        // Disable streaming for browser compatibility
        disableRequestCompression: true,
        // Use XMLHttpRequest for better browser compatibility
        httpsAgent: false,
      },
      // Disable problematic features for browser compatibility
      disableS3ExpressSessionAuth: true,
      // Disable chunked encoding for browser compatibility
      useAccelerateEndpoint: false,
      // Additional browser compatibility settings
      maxAttempts: 3,
    })
    
    console.log('TebiClient initialized with AWS SDK:', {
      endpoint: endpoint,
      accessKeyId: accessKeyId ? '***' + accessKeyId.slice(-4) : 'none',
      region: region,
      bucketName: this.bucketName
    })
  }

  // Upload a file to Tebi.io
  putObject(params: any) {
    return {
      promise: async () => {
        try {
          console.log('Uploading file:', {
            bucket: params.Bucket,
            key: params.Key,
            contentType: params.ContentType
          })

          // Convert File/Blob to ArrayBuffer for better browser compatibility
          let body = params.Body
          if (body instanceof File || body instanceof Blob) {
            body = await body.arrayBuffer()
          }

          const command = new PutObjectCommand({
            Bucket: params.Bucket,
            Key: params.Key,
            Body: body,
            ContentType: params.ContentType,
            Metadata: params.Metadata || {},
          })

          const result = await this.s3Client.send(command)
          console.log('Upload successful:', result)
          return result
        } catch (error) {
          console.error('Upload failed:', error)
          throw error
        }
      }
    }
  }

  // Get an object from Tebi.io
  getObject(params: any) {
    return {
      promise: async () => {
        try {
          const command = new GetObjectCommand({
            Bucket: params.Bucket,
            Key: params.Key,
          })

          const result = await this.s3Client.send(command)
          return result
        } catch (error) {
          console.error('Get object failed:', error)
          throw error
        }
      }
    }
  }

  // Delete an object from Tebi.io
  deleteObject(params: any) {
    return {
      promise: async () => {
        try {
          const command = new DeleteObjectCommand({
            Bucket: params.Bucket,
            Key: params.Key,
          })

          const result = await this.s3Client.send(command)
          return result
        } catch (error) {
          console.error('Delete object failed:', error)
          throw error
        }
      }
    }
  }

  // Get object metadata
  headObject(params: any) {
    return {
      promise: async () => {
        try {
          const command = new HeadObjectCommand({
            Bucket: params.Bucket,
            Key: params.Key,
          })

          const result = await this.s3Client.send(command)
          return result
        } catch (error) {
          console.error('Head object failed:', error)
          throw error
        }
      }
    }
  }

  // List objects in bucket
  listObjectsV2(params: any) {
    return {
      promise: async () => {
        try {
          const command = new ListObjectsV2Command({
            Bucket: params.Bucket,
            Prefix: params.Prefix,
            MaxKeys: params.MaxKeys,
            ContinuationToken: params.ContinuationToken,
          })

          const result = await this.s3Client.send(command)
          return result
        } catch (error) {
          console.error('List objects failed:', error)
          throw error
        }
      }
    }
  }
}

// Helper function to get endpoint with bucket for virtual-hosted-style URLs
function getEndpointWithBucket(endpoint: string, bucketName: string): string {
  try {
    const url = new URL(endpoint)
    // For Tebi.io, use virtual-hosted-style: https://bucketname.s3.tebi.io
    if (url.hostname === 's3.tebi.io') {
      return `https://${bucketName}.s3.tebi.io`
    }
    // Fallback to path-style: https://s3.tebi.io/bucketname
    return `${endpoint}/${bucketName}`
  } catch (error) {
    console.error('Error constructing endpoint:', error)
    return endpoint
  }
}

// Create and export Tebi client instance
const tebiClient = new TebiClient({
  endpoint: process.env.NEXT_PUBLIC_TEBI_ENDPOINT || 'https://s3.tebi.io',
  region: process.env.NEXT_PUBLIC_TEBI_REGION || 'us-east-1',
  bucketName: process.env.NEXT_PUBLIC_TEBI_BUCKET_NAME || '',
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_TEBI_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.NEXT_PUBLIC_TEBI_SECRET_ACCESS_KEY || '',
  },
})

// File categories for organization
export const FILE_CATEGORIES = {
  UPLOADS: 'uploads',
  ENHANCED: 'enhanced',
  THUMBNAILS: 'thumbnails',
  TEMP: 'temp',
  ASSETS: 'assets',
  USER_AVATARS: 'avatars',
  GALLERY: 'gallery',
  WEBSITE: 'website', // Website-specific files
  IMAGES: 'images',   // General website images
  DOCUMENTS: 'documents', // Website documents and content
  SHARPII: 'sharpii', // Sharpii.ai specific content
} as const

export type FileCategory = typeof FILE_CATEGORIES[keyof typeof FILE_CATEGORIES]

// File upload utilities
export const tebiUtils = {
  // Generate unique filename
  generateFilename: (originalName: string, prefix?: string): string => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    const extension = originalName.split('.').pop()
    const prefixPath = prefix ? `${prefix}/` : ''
    return `${prefixPath}${timestamp}-${random}.${extension}`
  },

  // Get file URL from key
  getFileUrl: (key: string): string => {
    const endpoint = process.env.NEXT_PUBLIC_TEBI_ENDPOINT || 'https://s3.tebi.io'
    const bucketName = process.env.NEXT_PUBLIC_TEBI_BUCKET_NAME || ''
    return `${endpoint}/${bucketName}/${key}`
  },

  // Get file key from URL
  getFileKey: (url: string): string => {
    const endpoint = process.env.NEXT_PUBLIC_TEBI_ENDPOINT || 'https://s3.tebi.io'
    const bucketName = process.env.NEXT_PUBLIC_TEBI_BUCKET_NAME || ''
    return url.replace(`${endpoint}/${bucketName}/`, '')
  },

  // Validate file type
  isValidFileType: (file: File, allowedTypes: string[]): boolean => {
    return allowedTypes.some(type => {
      if (type === 'image/*') return file.type.startsWith('image/')
      return file.type === type
    })
  },

  // Get file size in MB
  getFileSizeMB: (bytes: number): number => {
    return Math.round((bytes / 1024 / 1024) * 100) / 100
  },

  // Format file size for display
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

// Tebi.io configuration for sharpii.ai website
export const tebiConfig = {
  endpoint: process.env.NEXT_PUBLIC_TEBI_ENDPOINT || 'https://s3.tebi.io',
  region: process.env.NEXT_PUBLIC_TEBI_REGION || 'us-east-1',
  accessKeyId: process.env.NEXT_PUBLIC_TEBI_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.NEXT_PUBLIC_TEBI_SECRET_ACCESS_KEY || '',
  bucketName: process.env.NEXT_PUBLIC_TEBI_BUCKET_NAME || 'sharpiiweb',
}

export { tebiClient }
export default tebiClient
