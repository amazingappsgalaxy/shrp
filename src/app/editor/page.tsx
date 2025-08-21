'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Sparkles, 
  Settings, 
  Download, 
  RotateCcw, 
  Eye, 
  EyeOff,
  ZoomIn,
  ZoomOut,
  Move,
  Palette,
  Sun,
  Droplets,
  Zap,
  Save,
  Share2,
  Menu,
  X
} from 'lucide-react'
import Link from 'next/link'

interface Preset {
  id: string
  name: string
  thumbnail: string
  description: string
  category: string
}

export default function EditorPage() {
  const [sliderPosition, setSliderPosition] = useState(50)
  const [zoom, setZoom] = useState(100)
  const [enhancementStrength, setEnhancementStrength] = useState(75)
  const [selectedPreset, setSelectedPreset] = useState<string>('portrait')
  const [showBeforeAfter, setShowBeforeAfter] = useState(true)
  const [manualControls, setManualControls] = useState({
    exposure: 0,
    contrast: 0,
    saturation: 0,
    denoise: 0,
    sharpness: 0,
    temperature: 0
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const presets: Preset[] = [
    {
      id: 'portrait',
      name: 'Portrait',
      thumbnail: '/api/placeholder/120/120/4F46E5/7C3AED?text=P',
      description: 'Perfect for portraits and people',
      category: 'People'
    },
    {
      id: 'landscape',
      name: 'Landscape',
      thumbnail: '/api/placeholder/120/120/059669/047857?text=L',
      description: 'Enhance natural landscapes',
      category: 'Nature'
    },
    {
      id: 'product',
      name: 'Product',
      thumbnail: '/api/placeholder/120/120/DC2626/B91C1C?text=Pr',
      description: 'Professional product photography',
      category: 'Commercial'
    },
    {
      id: 'artistic',
      name: 'Artistic',
      thumbnail: '/api/placeholder/120/120/7C2D12/92400E?text=A',
      description: 'Creative and artistic enhancement',
      category: 'Creative'
    },
    {
      id: 'restoration',
      name: 'Restoration',
      thumbnail: '/api/placeholder/120/120/1E40AF/1D4ED8?text=R',
      description: 'Restore old or damaged photos',
      category: 'Restoration'
    }
  ]

  const handleSliderChange = (value: number[]) => {
    setSliderPosition(value[0])
  }

  const handleManualControlChange = (control: string, value: number[]) => {
    setManualControls(prev => ({
      ...prev,
      [control]: value[0]
    }))
  }

  const processImage = async () => {
    setIsProcessing(true)
    setProcessingProgress(0)

    // Simulate processing
    const interval = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsProcessing(false)
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  const resetControls = () => {
    setManualControls({
      exposure: 0,
      contrast: 0,
      saturation: 0,
      denoise: 0,
      sharpness: 0,
      temperature: 0
    })
    setEnhancementStrength(75)
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
                Enhancement Studio
              </h1>
              <p className="text-slate-600">
                Fine-tune your image enhancement with advanced controls
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={resetControls}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button 
                onClick={processImage}
                disabled={isProcessing}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isProcessing ? 'Processing...' : 'Process Image'}
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Main Editor Area */}
            <div className="lg:col-span-3">
              {/* Before/After Slider */}
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Image Preview</CardTitle>
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowBeforeAfter(!showBeforeAfter)}
                      >
                        {showBeforeAfter ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                        {showBeforeAfter ? 'Hide' : 'Show'} Before/After
                      </Button>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setZoom(Math.max(50, zoom - 25))}
                        >
                          <ZoomOut className="w-4 h-4" />
                        </Button>
                        <span className="text-sm text-slate-600 w-12 text-center">{zoom}%</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setZoom(Math.min(400, zoom + 25))}
                        >
                          <ZoomIn className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="relative bg-slate-100 rounded-lg overflow-hidden">
                    <div className="relative" style={{ height: '500px' }}>
                      {/* Before Image */}
                      <img
                        src="/api/placeholder/800/500/666666/999999?text=Before"
                        alt="Before"
                        className="absolute top-0 left-0 right-0 bottom-0 w-full h-full object-cover"
                        style={{ transform: `scale(${zoom / 100})` }}
                      />
                      
                      {/* After Image (overlay) */}
                      {showBeforeAfter && (
                        <div 
                          className="absolute top-0 left-0 right-0 bottom-0 overflow-hidden"
                          style={{ width: `${sliderPosition}%` }}
                        >
                          <img
                            src="/api/placeholder/800/500/4F46E5/7C3AED?text=After"
                            alt="After"
                            className="absolute top-0 left-0 right-0 bottom-0 w-full h-full object-cover"
                            style={{ transform: `scale(${zoom / 100})` }}
                          />
                        </div>
                      )}
                      
                      {/* Slider Handle */}
                      {showBeforeAfter && (
                        <div 
                          className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-lg z-10"
                          style={{ left: `${sliderPosition}%` }}
                          onMouseDown={(e) => {
                            const handleMouseMove = (e: MouseEvent) => {
                              const rect = e.currentTarget?.getBoundingClientRect()
                              if (rect) {
                                const x = e.clientX - rect.left
                                const percentage = (x / rect.width) * 100
                                setSliderPosition(Math.max(0, Math.min(100, percentage)))
                              }
                            }
                            const handleMouseUp = () => {
                              document.removeEventListener('mousemove', handleMouseMove)
                              document.removeEventListener('mouseup', handleMouseUp)
                            }
                            document.addEventListener('mousemove', handleMouseMove)
                            document.addEventListener('mouseup', handleMouseUp)
                          }}
                        />
                      )}
                      
                      {/* Labels */}
                      {showBeforeAfter && (
                        <>
                          <div className="absolute top-4 left-4 bg-black/20 backdrop-blur-sm rounded-lg px-3 py-2">
                            <span className="text-sm font-medium text-white">Before</span>
                          </div>
                          <div className="absolute top-4 right-4 bg-black/20 backdrop-blur-sm rounded-lg px-3 py-2">
                            <span className="text-sm font-medium text-white">After</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Slider Control */}
                  {showBeforeAfter && (
                    <div className="mt-4">
                      <Slider
                        value={[sliderPosition]}
                        onValueChange={handleSliderChange}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-slate-500 mt-2">
                        <span>Before</span>
                        <span>After</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Processing Progress */}
              {isProcessing && (
                <Card className="mb-6">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-medium">Processing Image...</span>
                          <span className="text-slate-500">{processingProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${processingProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Controls Sidebar */}
            <div className="lg:col-span-1">
              {/* Preset Selection */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Presets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {presets.map((preset) => (
                      <div
                        key={preset.id}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedPreset === preset.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                        onClick={() => setSelectedPreset(preset.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden">
                            <img 
                              src={preset.thumbnail} 
                              alt={preset.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-slate-900">{preset.name}</div>
                            <div className="text-xs text-slate-500">{preset.category}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Enhancement Strength */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Enhancement Strength</CardTitle>
                </CardHeader>
                <CardContent>
                  <Slider
                    value={[enhancementStrength]}
                    onValueChange={(value) => setEnhancementStrength(value[0])}
                    max={100}
                    step={5}
                    className="w-full mb-4"
                  />
                  <div className="text-center">
                    <Badge variant="secondary" className="text-lg px-4 py-2">
                      {enhancementStrength}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Manual Controls */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Manual Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Exposure</span>
                      <span className="text-xs text-slate-500">{manualControls.exposure}</span>
                    </div>
                    <Slider
                      value={[manualControls.exposure]}
                      onValueChange={(value) => handleManualControlChange('exposure', value)}
                      min={-100}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Contrast</span>
                      <span className="text-xs text-slate-500">{manualControls.contrast}</span>
                    </div>
                    <Slider
                      value={[manualControls.contrast]}
                      onValueChange={(value) => handleManualControlChange('contrast', value)}
                      min={-100}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Saturation</span>
                      <span className="text-xs text-slate-500">{manualControls.saturation}</span>
                    </div>
                    <Slider
                      value={[manualControls.saturation]}
                      onValueChange={(value) => handleManualControlChange('saturation', value)}
                      min={-100}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Denoise</span>
                      <span className="text-xs text-slate-500">{manualControls.denoise}</span>
                    </div>
                    <Slider
                      value={[manualControls.denoise]}
                      onValueChange={(value) => handleManualControlChange('denoise', value)}
                      min={0}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Sharpness</span>
                      <span className="text-xs text-slate-500">{manualControls.sharpness}</span>
                    </div>
                    <Slider
                      value={[manualControls.sharpness]}
                      onValueChange={(value) => handleManualControlChange('sharpness', value)}
                      min={0}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Temperature</span>
                      <span className="text-xs text-slate-500">{manualControls.temperature}</span>
                    </div>
                    <Slider
                      value={[manualControls.temperature]}
                      onValueChange={(value) => handleManualControlChange('temperature', value)}
                      min={-100}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Additional Options */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-900">Tileable Output</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-900">Preserve Identity</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-900">High Quality</span>
                  </label>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {/* Save preset logic */}}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Preset
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {/* Share logic */}}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {/* Download logic */}}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
