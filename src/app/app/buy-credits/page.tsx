'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth-client-simple'
import {
  Coins,
  CreditCard,
  Zap,
  Shield,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Calculator,
  DollarSign
} from 'lucide-react'

// Predefined credit packages
const CREDIT_PACKAGES = [
  {
    credits: 1000,
    price: 10,
    popular: false,
    bonus: 0,
    description: 'Perfect for trying out our services'
  },
  {
    credits: 5000,
    price: 45,
    popular: true,
    bonus: 500,
    description: 'Great value for regular users'
  },
  {
    credits: 10000,
    price: 80,
    popular: false,
    bonus: 1500,
    description: 'Best for power users'
  },
  {
    credits: 25000,
    price: 180,
    popular: false,
    bonus: 5000,
    description: 'Enterprise level usage'
  }
]

export default function BuyCreditsPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  const [selectedPackage, setSelectedPackage] = useState<number | null>(1) // Default to popular package
  const [customAmount, setCustomAmount] = useState('')
  const [customCredits, setCustomCredits] = useState('')
  const [isCustom, setIsCustom] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [currentCredits, setCurrentCredits] = useState(0)

  // Load current credit balance
  useEffect(() => {
    const loadCredits = async () => {
      if (!user?.id) return

      try {
        const response = await fetch('/api/debug/credits', {
          credentials: 'include'
        })
        if (response.ok) {
          const data = await response.json()
          setCurrentCredits(data?.credits?.balance || 0)
        }
      } catch (error) {
        console.error('Failed to load credits:', error)
      }
    }

    loadCredits()
  }, [user?.id])

  // Credit to USD conversion rate (adjustable)
  const CREDIT_TO_USD_RATE = 0.01 // 1 credit = $0.01

  const calculateCustomCredits = (usdAmount: string) => {
    const amount = parseFloat(usdAmount)
    if (isNaN(amount) || amount <= 0) return 0
    return Math.floor(amount / CREDIT_TO_USD_RATE)
  }

  const calculateCustomPrice = (credits: string) => {
    const creditAmount = parseInt(credits)
    if (isNaN(creditAmount) || creditAmount <= 0) return '0'
    return (creditAmount * CREDIT_TO_USD_RATE).toFixed(2)
  }

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value)
    setCustomCredits(calculateCustomCredits(value).toString())
  }

  const handleCustomCreditsChange = (value: string) => {
    setCustomCredits(value)
    setCustomAmount(calculateCustomPrice(value))
  }

  const handlePurchase = async () => {
    if (!user?.id) {
      router.push('/app/login')
      return
    }

    setProcessing(true)

    try {
      let credits: number
      let amount: number

      if (isCustom) {
        credits = parseInt(customCredits)
        amount = parseFloat(customAmount)

        if (isNaN(credits) || credits < 100 || isNaN(amount) || amount < 1) {
          alert('Please enter a valid amount. Minimum: 100 credits or $1')
          setProcessing(false)
          return
        }
      } else {
        if (selectedPackage === null) {
          alert('Please select a package')
          setProcessing(false)
          return
        }

        const package_ = CREDIT_PACKAGES[selectedPackage!]
        credits = (package_?.credits ?? 0) + (package_?.bonus ?? 0)
        amount = package_?.price ?? 0
      }

      // Create checkout session for one-time credit purchase
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: 'custom',
          billing_period: 'one_time',
          custom_amount: Math.round(amount * 100), // Convert to cents
          custom_credits: credits,
          return_url: `${window.location.origin}/app/dashboard?purchase=success`,
          cancel_url: `${window.location.origin}/app/buy-credits?purchase=cancelled`
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const data = await response.json()

      if (data.checkout_url) {
        // Redirect to payment page
        window.location.href = data.checkout_url
      } else {
        throw new Error('No checkout URL received')
      }

    } catch (error) {
      console.error('Purchase error:', error)
      alert('Failed to initiate purchase. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 to-black text-white">
        <main className="container mx-auto px-6 py-24">
          <div className="text-center text-white/70">Loading...</div>
        </main>
      </div>
    )
  }

  if (!user) {
    router.push('/app/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-black text-white">
      <main className="container mx-auto px-6 py-24">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Coins className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Buy Credits
              </h1>
            </div>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Purchase credits for your AI image enhancement needs.
              Flexible, affordable, and ready to use instantly.
            </p>
          </motion.div>
        </div>

        {/* Current Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <Card className="p-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <span className="text-gray-300">Current Balance:</span>
              </div>
              <span className="text-2xl font-bold text-white">
                {currentCredits.toLocaleString()} credits
              </span>
            </div>
          </Card>
        </motion.div>

        {/* Package Selection Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-800/50 rounded-lg p-1 flex gap-1">
            <button
              onClick={() => setIsCustom(false)}
              className={`px-6 py-2 rounded-md transition-all ${
                !isCustom
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Packages
            </button>
            <button
              onClick={() => setIsCustom(true)}
              className={`px-6 py-2 rounded-md transition-all ${
                isCustom
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Custom Amount
            </button>
          </div>
        </div>

        {!isCustom ? (
          /* Credit Packages */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            {CREDIT_PACKAGES.map((package_, index) => (
              <Card
                key={index}
                className={`p-6 cursor-pointer transition-all duration-300 hover:scale-105 ${
                  selectedPackage === index
                    ? 'bg-gradient-to-br from-blue-900/40 to-purple-900/40 border-blue-500/50 shadow-lg shadow-blue-500/25'
                    : 'bg-gray-900/50 border-gray-700 hover:border-gray-600'
                } ${package_.popular ? 'ring-2 ring-yellow-500/50' : ''}`}
                onClick={() => setSelectedPackage(index)}
              >
                {package_.popular && (
                  <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs font-bold px-3 py-1 rounded-full mb-4 text-center">
                    MOST POPULAR
                  </div>
                )}

                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Coins className="w-8 h-8 text-white" />
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2">
                    {package_.credits.toLocaleString()} Credits
                  </h3>

                  {package_.bonus > 0 && (
                    <div className="mb-2">
                      <span className="text-green-400 text-sm font-medium">
                        +{package_.bonus.toLocaleString()} bonus
                      </span>
                    </div>
                  )}

                  <div className="text-3xl font-bold text-white mb-2">
                    ${package_.price}
                  </div>

                  <p className="text-gray-400 text-sm mb-4">
                    {package_.description}
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-300">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      No expiration
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-300">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      Instant delivery
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </motion.div>
        ) : (
          /* Custom Amount */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-md mx-auto mb-8"
          >
            <Card className="p-6 bg-gray-900/50 border-gray-700">
              <div className="space-y-6">
                <div className="text-center">
                  <Calculator className="w-12 h-12 mx-auto mb-4 text-blue-400" />
                  <h3 className="text-xl font-bold text-white mb-2">Custom Purchase</h3>
                  <p className="text-gray-400">Enter your desired amount or number of credits</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="custom-amount" className="text-white mb-2 block">
                      Amount (USD)
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="custom-amount"
                        type="number"
                        min="1"
                        step="0.01"
                        value={customAmount}
                        onChange={(e) => handleCustomAmountChange(e.target.value)}
                        placeholder="10.00"
                        className="pl-10 bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                  </div>

                  <div className="text-center text-gray-400">
                    or
                  </div>

                  <div>
                    <Label htmlFor="custom-credits" className="text-white mb-2 block">
                      Number of Credits
                    </Label>
                    <div className="relative">
                      <Coins className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="custom-credits"
                        type="number"
                        min="100"
                        value={customCredits}
                        onChange={(e) => handleCustomCreditsChange(e.target.value)}
                        placeholder="1000"
                        className="pl-10 bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                  </div>

                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                    <div className="text-sm text-blue-300">
                      <div className="flex justify-between">
                        <span>Rate:</span>
                        <span>1 credit = $0.01</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Minimum:</span>
                        <span>100 credits ($1.00)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Purchase Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <Button
            onClick={handlePurchase}
            disabled={processing || (!isCustom && selectedPackage === null) || (isCustom && (!customAmount || !customCredits))}
            className="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                Purchase Credits
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>

          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Secure Payment
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Instant Delivery
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              No Expiration
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}