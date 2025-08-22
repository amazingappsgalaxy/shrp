import { useState, useCallback } from 'react'
import { tebiApi } from '../api/tebi'
import { FILE_CATEGORIES, FileCategory } from '../tebi'
import { tebiUtils } from '../tebi'

interface UploadState {
  isUploading: boolean
  progress: number
  error: string | null
}

interface FileInfo {
  key: string
  url: string
  size: number
  originalName: string
  category: FileCategory
  uploadedAt: Date
}

export function useTebi() {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
  })

  const [files, setFiles] = useState<FileInfo[]>([])

  // Upload single file
  const uploadFile = useCallback(async (
    file: File,
    category: FileCategory = FILE_CATEGORIES.UPLOADS,
    metadata?: Record<string, string>
  ): Promise<FileInfo | null> => {
    try {
      setUploadState({
        isUploading: true,
        progress: 0,
        error: null,
      })

      // Validate file
      if (!tebiUtils.isValidFileType(file, ['image/*'])) {
        throw new Error('Invalid file type. Only images are supported.')
      }

      // Simulate progress (in real implementation, you'd track actual upload progress)
      const progressInterval = setInterval(() => {
        setUploadState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90),
        }))
      }, 100)

      const result = await tebiApi.uploadFile(file, category, metadata)
      
      clearInterval(progressInterval)
      
      const fileInfo: FileInfo = {
        key: result.key,
        url: result.url,
        size: result.size,
        originalName: file.name,
        category,
        uploadedAt: new Date(),
      }

      setFiles(prev => [...prev, fileInfo])
      
      setUploadState({
        isUploading: false,
        progress: 100,
        error: null,
      })

      return fileInfo
    } catch (error) {
      setUploadState({
        isUploading: false,
        progress: 0,
        error: error instanceof Error ? error.message : 'Upload failed',
      })
      return null
    }
  }, [])

  // Upload multiple files
  const uploadMultipleFiles = useCallback(async (
    files: File[],
    category: FileCategory = FILE_CATEGORIES.UPLOADS,
    metadata?: Record<string, string>
  ): Promise<FileInfo[]> => {
    try {
      setUploadState({
        isUploading: true,
        progress: 0,
        error: null,
      })

      const results: FileInfo[] = []
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const result = await uploadFile(file, category, metadata)
        
        if (result) {
          results.push(result)
        }
        
        // Update progress
        setUploadState(prev => ({
          ...prev,
          progress: Math.round(((i + 1) / files.length) * 100),
        }))
      }

      setUploadState({
        isUploading: false,
        progress: 100,
        error: null,
      })

      return results
    } catch (error) {
      setUploadState({
        isUploading: false,
        progress: 0,
        error: error instanceof Error ? error.message : 'Upload failed',
      })
      return []
    }
  }, [uploadFile])

  // Delete file
  const deleteFile = useCallback(async (key: string): Promise<boolean> => {
    try {
      await tebiApi.deleteFile(key)
      setFiles(prev => prev.filter(file => file.key !== key))
      return true
    } catch (error) {
      console.error('Error deleting file:', error)
      return false
    }
  }, [])

  // Get file metadata
  const getFileMetadata = useCallback(async (key: string) => {
    try {
      return await tebiApi.getFileMetadata(key)
    } catch (error) {
      console.error('Error getting file metadata:', error)
      return null
    }
  }, [])

  // List files in category
  const listFiles = useCallback(async (
    category: FileCategory,
    prefix?: string
  ): Promise<FileInfo[]> => {
    try {
      const fileList = await tebiApi.listFiles(category, prefix)
      
      const fileInfos: FileInfo[] = fileList.map(file => ({
        key: file.key,
        url: file.url,
        size: file.size,
        originalName: file.key.split('/').pop() || 'Unknown',
        category,
        uploadedAt: file.lastModified,
      }))

      setFiles(prev => {
        const existingKeys = new Set(prev.map(f => f.key))
        const newFiles = fileInfos.filter(f => !existingKeys.has(f.key))
        return [...prev, ...newFiles]
      })

      return fileInfos
    } catch (error) {
      console.error('Error listing files:', error)
      return []
    }
  }, [])

  // Generate presigned upload URL
  const getPresignedUploadUrl = useCallback(async (
    filename: string,
    contentType: string,
    category: FileCategory = FILE_CATEGORIES.UPLOADS
  ) => {
    try {
      return await tebiApi.getPresignedUploadUrl(filename, contentType, category)
    } catch (error) {
      console.error('Error generating presigned URL:', error)
      throw error
    }
  }, [])

  // Generate presigned access URL
  const getPresignedAccessUrl = useCallback(async (
    key: string,
    expiresIn: number = 3600
  ) => {
    try {
      return await tebiApi.getPresignedAccessUrl(key, expiresIn)
    } catch (error) {
      console.error('Error generating access URL:', error)
      throw error
    }
  }, [])

  // Copy file
  const copyFile = useCallback(async (
    sourceKey: string,
    destinationKey: string
  ): Promise<boolean> => {
    try {
      await tebiApi.copyFile(sourceKey, destinationKey)
      return true
    } catch (error) {
      console.error('Error copying file:', error)
      return false
    }
  }, [])

  // Move file
  const moveFile = useCallback(async (
    sourceKey: string,
    destinationKey: string
  ): Promise<boolean> => {
    try {
      await tebiApi.moveFile(sourceKey, destinationKey)
      
      // Update local state
      setFiles(prev => prev.map(file => 
        file.key === sourceKey 
          ? { ...file, key: destinationKey, url: tebiUtils.getFileUrl(destinationKey) }
          : file
      ))
      
      return true
    } catch (error) {
      console.error('Error moving file:', error)
      return false
    }
  }, [])

  // Check if file exists
  const fileExists = useCallback(async (key: string): Promise<boolean> => {
    try {
      return await tebiApi.fileExists(key)
    } catch (error) {
      console.error('Error checking file existence:', error)
      return false
    }
  }, [])

  // Get file size
  const getFileSize = useCallback(async (key: string): Promise<number> => {
    try {
      return await tebiApi.getFileSize(key)
    } catch (error) {
      console.error('Error getting file size:', error)
      return 0
    }
  }, [])

  // Create thumbnail
  const createThumbnail = useCallback(async (
    sourceKey: string,
    width: number = 200,
    height: number = 200
  ) => {
    try {
      return await tebiApi.createThumbnail(sourceKey, width, height)
    } catch (error) {
      console.error('Error creating thumbnail:', error)
      throw error
    }
  }, [])

  // Clean up temporary files
  const cleanupTempFiles = useCallback(async (olderThanHours: number = 24): Promise<number> => {
    try {
      return await tebiApi.cleanupTempFiles(olderThanHours)
    } catch (error) {
      console.error('Error cleaning up temp files:', error)
      return 0
    }
  }, [])

  // Clear upload state
  const clearUploadState = useCallback(() => {
    setUploadState({
      isUploading: false,
      progress: 0,
      error: null,
    })
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setUploadState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    // State
    uploadState,
    files,
    
    // Actions
    uploadFile,
    uploadMultipleFiles,
    deleteFile,
    getFileMetadata,
    listFiles,
    getPresignedUploadUrl,
    getPresignedAccessUrl,
    copyFile,
    moveFile,
    fileExists,
    getFileSize,
    createThumbnail,
    cleanupTempFiles,
    
    // Utilities
    clearUploadState,
    clearError,
    
    // Helper functions
    formatFileSize: tebiUtils.formatFileSize,
    isValidFileType: tebiUtils.isValidFileType,
  }
}
