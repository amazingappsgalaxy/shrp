"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { MainLogo } from "@/components/ui/main-logo";
import { Eye, EyeOff, Zap, Loader2 } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { createClient } from "@/utils/supabase/client";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Button = ({ className, children, disabled, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={cn(
      "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 font-sans h-12 px-6",
      "bg-[#FFFF00] text-black hover:bg-[#D4D400] hover:scale-[1.02] shadow-[0_0_15px_rgba(255,255,0,0.2)] hover:shadow-[0_0_30px_rgba(255,255,0,0.4)]",
      className
    )}
    disabled={disabled}
    {...props}
  >
    {children}
  </button>
);

const Input = ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={cn(
      "flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white shadow-sm transition-all duration-300 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FFFF00] focus-visible:border-[#FFFF00]/50 focus-visible:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 font-sans bg-black/20",
      className
    )}
    {...props}
  />
);

const PasswordInput = ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="relative">
      <Input type={showPassword ? "text" : "password"} className={cn("pe-10", className)} {...props} />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute inset-y-0 end-0 flex h-full w-10 items-center justify-center text-zinc-500 transition-colors hover:text-white focus-visible:outline-none"
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
};

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionFoundRef = useRef(false);

  useEffect(() => {
    const supabase = createClient();
    const code = searchParams.get("code"); // PKCE flow sends ?code=...

    const markReady = (token: string) => {
      if (sessionFoundRef.current) return;
      sessionFoundRef.current = true;
      setAccessToken(token);
      setSessionReady(true);
    };

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        if (error || !data.session) { setInvalidLink(true); return; }
        markReady(data.session.access_token);
        router.replace("/app/reset-password");
      });
      return;
    }

    // PKCE token_hash flow — Supabase appends ?token_hash=...&type=recovery to the redirectTo URL.
    // Verify the token directly here. Do NOT call router.replace() after — that would trigger
    // a re-render that clears the session before the user can submit the form.
    const tokenHash = searchParams.get("token_hash");
    const tokenType = searchParams.get("type");
    if (tokenHash && tokenType === "recovery") {
      supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" })
        .then(({ data, error }) => {
          if (error || !data.session) { setInvalidLink(true); return; }
          markReady(data.session.access_token);
          // Token is consumed (one-time use) — leave URL as-is to avoid triggering a re-render
        });
      return;
    }

    // Hash flow (#access_token=...&type=recovery).
    // @supabase/ssr's createBrowserClient doesn't auto-process hash fragments,
    // so we parse the hash manually and call setSession() explicitly.
    const hash = typeof window !== "undefined" ? window.location.hash.substring(1) : "";
    const hashParams = new URLSearchParams(hash);
    const hashToken = hashParams.get("access_token");
    const hashRefresh = hashParams.get("refresh_token") ?? "";
    const hashType = hashParams.get("type");

    if (hashType === "recovery" && hashToken) {
      supabase.auth.setSession({ access_token: hashToken, refresh_token: hashRefresh })
        .then(({ data, error }) => {
          if (error || !data.session) { setInvalidLink(true); return; }
          markReady(hashToken);
        });
      return;
    }

    // Session was already established server-side by /auth/confirm.
    // Read it from cookies via getSession(). Also keep PASSWORD_RECOVERY
    // listener as fallback for old hash-based links.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") && session) markReady(session.access_token);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) markReady(session.access_token);
    });

    const timer = setTimeout(() => {
      if (!sessionFoundRef.current) setInvalidLink(true);
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [searchParams, router]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) { toast.error("Please fill in all fields"); return; }
    if (password !== confirmPassword) { toast.error("Passwords do not match"); return; }
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (!accessToken) { toast.error("Invalid reset session. Please request a new link."); return; }

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw new Error(updateError.message);

      await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, accessToken }),
      });

      await supabase.auth.signOut();
      toast.success("Password updated! Please sign in with your new password.");
      router.push("/app/signin");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#030303] selection:bg-[#FFFF00] selection:text-black font-sans overflow-hidden flex items-center justify-center p-4">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#FFFF00]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-white/5 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />
      </div>
      <div className="absolute top-6 left-6 z-50"><MainLogo /></div>

      <div className="relative z-10 w-full max-w-[400px] animate-in fade-in zoom-in-95 duration-500">
        <div className="w-full bg-black/40 backdrop-blur-3xl border border-white/10 rounded-2xl p-6 shadow-2xl">
          {invalidLink ? (
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-md flex items-center justify-center">
                <Zap className="size-6 text-red-400" />
              </div>
              <h1 className="text-xl font-bold text-white">Invalid Reset Link</h1>
              <p className="text-zinc-400 text-sm">This link is invalid or has expired. Please request a new password reset.</p>
              <button onClick={() => router.push("/app/signin")} className="text-[#FFFF00] text-sm hover:underline">
                Back to Sign In
              </button>
            </div>
          ) : !sessionReady ? (
            <div className="text-center space-y-4 py-8">
              <Loader2 className="size-8 text-[#FFFF00] animate-spin mx-auto" />
              <p className="text-zinc-400 text-sm">Verifying reset link…</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-white mb-2">Set New Password</h1>
                <p className="text-zinc-400 text-sm">Please enter your new password below.</p>
              </div>
              <form onSubmit={handleUpdatePassword} className="grid gap-4">
                <PasswordInput placeholder="New Password (min. 8 characters)" required value={password} onChange={e => setPassword(e.target.value)} />
                <PasswordInput placeholder="Confirm Password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                <Button type="submit" disabled={isLoading} className="mt-2 w-full">
                  {isLoading ? "Updating…" : "Update Password"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
