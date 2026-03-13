'use client'
import { useEffect } from 'react'
import { track } from '@/lib/analytics'

export function PricingPageTracker() {
  useEffect(() => {
    track.pricingViewed()
  }, [])
  return null
}
