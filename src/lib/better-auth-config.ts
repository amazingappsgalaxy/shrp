// Better-Auth configuration with Supabase integration
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3002",
  secret: process.env.BETTER_AUTH_SECRET || "your-secret-key-here",
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Disable for now to simplify testing
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  advanced: {
    generateId: () => {
      // Generate a simple ID for now
      return Math.random().toString(36).substring(2) + Date.now().toString(36)
    },
  },
})

// Placeholder export to prevent module errors
export const authConfig = {};

