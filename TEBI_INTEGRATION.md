# Tebi.io Integration for Sharpii.AI

This document explains how to set up and use Tebi.io (AWS S3 alternative) integration in your Sharpii.AI website.

## Overview

Tebi.io is an Amazon AWS S3 alternative that provides cost-effective cloud storage solutions. This integration allows you to:

- Store all website files, images, and data in Tebi.io
- Upload files directly from the frontend
- Manage files through a comprehensive dashboard
- Organize files by categories
- Generate presigned URLs for secure access
- Automatically handle file metadata and organization

## Current Configuration

**Bucket Name**: `sharpiiweb`  
**Endpoint**: `https://sharpiiweb.tebi.io`  
**Region**: Germany, Europe  
**Website**: `https://sharpii.ai`

## Implementation Details

**Custom REST API Client**: This integration uses a custom REST API client that implements the S3-compatible protocol that Tebi.io supports. It doesn't require external SDK packages and provides full compatibility with Tebi.io's API.

## Features

### 🚀 Core Functionality
- **File Upload**: Drag & drop or browse file uploads
- **File Management**: View, download, delete, and organize files
- **Category Organization**: Automatic file categorization (uploads, enhanced, thumbnails, etc.)
- **Metadata Tracking**: Store file information and processing details
- **Secure Access**: Generate presigned URLs for file access
- **Bulk Operations**: Select and manage multiple files at once

### 🎯 File Categories
- **uploads**: Original uploaded files
- **enhanced**: AI-processed/enhanced images
- **thumbnails**: Generated thumbnail images
- **temp**: Temporary processing files
- **assets**: Static website assets
- **user_avatars**: User profile images
- **gallery**: Public gallery images
- **website**: Website-specific files
- **images**: General website images
- **documents**: Website documents and content
- **sharpii**: Sharpii.ai specific content

### 🔧 Management Tools
- **Tebi Dashboard**: Comprehensive file management interface
- **Settings Page**: Configuration and connection management
- **Statistics**: Storage usage and file count analytics
- **Maintenance**: Cleanup and optimization tools

## Setup Instructions

### 1. No External Dependencies Required

This integration uses a custom REST API client that doesn't require additional packages.

### 2. Environment Configuration

Create a `.env.local` file in your project root with your credentials:

```env
# Sharpii.ai Environment Variables
# Tebi.io Configuration for sharpiiweb bucket

# Next.js
NEXT_PUBLIC_SITE_URL=https://sharpii.ai
NEXT_PUBLIC_APP_ENV=development

# Tebi.io Configuration
NEXT_PUBLIC_TEBI_ENDPOINT=https://sharpiiweb.tebi.io
NEXT_PUBLIC_TEBI_REGION=Germany, Europe
TEBI_ACCESS_KEY_ID=zh1bFvfBAyRZLHOc
TEBI_SECRET_ACCESS_KEY=wWjpGL1qxHL1SBsAOQIHpyGtH7yiCSBtYoT39gjZ
TEBI_BUCKET_NAME=sharpiiweb
```

### 3. Tebi.io Account Setup

✅ **Already Completed:**
- Account created at [tebi.io](https://tebi.io)
- `sharpiiweb` bucket created
- Access keys generated
- Region set to Germany, Europe

### 4. CORS Configuration

Configure CORS in your `sharpiiweb` bucket to allow web access:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "POST", "PUT", "DELETE"],
    "AllowedOrigins": [
      "https://sharpii.ai",
      "http://localhost:3000",
      "http://localhost:3001"
    ],
    "ExposeHeaders": ["ETag"]
  }
]
```

## Usage

### Basic File Upload

```tsx
import { useTebi } from '@/lib/hooks/use-tebi'

