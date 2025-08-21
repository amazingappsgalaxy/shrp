'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Download, 
  Share2, 
  Trash2, 
  RotateCcw,
  Tag,
  Calendar,
  Image as ImageIcon,
  Sparkles,
  Eye,
  MoreHorizontal,
  Menu,
  X
} from 'lucide-react'
import Link from 'next/link'

interface ImageItem {
  id: string
  name: string
  beforeUrl: string
  afterUrl: string
  status: 'completed' | 'processing' | 'failed'
  preset: string
  tags: string[]
  createdAt: string
  size: string
  resolution: string
  processingTime: number
}

export default function GalleryPage() {
  const [images, setImages] = useState<ImageItem[]>([])
  const [filteredImages, setFilteredImages] = useState<ImageItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedPreset, setSelectedPreset] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Mock data
  useEffect(() => {
    const mockImages: ImageItem[] = [
      {
        id: '1',
        name: 'Portrait_001.jpg',
        beforeUrl: '/api/placeholder/300/200/666666/999999?text=Before',
        afterUrl: '/api/placeholder/300/200/4F46E5/7C3AED?text=After',
        status: 'completed',
        preset: 'Portrait',
        tags: ['portrait', 'people', 'professional'],
        createdAt: '2024-01-15T10:30:00Z',
        size: '2.4 MB',
        resolution: '1920x1080',
        processingTime: 45
      },
      {
        id: '2',
        name: 'Landscape_001.jpg',
        beforeUrl: '/api/placeholder/300/200/DC2626/B91C1C?text=Before',
        afterUrl: '/api/placeholder/300/200/059669/047857?text=After',
        status: 'completed',
        preset: 'Landscape',
        tags: ['landscape', 'nature', 'outdoor'],
        createdAt: '2024-01-15T09:15:00Z',
        size: '3.1 MB',
        resolution: '2560x1440',
        processingTime: 67
      },
      {
        id: '3',
        name: 'Product_001.jpg',
        beforeUrl: '/api/placeholder/300/200/7C2D12/92400E?text=Before',
        afterUrl: '/api/placeholder/300/200/1E40AF/1D4ED8?text=After',
        status: 'processing',
        preset: 'Product',
        tags: ['product', 'commercial', 'ecommerce'],
        createdAt: '2024-01-15T11:00:00Z',
        size: '1.8 MB',
        resolution: '1600x1200',
        processingTime: 0
      },
      {
        id: '4',
        name: 'Artistic_001.jpg',
        beforeUrl: '/api/placeholder/300/200/1E40AF/1D4ED8?text=Before',
        afterUrl: '/api/placeholder/300/200/7C2D12/92400E?text=After',
        status: 'failed',
        preset: 'Artistic',
        tags: ['artistic', 'creative', 'experimental'],
        createdAt: '2024-01-15T08:45:00Z',
        size: '4.2 MB',
        resolution: '3000x2000',
        processingTime: 0
      },
      {
        id: '5',
        name: 'Restoration_001.jpg',
        beforeUrl: '/api/placeholder/300/200/92400E/7C2D12?text=Before',
        afterUrl: '/api/placeholder/300/200/1D4ED8/1E40AF?text=After',
        status: 'completed',
        preset: 'Restoration',
        tags: ['restoration', 'vintage', 'family'],
        createdAt: '2024-01-14T16:20:00Z',
        size: '2.7 MB',
        resolution: '1800x1350',
        processingTime: 89
      },
      {
        id: '6',
        name: 'Portrait_002.jpg',
        beforeUrl: '/api/placeholder/300/200/666666/999999?text=Before',
        afterUrl: '/api/placeholder/300/200/4F46E5/7C3AED?text=After',
        status: 'completed',
        preset: 'Portrait',
        tags: ['portrait', 'people', 'studio'],
        createdAt: '2024-01-14T14:10:00Z',
        size: '2.1 MB',
        resolution: '1920x1080',
        processingTime: 52
      }
    ]
    setImages(mockImages)
    setFilteredImages(mockImages)
  }, [])

  // Filter images based on search and filters
  useEffect(() => {
    let filtered = images

    if (searchQuery) {
      filtered = filtered.filter(img => 
        img.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        img.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(img => img.status === selectedStatus)
    }

    if (selectedPreset !== 'all') {
      filtered = filtered.filter(img => img.preset === selectedPreset)
    }

    setFilteredImages(filtered)
  }, [images, searchQuery, selectedStatus, selectedPreset])

  const toggleImageSelection = (imageId: string) => {
    setSelectedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    )
  }

  const selectAllImages = () => {
    setSelectedImages(filteredImages.map(img => img.id))
  }

  const clearSelection = () => {
    setSelectedImages([])
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'processing': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <Sparkles className="w-4 h-4" />
      case 'processing': return <Eye className="w-4 h-4" />
      case 'failed': return <Trash2 className="w-4 h-4" />
      default: return <ImageIcon className="w-4 h-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-xl border-b border-slate-200/50 z-50">
        <div className="container mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Sharpii.ai
            </span>
          </Link>
          
          <div className="hidden lg:flex items-center space-x-6">
            <Link href="/upload" className="text-slate-600 hover:text-slate-900 transition-colors font-medium text-sm">Upload</Link>
            <Link href="/gallery" className="text-slate-600 hover:text-slate-900 transition-colors font-medium text-sm">Gallery</Link>
            <Link href="/editor" className="text-slate-600 hover:text-slate-900 transition-colors font-medium text-sm">Editor</Link>
            <Link href="/jobs" className="text-slate-600 hover:text-slate-900 transition-colors font-medium text-sm">Jobs</Link>
            <Link href="/dashboard" className="text-slate-600 hover:text-slate-900 transition-colors font-medium text-sm">Dashboard</Link>
          </div>
          
          <div className="hidden lg:flex items-center space-x-3">
            <Link href="/auth/signin">
              <Button variant="ghost" size="sm" className="font-medium text-sm">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm" className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-lg font-medium">
                Get Started Free
              </Button>
            </Link>
          </div>
          
          <button 
            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-200 py-4 px-6">
            <div className="flex flex-col space-y-3">
              <Link href="/upload" className="text-slate-600 hover:text-slate-900 transition-colors font-medium text-sm py-2">Upload</Link>
              <Link href="/gallery" className="text-slate-600 hover:text-slate-900 transition-colors font-medium text-sm py-2">Gallery</Link>
              <Link href="/editor" className="text-slate-600 hover:text-slate-900 transition-colors font-medium text-sm py-2">Editor</Link>
              <Link href="/jobs" className="text-slate-600 hover:text-slate-900 transition-colors font-medium text-sm py-2">Jobs</Link>
              <Link href="/dashboard" className="text-slate-600 hover:text-slate-900 transition-colors font-medium text-sm py-2">Dashboard</Link>
              <div className="border-t border-slate-200 pt-3 mt-3">
                <Link href="/auth/signin" className="block mb-2">
                  <Button variant="ghost" size="sm" className="w-full justify-start font-medium text-sm">Sign In</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm" className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg font-medium">
                    Get Started Free
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Image Gallery
              </h1>
              <p className="text-slate-600">
                {filteredImages.length} of {images.length} images
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              <div className="flex items-center border border-slate-200 rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search images, tags, or presets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedPreset} onValueChange={setSelectedPreset}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Preset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Presets</SelectItem>
                  <SelectItem value="Portrait">Portrait</SelectItem>
                  <SelectItem value="Landscape">Landscape</SelectItem>
                  <SelectItem value="Product">Product</SelectItem>
                  <SelectItem value="Artistic">Artistic</SelectItem>
                  <SelectItem value="Restoration">Restoration</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {showFilters && (
              <Card>
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <h3 className="font-medium mb-3">Tags</h3>
                      <div className="space-y-2">
                        {['portrait', 'landscape', 'product', 'artistic', 'restoration', 'people', 'nature', 'commercial'].map(tag => (
                          <label key={tag} className="flex items-center space-x-2 cursor-pointer">
                            <Checkbox />
                            <span className="text-sm text-slate-600 capitalize">{tag}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium mb-3">Date Range</h3>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <Checkbox />
                          <span className="text-sm text-slate-600">Last 24 hours</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <Checkbox />
                          <span className="text-sm text-slate-600">Last 7 days</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <Checkbox />
                          <span className="text-sm text-slate-600">Last 30 days</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium mb-3">Resolution</h3>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <Checkbox />
                          <span className="text-sm text-slate-600">HD (1920x1080)</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <Checkbox />
                          <span className="text-sm text-slate-600">4K (3840x2160)</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <Checkbox />
                          <span className="text-sm text-slate-600">Custom</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Bulk Actions */}
          {selectedImages.length > 0 && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-slate-600">
                      {selectedImages.length} images selected
                    </span>
                    <Button variant="ghost" size="sm" onClick={clearSelection}>
                      Clear Selection
                    </Button>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button variant="outline" size="sm">
                      <Tag className="w-4 h-4 mr-2" />
                      Add Tags
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download ZIP
                    </Button>
                    <Button variant="outline" size="sm">
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Re-process
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Image Grid */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredImages.map((image) => (
                <Card key={image.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <div className="relative h-64 bg-slate-100">
                      <img
                        src={image.afterUrl}
                        alt={image.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2">
                        <Badge className={getStatusColor(image.status)}>
                          {getStatusIcon(image.status)}
                          <span className="ml-1">{image.status}</span>
                        </Badge>
                      </div>
                      <div className="absolute top-2 right-2">
                        <Checkbox
                          checked={selectedImages.includes(image.id)}
                          onCheckedChange={() => toggleImageSelection(image.id)}
                          className="bg-white/90"
                        />
                      </div>
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="bg-black/50 backdrop-blur-sm rounded-lg p-2">
                          <div className="text-white text-sm font-medium truncate">{image.name}</div>
                          <div className="text-white/80 text-xs">{image.preset} • {image.resolution}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm text-slate-500">
                        {formatDate(image.createdAt)}
                      </div>
                      <div className="text-sm text-slate-500">
                        {image.size}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {image.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {image.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{image.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredImages.map((image) => (
                <Card key={image.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className="relative w-24 h-24 bg-slate-100 rounded-lg overflow-hidden">
                        <img
                          src={image.afterUrl}
                          alt={image.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-1 left-1">
                          <Badge className={getStatusColor(image.status)} size="sm">
                            {image.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium text-slate-900">{image.name}</h3>
                          <Badge variant="outline">{image.preset}</Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-slate-500 mb-2">
                          <span>{image.resolution}</span>
                          <span>{image.size}</span>
                          <span>{formatDate(image.createdAt)}</span>
                          {image.processingTime > 0 && (
                            <span>{image.processingTime}s processing</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {image.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedImages.includes(image.id)}
                          onCheckedChange={() => toggleImageSelection(image.id)}
                        />
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {filteredImages.length === 0 && (
            <Card className="text-center py-16">
              <CardContent>
                <ImageIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  No images found
                </h3>
                <p className="text-slate-600 mb-6">
                  {searchQuery || selectedStatus !== 'all' || selectedPreset !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Upload your first image to get started'
                  }
                </p>
                {!searchQuery && selectedStatus === 'all' && selectedPreset === 'all' && (
                  <Link href="/upload">
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Upload Images
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
