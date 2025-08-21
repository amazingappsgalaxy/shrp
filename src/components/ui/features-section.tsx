"use client"

import { motion } from "framer-motion"
import { Brain, Zap, Shield, Users, Code, Sparkles } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"

const features = [
  {
    icon: Brain,
    title: "Advanced AI Models",
    description: "Powered by cutting-edge GPT-4 and Claude models with custom fine-tuning for your industry-specific needs."
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Sub-100ms response times with intelligent caching and global CDN distribution for instant results worldwide."
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "SOC 2 Type II certified with end-to-end encryption, role-based access control, and compliance with GDPR, HIPAA, and SOX."
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Real-time collaboration tools with version control, shared workspaces, and seamless team management."
  },
  {
    icon: Code,
    title: "Developer Friendly",
    description: "RESTful APIs, WebSocket support, and SDKs for Python, JavaScript, Java, and Go with comprehensive documentation."
  },
  {
    icon: Sparkles,
    title: "Customizable",
    description: "Train custom models on your data, integrate with existing tools, and create personalized AI workflows."
  }
]

export function FeaturesSection() {
  return (
    <section className="py-24 bg-background">
      <div className="container px-6 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Powerful Features for Modern AI
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover the capabilities that make Sharpii AI the leading choice for AI-powered development.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
