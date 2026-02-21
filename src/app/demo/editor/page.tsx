"use client"

import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Upload,
  Download,
  X,
  Maximize2,
  DollarSign,
  Info,
  Play,
  Crop,
  HelpCircle,
  RotateCcw,
  ArrowDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import MyPopupView from "@/components/ui/my-popup-view"
import { SimpleSegmentedControl } from "@/components/ui/simple-segmented-control"
import { ImageComparison, ImageComparisonImage, ImageComparisonSlider } from "@/components/ui/image-comparison"
import MyLoadingProcessIndicator from "@/components/ui/MyLoadingProcessIndicator"

// Area protection settings
interface AreaProtectionSettings {
  face: {
    skin: boolean
    mouth: boolean
    lowerLip: boolean
    upperLip: boolean
    nose: boolean
  }
  eyes: {
    eyeGeneral: boolean
    rightEye: boolean
    leftBrow: boolean
    rightBrow: boolean
    leftEye: boolean
  }
}

const DEFAULT_AREA_PROTECTION: AreaProtectionSettings = {
  face: {
    skin: false,
    mouth: true,
    lowerLip: true,
    upperLip: true,
    nose: false
  },
  eyes: {
    eyeGeneral: false,
    rightEye: true,
    leftBrow: true,
    rightBrow: false,
    leftEye: true
  }
}

