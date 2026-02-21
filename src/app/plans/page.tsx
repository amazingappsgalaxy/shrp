"use client"

import { MyPricingPlans2 } from "@/components/ui/mypricingplans2"

export default function PlansPage() {
  return (
    <div className="min-h-screen">
      <div className="pt-20">
        <MyPricingPlans2
          title="Choose Your Perfect Plan"
          subtitle="Transform your images with professional AI enhancement. Start with any plan."
        />
      </div>
    </div>
  )
}