/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    // Ensure common utility classes are always included
    'bg-black',
    'bg-white',
    'text-white',
    'text-black',
    'p-4',
    'p-8',
    'rounded',
    'rounded-lg',
    'min-h-screen',
    'grid',
    'flex',
    'items-center',
    'justify-center',
    'text-xl',
    'text-2xl',
    'text-3xl',
    'text-4xl',
    'font-bold',
    'mb-4',
    'mt-8',
    'gap-4',
    'border',
    'transition-colors',
    'hover:bg-yellow-400',
    'bg-yellow-400',
    'text-yellow-400',
    'bg-gray-800',
    'text-gray-300',
    'border-gray-600',
  ],
  theme: {
    extend: {
      colors: {
        // Base colors
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: "hsl(var(--surface))",
        'surface-elevated': "hsl(var(--surface-elevated))",
        'surface-glass': "var(--surface-glass)",
        'surface-glass-elevated': "var(--surface-glass-elevated)",

        // Text colors
        'text-primary': "hsl(var(--text-primary))",
        'text-secondary': "hsl(var(--text-secondary))",
        'text-muted': "hsl(var(--text-muted))",
        'text-disabled': "hsl(var(--text-disabled))",

        // Card colors
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
          elevated: "hsl(var(--card-elevated))",
        },

        // Popover colors
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },

        // Primary colors - NEON YELLOW
        primary: {
          DEFAULT: "hsl(var(--primary))", // #FFFF00
          foreground: "hsl(var(--primary-foreground))", // #000000
          muted: "hsl(var(--primary-muted))",
          hover: "hsl(var(--primary-hover))",
        },

        // Secondary colors
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          hover: "hsl(var(--secondary-hover))",
        },

        // Muted colors
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },

        // Accent colors
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          blue: "hsl(var(--accent-blue))",
          purple: "hsl(var(--accent-purple))",
          neon: "hsl(var(--accent-neon))", // #FFFF00
          pink: "hsl(var(--accent-pink))",
        },

        // Status colors
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },

        // Border and input colors
        border: "hsl(var(--border))",
        'border-muted': "hsl(var(--border-muted))",
        'glass-border': "var(--glass-border)",
        'glass-border-elevated': "var(--glass-border-elevated)",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },

      // Enhanced border radius
      borderRadius: {
        'sm': "var(--radius-sm)",
        DEFAULT: "var(--radius)",
        'md': "var(--radius-md)",
        'lg': "var(--radius-lg)",
        'xl': "var(--radius-xl)",
        '2xl': "var(--radius-2xl)",
        'full': "var(--radius-full)",
      },

      // Enhanced spacing
      spacing: {
        'xs': "var(--space-xs)",
        'sm': "var(--space-sm)",
        'md': "var(--space-md)",
        'lg': "var(--space-lg)",
        'xl': "var(--space-xl)",
        '2xl': "var(--space-2xl)",
        '3xl': "var(--space-3xl)",
        '4xl': "var(--space-4xl)",
      },

      // Enhanced animations
      animation: {
        // Existing animations
        aurora: "aurora 60s linear infinite",
        appear: "appear 0.5s ease-out forwards",
        "appear-zoom": "appear-zoom 0.5s ease-out forwards",

        // New premium animations
        'fade-in': "fadeIn 0.6s var(--ease-ios) forwards",
        'slide-in-left': "slideInLeft 0.6s var(--ease-ios) forwards",
        'slide-in-right': "slideInRight 0.6s var(--ease-ios) forwards",
        'scale-in': "scaleIn 0.6s var(--ease-spring) forwards",
        'glow-pulse': "glowPulse 2s ease-in-out infinite",
        'float': "float 6s ease-in-out infinite",
        'shimmer': "shimmer 2s linear infinite",
        'sparkle': "sparkle 1.5s ease-in-out infinite",
        'logo-glow': "logoGlow 3s ease-in-out infinite",
      },

      // Enhanced keyframes
      keyframes: {
        // Existing keyframes
        aurora: {
          from: { backgroundPosition: "50% 50%, 50% 50%" },
          to: { backgroundPosition: "350% 50%, 50% 50%" },
        },
        appear: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "appear-zoom": {
          "0%": { opacity: "0", transform: "scale(0.8)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },

        // New premium keyframes
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-50px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(50px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.8)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 20px hsl(var(--accent-neon) / 0.3)" },
          "50%": { boxShadow: "0 0 40px hsl(var(--accent-neon) / 0.6)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        sparkle: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(1.1)" },
        },
        logoGlow: {
          "0%, 100%": {
            filter: "drop-shadow(0 0 10px hsl(var(--accent-neon) / 0.3))"
          },
          "50%": {
            filter: "drop-shadow(0 0 20px hsl(var(--accent-neon) / 0.6))"
          },
        },
      },

      // Enhanced typography
      fontFamily: {
        sans: ['var(--font-manrope)', 'sans-serif'],
        heading: ['var(--font-syne)', 'sans-serif'],
        body: ['var(--font-manrope)', 'sans-serif'],
        ubuntu: ['var(--font-ubuntu)', 'sans-serif'],
      },
      fontSize: {
        'hero': ['4.5rem', { lineHeight: '1.05', fontWeight: '800', letterSpacing: '-0.02em' }],
        'display': ['3.5rem', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-0.01em' }],
        'heading': ['2.5rem', { lineHeight: '1.2', fontWeight: '600', letterSpacing: '-0.01em' }],
        'subheading': ['1.75rem', { lineHeight: '1.3', fontWeight: '500' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['0.75rem', { lineHeight: '1.4', fontWeight: '400' }],
      },

      // Enhanced shadows
      boxShadow: {
        'sm': "var(--shadow-sm)",
        DEFAULT: "var(--shadow)",
        'md': "var(--shadow-md)",
        'lg': "var(--shadow-lg)",
        'xl': "var(--shadow-xl)",
        '2xl': "var(--shadow-2xl)",
        'neon': "var(--shadow-neon)",
        'neon-strong': "var(--shadow-neon-strong)",
        'glass': "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
      },

      // Enhanced backdrop blur
      backdropBlur: {
        'glass': "var(--glass-blur)",
        'glass-heavy': "var(--glass-blur-heavy)",
      },

      // Enhanced transition timing
      transitionTimingFunction: {
        'ios': "var(--ease-ios)",
        'spring': "var(--ease-spring)",
      },

      // Enhanced transition duration
      transitionDuration: {
        'fast': "var(--duration-fast)",
        'normal': "var(--duration-normal)",
        'slow': "var(--duration-slow)",
        'slower': "var(--duration-slower)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
