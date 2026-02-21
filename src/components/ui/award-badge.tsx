"use client"

import { motion } from "framer-motion"
import { Award, Star, Trophy, Medal, Crown, Zap } from "lucide-react"

interface AwardBadgeProps {
  title: string
  subtitle?: string
  icon?: "award" | "star" | "trophy" | "medal" | "crown" | "zap"
  variant?: "gold" | "silver" | "bronze" | "platinum" | "neon"
  size?: "sm" | "md" | "lg"
  animated?: boolean
  className?: string
}

const iconMap = {
  award: Award,
  star: Star,
  trophy: Trophy,
  medal: Medal,
  crown: Crown,
  zap: Zap,
}

const variantStyles = {
  gold: {
    gradient: "from-yellow-400 via-yellow-500 to-yellow-600",
    glow: "shadow-yellow-500/30",
    border: "border-yellow-400/50",
    text: "text-yellow-900"
  },
  silver: {
    gradient: "from-gray-300 via-gray-400 to-gray-500",
    glow: "shadow-gray-400/30",
    border: "border-gray-400/50",
    text: "text-gray-900"
  },
  bronze: {
    gradient: "from-orange-400 via-orange-500 to-orange-600",
    glow: "shadow-orange-500/30",
    border: "border-orange-400/50",
    text: "text-orange-900"
  },
  platinum: {
    gradient: "from-slate-200 via-slate-300 to-slate-400",
    glow: "shadow-slate-300/30",
    border: "border-slate-300/50",
    text: "text-slate-900"
  },
  neon: {
    gradient: "from-accent-neon via-accent-blue to-accent-purple",
    glow: "shadow-accent-neon/30",
    border: "border-accent-neon/50",
    text: "text-white"
  }
}

const sizeStyles = {
  sm: {
    container: "px-3 py-2",
    icon: "h-4 w-4",
    title: "text-xs",
    subtitle: "text-xs"
  },
  md: {
    container: "px-4 py-3",
    icon: "h-5 w-5",
    title: "text-sm",
    subtitle: "text-xs"
  },
  lg: {
    container: "px-6 py-4",
    icon: "h-6 w-6",
    title: "text-base",
    subtitle: "text-sm"
  }
}

export function AwardBadge({
  title,
  subtitle,
  icon = "award",
  variant = "gold",
  size = "md",
  animated = false,
  className = ""
}: AwardBadgeProps) {
  const IconComponent = iconMap[icon]
  const variantStyle = variantStyles[variant]
  const sizeStyle = sizeStyles[size]

  const badgeVariants = {
    initial: { 
      scale: 0.8, 
      opacity: 0,
      rotateY: -90
    },
    animate: { 
      scale: 1, 
      opacity: 1,
      rotateY: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94] as const
      }
    },
    hover: {
      scale: 1.05,
      rotateY: 5,
      transition: {
        duration: 0.3,
        ease: "easeOut" as const
      }
    }
  }

  const glowVariants = {
    animate: {
      boxShadow: [
        `0 0 20px ${variantStyle.glow.replace('shadow-', '').replace('/30', '')}30`,
        `0 0 40px ${variantStyle.glow.replace('shadow-', '').replace('/30', '')}50`,
        `0 0 20px ${variantStyle.glow.replace('shadow-', '').replace('/30', '')}30`
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: [0.25, 0.46, 0.45, 0.94] as const
      }
    }
  }

  return (
    <motion.div
      className={`
        inline-flex items-center gap-2 rounded-full glass border
        bg-gradient-to-r ${variantStyle.gradient} ${variantStyle.border}
        ${sizeStyle.container} ${className}
      `}
      variants={badgeVariants}
      initial={animated ? "initial" : false}
      animate={animated ? "animate" : false}
      whileHover={animated ? "hover" : undefined}
      style={{ perspective: "1000px" }}
    >
      {/* Glow Effect */}
      {animated && (
        <motion.div
          className="absolute inset-0 rounded-full -z-10"
          variants={glowVariants}
          animate="animate"
        />
      )}

      {/* Icon */}
      <motion.div
        className={`${variantStyle.text}`}
        animate={animated ? {
          rotate: [0, 5, -5, 0],
        } : undefined}
        transition={animated ? {
          duration: 2,
          repeat: Infinity,
          ease: [0.25, 0.46, 0.45, 0.94] as const,
          delay: 0.5
        } : undefined}
      >
        <IconComponent className={sizeStyle.icon} />
      </motion.div>

      {/* Text Content */}
      <div className="flex flex-col">
        <span className={`font-semibold ${variantStyle.text} ${sizeStyle.title}`}>
          {title}
        </span>
        {subtitle && (
          <span className={`opacity-80 ${variantStyle.text} ${sizeStyle.subtitle}`}>
            {subtitle}
          </span>
        )}
      </div>

      {/* Sparkle Effects */}
      {animated && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: `${20 + i * 30}%`,
                top: `${20 + (i % 2) * 60}%`,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0.5, 1.5, 0.5],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 1.5,
                delay: i * 0.3,
                repeat: Infinity,
                ease: [0.25, 0.46, 0.45, 0.94] as const,
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}

// Preset configurations for common awards
export const AWARD_PRESETS = {
  aiExcellence: {
    title: "AI Excellence",
    subtitle: "2024 Award",
    icon: "zap" as const,
    variant: "neon" as const,
  },
  customerChoice: {
    title: "Customer Choice",
    subtitle: "Best AI Tool",
    icon: "star" as const,
    variant: "gold" as const,
  },
  innovation: {
    title: "Innovation",
    subtitle: "Tech Leader",
    icon: "trophy" as const,
    variant: "platinum" as const,
  },
  topRated: {
    title: "Top Rated",
    subtitle: "5.0 Stars",
    icon: "medal" as const,
    variant: "gold" as const,
  },
  premium: {
    title: "Premium",
    subtitle: "Quality",
    icon: "crown" as const,
    variant: "platinum" as const,
  }
}