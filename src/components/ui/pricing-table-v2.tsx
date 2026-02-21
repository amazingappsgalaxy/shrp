"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Check, Sparkles, ArrowRight, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSession } from "@/lib/auth-client-simple"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

// EXACT DATA RESTORED from MyPricingPlans2
const plans = [
    {
        name: "Starter",
        price: "$0",
        period: "top-up",
        subtitle: "Perfect for testing the waters.",
        features: ["5 Free Credits", "Standard Generation Speed", "Public Gallery", "720p Resolution"],
        id: "starter",
        highlight: false,
        popular: false
    },
    {
        name: "Creator",
        price: "$29",
        period: "month",
        subtitle: "For hobbyists and content creators.",
        features: ["1000 Credits/mo", "Fast Generation", "Private Gallery", "4K Resolution", "Priority Support"],
        id: "creator",
        highlight: true,
        popular: true
    },
    {
        name: "Professional",
        price: "$99",
        period: "month",
        subtitle: "Power users demanding the best.",
        features: ["Unlimited Slow Gen", "5000 Fast Credits", "Commercial License", "8K Resolution", "API Access", "24/7 Support"],
        id: "professional",
        highlight: false,
        popular: false
    }
]

export function PricingTableV2() {
    const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')
    const [isLoading, setIsLoading] = useState<string | null>(null)
    const { data: authData, isLoading: sessionLoading } = useSession()
    const router = useRouter()

    const handlePlanSelect = async (plan: any) => {
        setIsLoading(plan.name)

        try {
            if (sessionLoading) {
                setTimeout(() => { setIsLoading(null); handlePlanSelect(plan) }, 300); return
            }

            if (!authData?.user) {
                const planData = { plan: plan.name.toLowerCase().replace(/\s+/g, '_'), billingPeriod: billing }
                localStorage.setItem('selectedPlan', JSON.stringify(planData))
                router.push('/app/login')
                return
            }

            if (plan.price === "$0") {
                toast.success("Welcome to the Starter plan!")
                router.push('/app/dashboard')
                return
            }

            const requestBody = { plan: plan.name.toLowerCase().replace(/\s+/g, '_'), billingPeriod: billing }
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 20000)

            const response = await fetch('/api/payments/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(requestBody),
                signal: controller.signal
            })

            clearTimeout(timeoutId)
            let data: any = null
            try { data = await response.json() } catch (e) { toast.error('Invalid response'); return }

            if (response.status === 401) {
                const planData = { plan: plan.name.toLowerCase().replace(/\s+/g, '_'), billingPeriod: billing }
                localStorage.setItem('selectedPlan', JSON.stringify(planData))
                router.push('/app/login')
                return
            }
            if (!response.ok) { toast.error(data?.error || 'Failed'); return }

            if (data?.checkoutUrl) window.location.href = data.checkoutUrl
            else toast.error('No checkout URL')

        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Checkout failed')
        } finally {
            setIsLoading(null)
        }
    }

    return (
        <section className="py-24 bg-black border-t border-white/5 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-[#FFFF00]/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">
                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFFF00]/10 border border-[#FFFF00]/20 text-[#FFFF00] text-xs font-bold uppercase tracking-widest mb-4">
                        <Sparkles className="w-3 h-3" />
                        Flexible Pricing
                    </div>
                    <h2 className="text-5xl md:text-7xl font-bold font-heading text-white mb-6">
                        Plans that Scale <br />
                        <span className="text-[#FFFF00]">with You.</span>
                    </h2>
                    <p className="text-white/50 max-w-xl mx-auto text-lg">
                        Whether you need a quick fix or professional workflow tools, we have a plan for you. No hidden fees.
                    </p>

                    {/* Toggle */}
                    <div className="mt-8 inline-flex bg-white/5 p-1 rounded-full border border-white/10">
                        {['monthly', 'yearly'].map((period) => (
                            <button
                                key={period}
                                onClick={() => setBilling(period as any)}
                                className={cn(
                                    "px-8 py-3 rounded-full text-sm font-bold transition-all duration-300 capitalize",
                                    billing === period
                                        ? "bg-white text-black shadow-lg scale-105"
                                        : "text-white/50 hover:text-white"
                                )}
                            >
                                {period}
                                {period === 'yearly' && <span className="ml-2 text-[10px] bg-[#FFFF00] text-black px-1.5 py-0.5 rounded-full font-black">-20%</span>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Cards */}
                <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto items-center">
                    {plans.map((plan, i) => {
                        const priceNum = parseInt(plan.price.replace('$', '')) || 0
                        const displayPrice = billing === 'yearly' && priceNum > 0 ? Math.round(priceNum * 0.8) : priceNum
                        // Creator is highlighted in V1, so we keep that here.
                        const isHighlight = plan.highlight

                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className={cn(
                                    "relative p-8 rounded-[2rem] border transition-all duration-300 group flex flex-col h-full",
                                    isHighlight
                                        ? "bg-[#FFFF00] border-[#FFFF00] shadow-[0_0_60px_-15px_rgba(255,255,0,0.3)] scale-105 z-10"
                                        : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
                                )}
                            >
                                {plan.popular && (
                                    <div className="absolute top-0 right-0 p-4">
                                        <div className="bg-black/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-black">
                                            Most Popular
                                        </div>
                                    </div>
                                )}

                                <div className="mb-8">
                                    <h3 className={cn("text-2xl font-bold font-heading mb-2", isHighlight ? "text-black" : "text-white")}>
                                        {plan.name}
                                    </h3>
                                    <p className={cn("text-sm font-medium opacity-70 mb-6 h-10", isHighlight ? "text-black" : "text-white")}>
                                        {plan.subtitle}
                                    </p>
                                    <div className="flex items-baseline gap-1">
                                        <span className={cn("text-6xl font-black font-heading tracking-tighter", isHighlight ? "text-black" : "text-white")}>
                                            ${displayPrice}
                                        </span>
                                        <span className={cn("text-sm font-bold opacity-60", isHighlight ? "text-black" : "text-white")}>
                                            /{plan.period === 'top-up' ? 'once' : plan.period}
                                        </span>
                                    </div>
                                    {billing === 'yearly' && plan.price !== "$0" && (
                                        <p className={cn("text-xs font-bold mt-2", isHighlight ? "text-black/60" : "text-[#FFFF00]")}>
                                            Billed ${Math.round(priceNum * 0.8 * 12)} yearly
                                        </p>
                                    )}
                                </div>

                                <div className={cn("w-full h-px mb-8", isHighlight ? "bg-black/10" : "bg-white/10")} />

                                <ul className="space-y-4 mb-8 flex-1">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-3">
                                            <div className={cn(
                                                "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                                                isHighlight ? "bg-black/10 text-black" : "bg-white/10 text-[#FFFF00]"
                                            )}>
                                                <Check className="w-3 h-3" />
                                            </div>
                                            <span className={cn("text-sm font-medium opacity-80 leading-tight", isHighlight ? "text-black" : "text-white")}>
                                                {feature}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => handlePlanSelect(plan)}
                                    disabled={isLoading === plan.name}
                                    className={cn(
                                        "w-full py-4 rounded-xl font-bold text-lg transition-all active:scale-95 flex items-center justify-center gap-2 group/btn",
                                        isHighlight
                                            ? "bg-black text-white hover:bg-black/80 shadow-lg"
                                            : "bg-white text-black hover:bg-white/90"
                                    )}>
                                    {isLoading === plan.name ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                                        </>
                                    ) : (
                                        <>
                                            Get Started
                                            <ArrowRight className="w-5 h-5 transition-transform group-hover/btn:translate-x-1" />
                                        </>
                                    )}
                                </button>
                            </motion.div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
