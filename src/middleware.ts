import { updateSession } from "@/utils/supabase/middleware";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Only protect the /app/* section; leave marketing and other public pages accessible
  matcher: ["/app/:path*"],
};