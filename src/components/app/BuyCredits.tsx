"use client"

import { useState, useEffect } from 'react'
// Removed useSupabase import
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, CreditCard, Zap, Star, Crown, Gem, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth, useSession } from '@/lib/auth-client-simple'

interface CreditPackage {
  credits: number
  price: number
  currency: string
  description: string
  productId: string
  bonus?: number
}

interface CreditPackages {
  starter: CreditPackage
  popular: CreditPackage
  premium: CreditPackage
  ultimate: CreditPackage
}

export default function BuyCredits() {
  const { user } = useAuth()
  const { data } = useSession()
  const [packages, setPackages] = useState<CreditPackages | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [customAmount, setCustomAmount] = useState('')
  const [purchasingPackage, setPurchasingPackage] = useState<string | null>(null)
  
  const ensureHttps = (url: string) => {
    if (!url) return url
    // Force HTTPS for Dodo checkout domain if anything returns http
    if (url.startsWith('http://checkout.dodopayments.com')) {
      return url.replace('http://', 'https://')
    }
    return url
  }
  
  // Load available packages
  const loadPackages = async () => {
    try {
      const response = await fetch('/api/credits/purchase', {
        method: 'GET',
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setPackages(data.packages)
      }
    } catch (error) {
      console.error('Failed to load credit packages:', error)
    }
  }
  
  // Load packages on component mount
  useEffect(() => {
    loadPackages()
  }, [])
  
  const buildAuthHeaders = () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (data?.session?.token) {
      headers['Authorization'] = `Bearer ${data.session.token}`
    }
    return headers
  }
  
  const redirectToLogin = () => {
    const redirect = encodeURIComponent(window.location.pathname + window.location.search + window.location.hash)
    window.location.href = `/app/login?redirect=${redirect}`
  }
  
  const handlePurchasePackage = async (packageType: string) => {
    if (!user) {
      toast.error('Please login to purchase credits')
      redirectToLogin()
      return
    }
    
    setPurchasingPackage(packageType)
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: buildAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ packageType })
      })
      
      if (response.status === 401) {
        toast.error('Your session has expired. Please login again.')
        redirectToLogin()
        return
      }
      
      const data = await response.json().catch(() => null)
      
      if (response.ok && data?.checkoutUrl) {
        const safeUrl = ensureHttps(data.checkoutUrl)
        toast.success('Redirecting to payment...')
        window.location.href = safeUrl
      } else {
        const message = data?.error || 'Failed to create payment'
        toast.error(message)
      }
    } catch (error) {
      console.error('Purchase error:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
      setPurchasingPackage(null)
    }
  }
  
  const handleCustomPurchase = async () => {
    if (!user) {
      toast.error('Please login to purchase credits')
      redirectToLogin()
      return
    }
    
    const amount = parseFloat(customAmount)
    if (isNaN(amount) || amount < 5 || amount > 500) {
      toast.error('Please enter an amount between $5 and $500')
      return
    }
    
    setPurchasingPackage('custom')
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: buildAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ customAmount: amount })
      })
      
      if (response.status === 401) {
        toast.error('Your session has expired. Please login again.')
        redirectToLogin()
        return
      }
      
      const data = await response.json().catch(() => null)
      
      if (response.ok && data?.checkoutUrl) {
        const safeUrl = ensureHttps(data.checkoutUrl)
        toast.success('Redirecting to payment...')
        window.location.href = safeUrl
      } else {
        const message = data?.error || 'Failed to create payment'
        toast.error(message)
      }
    } catch (error) {
      console.error('Purchase error:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
      setPurchasingPackage(null)
    }
  }
  
  const getPackageIcon = (packageType: string) => {
    switch (packageType) {
      case 'starter': return <Zap className="h-8 w-8 text-blue-500" />
      case 'popular': return <Star className="h-8 w-8 text-purple-500" />
      case 'premium': return <Crown className="h-8 w-8 text-yellow-500" />
      case 'ultimate': return <Gem className="h-8 w-8 text-pink-500" />
      default: return <CreditCard className="h-8 w-8 text-gray-500" />
    }
  }
  
  const getPackageBadge = (packageType: string) => {
    switch (packageType) {
      case 'popular': return <Badge className="bg-purple-100 text-purple-800">Most Popular</Badge>
      case 'premium': return <Badge className="bg-yellow-100 text-yellow-800">Best Value</Badge>
      case 'ultimate': return <Badge className="bg-pink-100 text-pink-800">Maximum Savings</Badge>
      default: return null
    }
  }
  
  if (!packages) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Buy Credits</h2>
        <p className="text-muted-foreground">
          Purchase additional credits to enhance more images. Credits never expire and can be used anytime.
        </p>
      </div>
      
      {/* Credit Packages */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(packages).map(([packageType, pkg]) => {
          const totalCredits = pkg.credits + (pkg.bonus || 0)
          const isPurchasing = purchasingPackage === packageType
          
          return (
            <Card key={packageType} className="relative">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                  {getPackageIcon(packageType)}
                </div>
                
                <div className="space-y-2">
                  <CardTitle className="capitalize">{packageType}</CardTitle>
                  {getPackageBadge(packageType)}
                </div>
                
                <div className="space-y-1">
                  <div className="text-3xl font-bold">${pkg.price}</div>
                  <div className="text-sm text-muted-foreground">
                    {pkg.credits.toLocaleString()} credits
                    {pkg.bonus && (
                      <span> + {pkg.bonus.toLocaleString()} bonus</span>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{pkg.description}</p>
                <div className="text-sm">
                  <span className="font-medium">Total:</span> {totalCredits.toLocaleString()} credits
                </div>
                
                <Button
                  className="w-full"
                  disabled={isLoading}
                  onClick={() => handlePurchasePackage(packageType)}
                >
                  {isPurchasing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" /> Buy Now
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Custom Amount */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Amount</CardTitle>
          <CardDescription>Enter a custom dollar amount to purchase credits at a fixed rate.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2">
              <Label htmlFor="customAmount">Amount (USD)</Label>
              <div className="flex items-center gap-2">
                <div className="px-3 py-2 rounded-md border bg-muted">$</div>
                <Input
                  id="customAmount"
                  type="number"
                  min={5}
                  max={500}
                  step={1}
                  placeholder="Enter amount (5 - 500)"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                You will receive approximately <span className="font-medium">{Math.max(0, Math.floor((parseFloat(customAmount) || 0) * 100)).toLocaleString()}</span> credits
              </p>
            </div>
            <div className="md:col-span-1">
              <Button
                className="w-full"
                variant="outline"
                disabled={isLoading}
                onClick={handleCustomPurchase}
              >
                {isLoading && purchasingPackage === 'custom' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <ExternalLink className="mr-2 h-4 w-4" /> Purchase
                  </>
                )}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Min $5, Max $500. Credits are delivered to your account after successful payment.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}