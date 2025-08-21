"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

interface LazyImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  fill?: boolean
  priority?: boolean
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  sizes?: string
  onLoad?: () => void
  onError?: () => void
  fallbackSrc?: string
}

export function LazyImage({
  src,
  alt,
  width,
  height,
  className = "",
  fill = false,
  priority = false,
  quality = 75,
  placeholder = 'blur',
  blurDataURL,
  sizes,
  onLoad,
  onError,
  fallbackSrc,
}: LazyImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(src)
  const imgRef = useRef<HTMLImageElement>(null)

  // Generate a low-quality placeholder if none provided
  const generateBlurDataURL = (w: number = 10, h: number = 10) => {
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#1a1a1a'
      ctx.fillRect(0, 0, w, h)
    }
    return canvas.toDataURL()
  }

  const defaultBlurDataURL = blurDataURL || generateBlurDataURL()

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    setIsLoading(false)
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc)
      setHasError(false)
      setIsLoading(true)
    }
    onError?.()
  }

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Image is in viewport, start loading
            observer.unobserve(entry.target)
          }
        })
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [priority])

  if (hasError && !fallbackSrc) {
    return (
      <div className={`flex items-center justify-center bg-surface-elevated rounded-lg ${className}`}>
        <div className="text-center p-4">
          <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-surface flex items-center justify-center">
            <svg className="w-6 h-6 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-xs text-text-muted">Failed to load image</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden ${className}`} ref={imgRef}>
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center bg-surface-elevated"
          >
            {/* Loading skeleton */}
            <div className="w-full h-full bg-gradient-to-r from-surface via-surface-elevated to-surface animate-pulse" />
            
            {/* Loading spinner */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="w-8 h-8 border-2 border-accent-neon border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoading ? 0 : 1 }}
        transition={{ duration: 0.3 }}
      >
        <Image
          src={currentSrc}
          alt={alt}
          width={width}
          height={height}
          fill={fill}
          priority={priority}
          quality={quality}
          placeholder={placeholder}
          blurDataURL={defaultBlurDataURL}
          sizes={sizes}
          className="object-cover"
          onLoad={handleLoad}
          onError={handleError}
        />
      </motion.div>
    </div>
  )
}

// Progressive image loading component
interface ProgressiveImageProps extends LazyImageProps {
  lowQualitySrc?: string
}

export function ProgressiveImage({
  src,
  lowQualitySrc,
  alt,
  className = "",
  ...props
}: ProgressiveImageProps) {
  const [highQualityLoaded, setHighQualityLoaded] = useState(false)

  return (
    <div className={`relative ${className}`}>
      {/* Low quality image */}
      {lowQualitySrc && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: highQualityLoaded ? 0 : 1 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0"
        >
          <LazyImage
            src={lowQualitySrc}
            alt={alt}
            quality={10}
            {...props}
          />
        </motion.div>
      )}

      {/* High quality image */}
      <LazyImage
        src={src}
        alt={alt}
        onLoad={() => setHighQualityLoaded(true)}
        {...props}
      />
    </div>
  )
}

// Optimized image with WebP support
interface OptimizedImageProps extends LazyImageProps {
  webpSrc?: string
  avifSrc?: string
}

export function OptimizedImage({
  src,
  webpSrc,
  avifSrc,
  alt,
  ...props
}: OptimizedImageProps) {
  const [supportedFormat, setSupportedFormat] = useState<string>(src)

  useEffect(() => {
    const checkWebPSupport = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 1
      canvas.height = 1
      const ctx = canvas.getContext('2d')
      if (ctx) {
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
      }
      return false
    }

    const checkAVIFSupport = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 1
      canvas.height = 1
      const ctx = canvas.getContext('2d')
      if (ctx) {
        return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0
      }
      return false
    }

    if (avifSrc && checkAVIFSupport()) {
      setSupportedFormat(avifSrc)
    } else if (webpSrc && checkWebPSupport()) {
      setSupportedFormat(webpSrc)
    }
  }, [src, webpSrc, avifSrc])

  return <LazyImage src={supportedFormat} alt={alt} {...props} />
}

// Image with zoom on hover
interface ZoomImageProps extends LazyImageProps {
  zoomScale?: number
}

export function ZoomImage({
  zoomScale = 1.1,
  className = "",
  ...props
}: ZoomImageProps) {
  return (
    <motion.div
      className={`overflow-hidden ${className}`}
      whileHover={{ scale: zoomScale }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <LazyImage {...props} />
    </motion.div>
  )
}

// Utility function to generate optimized image URLs
export function getOptimizedImageUrl(
  src: string,
  width?: number,
  height?: number,
  quality: number = 75,
  format: 'webp' | 'avif' | 'jpeg' = 'webp'
) {
  // This would typically integrate with your image optimization service
  // For now, return the original src
  const params = new URLSearchParams()
  
  if (width) params.set('w', width.toString())
  if (height) params.set('h', height.toString())
  params.set('q', quality.toString())
  params.set('f', format)

  return `${src}?${params.toString()}`
}

// Hook for preloading images
export function useImagePreloader(urls: string[]) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())

  useEffect(() => {
    const preloadImage = (url: string) => {
      return new Promise<void>((resolve, reject) => {
        const img = new window.Image()
        img.onload = () => {
          setLoadedImages(prev => new Set(prev).add(url))
          resolve()
        }
        img.onerror = reject
        img.src = url
      })
    }

    Promise.allSettled(urls.map(preloadImage))
  }, [urls])

  return loadedImages
}