export default function DemoEditorPage() {
  // Core state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null)
  const [enhancementType, setEnhancementType] = useState<'face' | 'body'>('face')
  const [enhancementMode, setEnhancementMode] = useState<'standard' | 'detailed' | 'heavy'>('standard')

  // Enhancement state
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [enhancementProgress, setEnhancementProgress] = useState(0)
  const [enhancementStatus, setEnhancementStatus] = useState<'loading' | 'success' | 'error'>('loading')

  // Area protection
  const [areaProtection, setAreaProtection] = useState<AreaProtectionSettings>(DEFAULT_AREA_PROTECTION)

  // Skin adjustment controls
  const [skinTextureAdjuster, setSkinTextureAdjuster] = useState(0.37)
  const [skinReductionLevel, setSkinReductionLevel] = useState(1.7)

  // UI state
  const [showPopupView, setShowPopupView] = useState(false)
  const [userCredits, setUserCredits] = useState(100.00)
  const [imageSize, setImageSize] = useState({ width: 960, height: 1280 })

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (files: FileList) => {
    const file = files[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          setImageSize({ width: img.width, height: img.height })
        }
        img.src = e.target?.result as string
        setUploadedImage(e.target?.result as string)
        setEnhancedImage(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleImageUpload(files)
    }
  }

  const handleEnhancement = async () => {
    if (!uploadedImage) return

    setIsEnhancing(true)
    setEnhancementProgress(0)
    setEnhancementStatus('loading')

    try {
      // Simulate enhancement process
      const progressInterval = setInterval(() => {
        setEnhancementProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval)
            return 95
          }
          return prev + Math.random() * 10 + 2
        })
      }, 500)

      await new Promise(resolve => setTimeout(resolve, 6000))

      clearInterval(progressInterval)
      setEnhancementProgress(100)
      setEnhancedImage(uploadedImage) // For demo
      setEnhancementStatus('success')
      setUserCredits(prev => Math.max(0, prev - 100))

      setTimeout(() => {
        setIsEnhancing(false)
        setEnhancementProgress(0)
      }, 3000)

    } catch (error) {
      console.error('Enhancement failed:', error)
      setEnhancementStatus('error')
      setTimeout(() => {
        setIsEnhancing(false)
        setEnhancementProgress(0)
      }, 3000)
    }
  }

  const updateAreaProtection = (category: 'face' | 'eyes', key: string, value: boolean) => {
    setAreaProtection(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }))
  }

  const downloadEnhancedImage = () => {
    if (enhancedImage) {
      const link = document.createElement('a')
      link.href = enhancedImage
      link.download = `enhanced-image-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Demo Header */}
      <div className="h-[72px] bg-black border-b border-gray-800 flex items-center justify-between px-6">
        <h1 className="text-xl font-semibold text-white">Sharpii.ai Editor - Demo</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">Demo Mode - No Authentication Required</span>
          <a
            href="/app/login"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium"
          >
            Login for Full Access
          </a>
        </div>
      </div>

      <div className="pt-0 flex h-[calc(100vh-72px)]">
        {/* Left Sidebar - Input Controls */}
        <div className="w-[35%] bg-black p-6 flex flex-col overflow-hidden">

          {/* Input Image */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white text-sm font-medium">Input Image</h3>
              <div className="flex items-center gap-3 text-xs">
                <button className="text-gray-400 hover:text-white flex items-center gap-1">
                  <HelpCircle className="w-3 h-3" />
                  Help
                </button>
                <button className="text-gray-400 hover:text-white flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              </div>
            </div>

            {!uploadedImage ? (
              <div
                className="border border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:border-gray-600 transition-all bg-gray-900/20"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                <p className="text-sm text-gray-400">Upload an image</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                />
              </div>
            ) : (
              <div className="relative rounded-lg overflow-hidden">
                <img
                  src={uploadedImage}
                  alt="Input"
                  className="w-full h-32 object-cover"
                />
                <button
                  onClick={() => setUploadedImage(null)}
                  className="absolute top-2 right-2 p-1 bg-black/70 backdrop-blur rounded hover:bg-black/80"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-1 mt-2 text-blue-400">
              <span className="text-xs">📷 Use Photo Resizer to crop & resize</span>
            </div>
          </div>

          {/* Enhancement Type */}
          <div className="mb-6">
            <Label className="text-white text-sm font-medium mb-3 block">Enhancement Type</Label>
            <div className="flex rounded-lg overflow-hidden">
              <button
                onClick={() => setEnhancementType('face')}
                className={cn(
                  "flex-1 py-2.5 px-4 text-sm font-medium transition-all",
                  enhancementType === 'face'
                    ? "bg-blue-600 text-white"
                    : "bg-transparent text-gray-400 hover:text-white"
                )}
              >
                Face
              </button>
              <button
                onClick={() => setEnhancementType('body')}
                className={cn(
                  "flex-1 py-2.5 px-4 text-sm font-medium transition-all",
                  enhancementType === 'body'
                    ? "bg-blue-600 text-white"
                    : "bg-transparent text-gray-400 hover:text-white"
                )}
              >
                Body
              </button>
            </div>
          </div>

          {/* Face Detection & Cropping */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-white text-sm font-medium">Face Detection & Cropping</Label>
              <span className="text-xs text-blue-400 bg-blue-400/20 px-2 py-0.5 rounded">Recommended</span>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Upgrade to Creator or Professional to access face detection and cropping features
            </p>
            <button className="flex items-center gap-2 text-xs text-blue-400 bg-gray-800 px-3 py-1.5 rounded">
              <Crop className="w-3 h-3" />
              Crop
            </button>
          </div>

          {/* Select Enhancement Mode */}
          <div className="mb-6">
            <Label className="text-white text-sm font-medium mb-3 block">Select Enhancement Mode</Label>
            <div className="flex rounded-lg overflow-hidden">
              {['standard', 'detailed', 'heavy'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setEnhancementMode(mode as typeof enhancementMode)}
                  className={cn(
                    "flex-1 py-2 px-3 text-xs font-medium transition-all capitalize",
                    enhancementMode === mode
                      ? "bg-blue-600 text-white"
                      : "bg-transparent text-gray-400 hover:text-white"
                  )}
                >
                  {mode}
                  {mode === 'heavy' && <span className="ml-1 text-red-400">⚠</span>}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Balanced enhancement suitable for most images. Keeps image identity intact.
            </p>
          </div>

          {/* Skin Texture Adjuster */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-white text-sm font-medium">Skin Texture Adjuster</Label>
              <span className="text-sm text-white font-mono">{skinTextureAdjuster.toFixed(2)}</span>
            </div>
            <Slider
              value={[skinTextureAdjuster]}
              onValueChange={(value) => setSkinTextureAdjuster(value[0])}
              min={0}
              max={1}
              step={0.01}
              className="w-full"
            />
          </div>

          {/* Skin Reduction Level */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-white text-sm font-medium">Skin Reduction Level</Label>
              <span className="text-sm text-white font-mono">{skinReductionLevel.toFixed(1)}</span>
            </div>
            <Slider
              value={[skinReductionLevel]}
              onValueChange={(value) => setSkinReductionLevel(value[0])}
              min={0}
              max={3}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Detailed</span>
              <span>Realistic</span>
            </div>
          </div>

          {/* Cost */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-white">
              <DollarSign className="w-4 h-4 text-blue-400" />
              <span>Cost: 100.00 Credits</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">{imageSize.width} x {imageSize.height} px</p>
          </div>

          {/* Enhance Button */}
          <Button
            onClick={handleEnhancement}
            disabled={!uploadedImage || isEnhancing}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm py-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            Enhance {enhancementType === 'face' ? 'Face' : 'Body'} (Demo)
          </Button>

          <p className="text-xs text-gray-500 text-center mb-6">
            Use smaller images (512px) for testing. Higher resolution images consume more credits.
          </p>

          {/* Bottom Links */}
          <div className="mt-auto flex justify-between text-xs">
            <button className="text-gray-400 hover:text-white">Best Practices</button>
            <button className="text-gray-400 hover:text-white">Pricing</button>
          </div>
        </div>

        {/* Right Main Area - Result */}
        <div className="flex-1 bg-black flex flex-col overflow-hidden border-l border-gray-800/50">

          {/* Result Header */}
          <div className="px-6 py-4">
            <h2 className="text-white text-sm font-medium">Result</h2>
          </div>

          {/* Image Comparison */}
          <div className="flex-1 relative">
            {!uploadedImage ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-900/50 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-gray-600" />
                  </div>
                  <p className="text-sm text-gray-500">Upload an image to get started</p>
                </div>
              </div>
            ) : !enhancedImage ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Click "Enhance" to process your image</p>
                </div>
              </div>
            ) : (
              <>
                {/* Image Comparison Component */}
                <ImageComparison className="w-full h-full">
                  <ImageComparisonImage
                    src={uploadedImage}
                    alt="Original"
                    position="left"
                    className="object-contain"
                  />
                  <ImageComparisonImage
                    src={enhancedImage}
                    alt="Enhanced"
                    position="right"
                    className="object-contain"
                  />
                  <ImageComparisonSlider className="w-0.5 bg-white" />
                </ImageComparison>

                {/* Top Right Controls */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <button className="flex items-center gap-2 px-3 py-1.5 bg-black/50 backdrop-blur rounded-lg hover:bg-black/70 text-white text-xs">
                    <Play className="w-3 h-3" />
                    Generate Video
                  </button>
                  <button
                    onClick={() => setShowPopupView(true)}
                    className="p-2 bg-black/50 backdrop-blur rounded-lg hover:bg-black/70"
                  >
                    <Maximize2 className="w-4 h-4 text-white" />
                  </button>
                  <button
                    onClick={downloadEnhancedImage}
                    className="p-2 bg-black/50 backdrop-blur rounded-lg hover:bg-black/70"
                  >
                    <ArrowDown className="w-4 h-4 text-white" />
                  </button>
                </div>

                {/* Center Text */}
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-center">
                  <p className="text-xs text-gray-400">Drag slider to compare</p>
                </div>

                {/* Bottom Action Buttons */}
                <div className="absolute bottom-6 left-6 right-6 flex justify-between">
                  <div className="text-center">
                    <button className="bg-black/50 backdrop-blur px-4 py-2 rounded-lg text-xs text-white hover:bg-black/70 flex items-center gap-2">
                      <Upload className="w-3 h-3" />
                      Upscale Image
                    </button>
                    <p className="text-xs text-gray-500 mt-1">General upscaling</p>
                  </div>
                  <div className="text-center">
                    <button className="bg-black/50 backdrop-blur px-4 py-2 rounded-lg text-xs text-white hover:bg-black/70 flex items-center gap-2">
                      <Upload className="w-3 h-3" />
                      Upscale Portrait
                    </button>
                    <p className="text-xs text-gray-500 mt-1">Optimized for faces</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Keep Certain Areas Unchanged */}
          {enhancedImage && (
            <div className="px-6 py-6 border-t border-gray-800/50">
              <div className="mb-4">
                <h3 className="text-white text-sm font-medium mb-2">Keep Certain Areas Unchanged</h3>
                <p className="text-xs text-gray-400 mb-4">
                  These options control which facial features will be preserved during enhancement. By default, mouth, lips and eyes are already selected to maintain natural expressions.
                </p>

                <div className="flex justify-between text-xs text-gray-400 mb-4">
                  <button className="hover:text-white">7 selected</button>
                  <button className="hover:text-white">Reset all</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                {/* FACE */}
                <div>
                  <h4 className="text-xs font-medium text-gray-300 mb-4 uppercase tracking-wider">FACE</h4>
                  <div className="space-y-3">
                    {Object.entries(areaProtection.face).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <Label className="text-xs text-gray-300 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </Label>
                        <button
                          onClick={() => updateAreaProtection('face', key, !value)}
                          className={cn(
                            "w-10 h-5 rounded-full transition-all relative",
                            value ? "bg-blue-600" : "bg-gray-600"
                          )}
                        >
                          <div className={cn(
                            "absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform",
                            value ? "translate-x-5" : "translate-x-0.5"
                          )} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* EYES */}
                <div>
                  <h4 className="text-xs font-medium text-gray-300 mb-4 uppercase tracking-wider">EYES</h4>
                  <div className="space-y-3">
                    {Object.entries(areaProtection.eyes).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <Label className="text-xs text-gray-300">
                          {key === 'eyeGeneral' ? 'Eye General'
                           : key === 'rightEye' ? 'Right Eye'
                           : key === 'leftBrow' ? 'Left Brow'
                           : key === 'rightBrow' ? 'Right Brow'
                           : 'Left Eye'}
                        </Label>
                        <button
                          onClick={() => updateAreaProtection('eyes', key, !value)}
                          className={cn(
                            "w-10 h-5 rounded-full transition-all relative",
                            value ? "bg-blue-600" : "bg-gray-600"
                          )}
                        >
                          <div className={cn(
                            "absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform",
                            value ? "translate-x-5" : "translate-x-0.5"
                          )} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading Process Indicator */}
      <MyLoadingProcessIndicator
        isVisible={isEnhancing}
        progress={enhancementProgress}
        status={enhancementStatus}
      />

      {/* Popup View Modal */}
      {showPopupView && uploadedImage && enhancedImage && (
        <MyPopupView
          isOpen={showPopupView}
          onClose={() => setShowPopupView(false)}
          beforeImage={uploadedImage}
          afterImage={enhancedImage}
          title="AI Enhanced Image"
          description="Professional image enhancement"
        />
      )}
    </div>
  )
}