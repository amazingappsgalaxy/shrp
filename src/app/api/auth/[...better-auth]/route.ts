import { auth } from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"

// Cast to any to satisfy type mismatch due to wrapper exports
const { GET, POST } = toNextJsHandler(auth as any)

export { GET, POST }