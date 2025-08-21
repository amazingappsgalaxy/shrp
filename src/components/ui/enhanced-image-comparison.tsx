"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Zap } from "lucide-react";
import {
  ImageComparison,
  ImageComparisonImage,
  ImageComparisonSlider
} from "@/components/ui/image-comparison";

interface EnhancedImageComparisonProps {
  beforeImage: string;
  afterImage: string;
  title?: string;
  description?: string;
  className?: string;
  showLabels?: boolean;
  showStats?: boolean;
  improvement?: string;
  processingTime?: string;
}

export function EnhancedImageComparison({
  beforeImage,
  afterImage,
  title,
  description,
  className,
  showLabels = true,
  showStats = true,
  improvement = "94%",
  processingTime = "28s"
}: EnhancedImageComparisonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Comparison */}
      <motion.div
        className="relative group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.3 }}
      >
        <ImageComparison
          className="aspect-[4/3] w-full rounded-2xl glass overflow-hidden"
          enableHover
          springOptions={{ bounce: 0.2, duration: 0.8 }}
        >
          <ImageComparisonImage
            src={beforeImage}
            alt="Original Image"
            position="left"
          />
          <ImageComparisonImage
            src={afterImage}
            alt="AI Enhanced Image"
            position="right"
          />
          <ImageComparisonSlider className="w-1 bg-gradient-to-b from-accent-neon via-accent-blue to-accent-purple shadow-neon" />
        </ImageComparison>

        {/* Labels */}
        {showLabels && (
          <motion.div
            className="absolute bottom-4 left-4 right-4 flex justify-between pointer-events-none"
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: isHovered ? 1 : 0,
              y: isHovered ? 0 : 20
            }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-3 py-1 rounded-full glass-elevated border border-glass-border-elevated text-sm font-medium text-white backdrop-blur-md">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-400 rounded-full" />
                Original
              </div>
            </div>
            <div className="px-3 py-1 rounded-full glass-elevated border border-glass-border-elevated text-sm font-medium text-white backdrop-blur-md">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-accent-neon" />
                AI Enhanced
              </div>
            </div>
          </motion.div>
        )}

        {/* Processing Time Indicator */}
        <motion.div
          className="absolute top-4 left-4 pointer-events-none"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: isHovered ? 1 : 0,
            scale: isHovered ? 1 : 0.8
          }}
          transition={{ duration: 0.3 }}
        >
          <div className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-xs font-medium text-green-400 backdrop-blur-sm">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              {processingTime}
            </div>
          </div>
        </motion.div>


      </motion.div>

      {/* Info Section */}
      {(title || description || showStats) && (
        <div className="space-y-3">
          {title && (
            <h3 className="text-xl font-semibold text-text-primary">
              {title}
            </h3>
          )}

          {description && (
            <p className="text-text-secondary leading-relaxed">
              {description}
            </p>
          )}

          {showStats && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <Zap className="w-4 h-4 text-accent-neon" />
                  <span>Enhanced in {processingTime}</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold text-gradient-neon">
                  {improvement}
                </div>
                <div className="text-xs text-text-muted">Quality Boost</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}