'use client'

import { motion } from "framer-motion"
import { Users, Zap, TrendingUp, Shield } from "lucide-react"

const stats = [
  {
    icon: Users,
    value: "10M+",
    label: "Active Users",
    description: "Trusted by millions worldwide"
  },
  {
    icon: Zap,
    value: "99.9%",
    label: "Uptime",
    description: "Reliable service you can count on"
  },
  {
    icon: TrendingUp,
    value: "300%",
    label: "Performance Boost",
    description: "Average improvement in efficiency"
  },
  {
    icon: Shield,
    value: "256-bit",
    label: "Encryption",
    description: "Enterprise-grade security"
  }
]

export function StatsSection() {
  return (
    <section className="py-20 bg-gradient-to-r from-primary/5 via-background to-primary/5">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Trusted by industry leaders
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Our numbers speak for themselves. Join the revolution in AI-powered business solutions.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-center group"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4 group-hover:bg-primary/20 transition-colors duration-300">
                <stat.icon className="h-8 w-8 text-primary" />
              </div>
              <div className="text-4xl md:text-5xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors duration-300">
                {stat.value}
              </div>
              <div className="text-lg font-semibold text-foreground mb-2">
                {stat.label}
              </div>
              <div className="text-sm text-muted-foreground">
                {stat.description}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-16"
        >
          <div className="inline-flex items-center space-x-2 bg-muted/50 px-6 py-3 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-muted-foreground">
              Processing <span className="font-semibold text-foreground">2.5M+</span> requests daily
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