function MyComponent() {
  const { uploadFile, uploadState } = useTebi()

  const handleUpload = async (file: File) => {
    try {
      const result = await uploadFile(file, 'uploads')
      console.log('File uploaded:', result.url)
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }

  return (
    <div>
      {uploadState.isUploading && (
        <div>Uploading... {uploadState.progress}%</div>
      )}
      {/* Your upload UI */}
    </div>
  )
}
```

### File Management

```tsx
import { useTebi } from '@/lib/hooks/use-tebi'

function FileManager() {
  const { 
    listFiles, 
    deleteFile, 
    copyFile, 
    moveFile 
  } = useTebi()

  const handleListFiles = async () => {
    const files = await listFiles('uploads')
    console.log('Files:', files)
  }

  const handleDelete = async (key: string) => {
    await deleteFile(key)
    // Refresh file list
  }

  return (
    <div>
      <button onClick={handleListFiles}>List Files</button>
      {/* File list UI */}
    </div>
  )
}
```

### Using the Upload Box Component

```tsx
import { UploadBox } from '@/components/shared/upload-box'

function UploadPage() {
  const handleFilesSelected = (files: File[]) => {
    console.log('Files selected:', files)
  }

  const handleFilesUploaded = (uploadedFiles: Array<{ key: string; url: string }>) => {
    console.log('Files uploaded to Tebi.io:', uploadedFiles)
  }

  return (
    <UploadBox
      onFilesSelected={handleFilesSelected}
      onFilesUploaded={handleFilesUploaded}
      maxFiles={10}
      maxSize={50 * 1024 * 1024} // 50MB
      category="uploads"
      showUploadProgress={true}
    />
  )
}
```

## Components

### UploadBox
Enhanced file upload component with Tebi.io integration.

**Props:**
- `onFilesSelected`: Callback when files are selected
- `onFilesUploaded`: Callback when files are uploaded to Tebi.io
- `maxFiles`: Maximum number of files allowed
- `maxSize`: Maximum file size in bytes
- `accept`: Accepted file types
- `category`: Tebi.io file category
- `showUploadProgress`: Show upload progress and Tebi.io integration

### TebiDashboard
Comprehensive file management interface.

**Features:**
- File browsing by category
- Search and filtering
- Bulk operations (copy, move, delete)
- File metadata display
- Download and preview functionality

### TebiSettingsPage
Configuration and management interface.

**Sections:**
- Overview: Storage statistics and quick actions
- Configuration: Connection settings and security info
- Storage: Storage management and optimization
- Maintenance: Cleanup and system maintenance

## API Reference

### TebiApiService

Main service class for Tebi.io operations.

```tsx
import { tebiApi } from '@/lib/api/tebi'

// Upload file
const result = await tebiApi.uploadFile(file, 'uploads', metadata)

// List files
const files = await tebiApi.listFiles('uploads')

// Delete file
await tebiApi.deleteFile(key)

// Generate presigned URL
const url = await tebiApi.getPresignedUploadUrl(filename, contentType)
```

### useTebi Hook

React hook for Tebi.io operations with state management.

```tsx
const {
  uploadState,
  files,
  uploadFile,
  uploadMultipleFiles,
  deleteFile,
  listFiles,
  // ... more methods
} = useTebi()
```

## Technical Implementation

### Custom REST API Client

The integration uses a custom `TebiClient` class that implements:

- **S3-compatible protocol** for full Tebi.io compatibility
- **Authentication headers** with AWS signature v4 format
- **HTTP methods**: PUT, DELETE, HEAD, GET for all operations
- **Metadata handling** through custom headers
- **Error handling** with proper HTTP status codes

### Supported Operations

- `putObject()` - Upload files with metadata
- `deleteObject()` - Remove files
- `headObject()` - Get file metadata
- `listObjectsV2()` - List files with prefix filtering
- `copyObject()` - Copy files within bucket
- `getSignedUrl()` - Generate presigned URLs

## File Organization

### Directory Structure
```
sharpiiweb/
├── uploads/           # Original uploaded files
├── enhanced/          # AI-processed images
├── thumbnails/        # Generated thumbnails
├── temp/              # Temporary processing files
├── assets/            # Static website assets
├── user_avatars/      # User profile images
├── gallery/           # Public gallery images
├── website/           # Website-specific files
├── images/            # General website images
├── documents/         # Website documents and content
└── sharpii/           # Sharpii.ai specific content
```

### File Naming Convention
Files are automatically named using the pattern:
```
{category}/{timestamp}-{random}.{extension}
```

Example: `uploads/1703123456789-abc123.jpg`

## Security Features

### Access Control
- **Environment Variables**: Sensitive keys stored securely
- **Presigned URLs**: Time-limited access to files
- **Metadata Protection**: File metadata stored separately
- **CORS Policies**: Web access restrictions

### File Validation
- **Type Checking**: Automatic file type validation
- **Size Limits**: Configurable file size restrictions
- **Content Validation**: File content verification

## Performance Optimization

### Upload Optimization
- **Chunked Uploads**: Large file handling
- **Progress Tracking**: Real-time upload progress
- **Parallel Uploads**: Multiple file processing
- **Error Handling**: Graceful failure management

### Storage Optimization
- **Automatic Cleanup**: Temporary file removal
- **Category Management**: Organized file storage
- **Metadata Indexing**: Fast file retrieval
- **Lifecycle Policies**: Automatic file management

## Testing Your Setup

### 1. Start Development Server
```bash
npm run dev
```

### 2. Test Connection
Navigate to `/tebi-settings` and click "Test Connection"

### 3. Test File Upload
Go to `/upload` and try uploading a test image

### 4. Verify in Tebi.io Dashboard
Check your `sharpiiweb` bucket to see uploaded files

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Verify environment variables are set correctly
   - Check that `.env.local` file exists
   - Confirm bucket name is exactly `sharpiiweb`
   - Check CORS configuration in Tebi.io dashboard

2. **Upload Errors**
   - Check file size limits
   - Verify file types are supported
   - Ensure CORS is configured correctly
   - Check browser console for detailed error messages

3. **File Not Found**
   - Verify file key format
   - Check bucket name in configuration
   - Confirm file exists in Tebi.io dashboard

### Debug Mode

Enable debug logging by setting:

```env
NEXT_PUBLIC_DEBUG=true
```

### Error Handling

All Tebi.io operations include comprehensive error handling:

```tsx
try {
  const result = await uploadFile(file, 'uploads')
} catch (error) {
  console.error('Upload failed:', error.message)
  // Handle error appropriately
}
```

## Monitoring and Analytics

### Storage Metrics
- Total file count
- Storage usage by category
- Upload/download statistics
- Error rates and performance

### Health Checks
- Connection status monitoring
- Bucket accessibility tests
- Performance benchmarking
- Error tracking and reporting

## Best Practices

### File Management
1. **Use Categories**: Organize files by purpose
2. **Clean Up**: Regularly remove temporary files
3. **Metadata**: Store relevant file information
4. **Versioning**: Implement file versioning if needed

### Security
1. **Access Keys**: Keep your keys secure
2. **Permissions**: Use least-privilege access
3. **Monitoring**: Track access patterns
4. **Backup**: Implement backup strategies

### Performance
1. **CDN**: Use CDN for public files
2. **Compression**: Compress files when possible
3. **Caching**: Implement appropriate caching
4. **Optimization**: Optimize file sizes

## Support

For issues related to:

- **Tebi.io Service**: Contact Tebi.io support
- **Integration Code**: Check this documentation
- **Configuration**: Verify environment setup
- **Performance**: Review optimization guidelines

## Changelog

### v1.0.0
- Initial Tebi.io integration with sharpiiweb bucket
- Custom REST API client implementation
- File upload and management
- Dashboard and settings interfaces
- Comprehensive API service
- React hooks and components

## License

This integration is part of the Sharpii.AI project and follows the same licensing terms.
