"use client";

import { useState, useId } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { MainLogo } from "@/components/ui/main-logo";
import { Eye, EyeOff, Zap, ArrowRight } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Reused UI Components from AuthUI ---

const Button = ({ className, children, disabled, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  return (
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
};

const Input = ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white shadow-sm transition-all duration-300 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FFFF00] focus-visible:border-[#FFFF00]/50 focus-visible:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 font-sans bg-black/20",
        className
      )}
      {...props}
    />
  );
};

const PasswordInput = ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => {
  const [showPassword, setShowPassword] = useState(false);
  const id = useId();
  return (
    <div className="relative">
      <Input
        id={id}
        type={showPassword ? "text" : "password"}
        className={cn("pe-10", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute inset-y-0 end-0 flex h-full w-10 items-center justify-center text-zinc-500 transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? (
          <EyeOff className="size-4" aria-hidden="true" />
        ) : (
          <Eye className="size-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
};

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      toast.success("Password updated successfully");
      router.push("/app/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#030303] selection:bg-[#FFFF00] selection:text-black font-sans overflow-hidden flex items-center justify-center p-4">

      {/* Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#FFFF00]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-white/5 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />
      </div>

      {/* Top Left Logo */}
      <div className="absolute top-6 left-6 z-50">
        <MainLogo />
      </div>

      <div className="relative z-10 w-full max-w-[400px] flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-500">

        <div className="w-full glass-premium bg-black/40 backdrop-blur-3xl border border-white/10 rounded-2xl p-6 shadow-2xl ring-1 ring-white/5">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">Set New Password</h1>
            <p className="text-zinc-400 text-sm">
              Please enter your new password below.
            </p>
          </div>

          <form onSubmit={handleUpdatePassword} className="grid gap-4">
            <div className="grid gap-1.5">
              <PasswordInput
                placeholder="New Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-black/20"
              />
            </div>
            <div className="grid gap-1.5">
              <PasswordInput
                placeholder="Confirm Password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-black/20"
              />
            </div>

            <Button type="submit" disabled={isLoading} className="mt-2 w-full">
              {isLoading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </div>

      </div>
    </div>
  );
}