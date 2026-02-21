"use client";

import * as React from "react";
import { useState, useId, useEffect } from "react";
import { Eye, EyeOff, ArrowRight, Zap, ArrowLeft } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { signIn as simpleSignIn, signUp as simpleSignUp } from '@/lib/auth-client-simple'
import { MainLogo } from '@/components/ui/main-logo'
import { createClient } from '@/utils/supabase/client'
import { cn } from '@/lib/utils'

// --- UI Components ---

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'outline' | 'ghost' | 'google' }>(
  ({ className, variant = 'primary', ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 font-sans";

    let variantStyles = "";
    if (variant === 'primary') {
      variantStyles = "bg-[#FFFF00] text-black hover:bg-[#D4D400] hover:scale-[1.01] shadow-[0_0_15px_rgba(255,255,0,0.15)] hover:shadow-[0_0_25px_rgba(255,255,0,0.35)]";
    } else if (variant === 'outline') {
      variantStyles = "border border-white/20 bg-white/5 hover:bg-white/10 text-white hover:border-white/40 backdrop-blur-sm";
    } else if (variant === 'google') {
      variantStyles = "bg-white text-black hover:bg-gray-100 border border-gray-200 hover:scale-[1.01] transition-transform";
    } else if (variant === 'ghost') {
      variantStyles = "hover:bg-white/10 text-zinc-400 hover:text-white";
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles, "h-11 px-6", className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-md border border-white/15 bg-white/8 px-4 py-3 text-sm text-white shadow-sm transition-all duration-300 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FFFF00] focus-visible:border-[#FFFF00]/50 focus-visible:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 font-sans",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

const PasswordInput = React.forwardRef<HTMLInputElement, { label?: string } & React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, label, ...props }, ref) => {
    const id = useId();
    const [showPassword, setShowPassword] = useState(false);
    return (
      <div className="grid w-full items-center gap-1.5">
        <div className="relative">
          <Input id={id} type={showPassword ? "text" : "password"} className={cn("pe-10", className)} ref={ref} {...props} />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 end-0 flex h-full w-10 items-center justify-center text-zinc-500 transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50" aria-label={showPassword ? "Hide password" : "Show password"}>
            {showPassword ? (<EyeOff className="size-4" aria-hidden="true" />) : (<Eye className="size-4" aria-hidden="true" />)}
          </button>
        </div>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

// --- Forms ---

function SignInForm({ onForgotPassword }: { onForgotPassword: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await simpleSignIn(email.trim().toLowerCase(), password);
      // Wait a bit for auth state to propagate or just purely UI feedback
      await new Promise(r => setTimeout(r, 500));
      toast.success('Signed in successfully');
      router.push('/app/dashboard');
      router.refresh();
    } catch (error) {
      const message = (error as any)?.message || 'Failed to sign in.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignIn} className="grid gap-4 mt-6">
      <div className="grid gap-1.5">
        <Input
          type="email"
          placeholder="Email address"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-black/20"
        />
      </div>
      <div className="grid gap-1.5">
        <div className="relative">
          <PasswordInput
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-black/20"
          />
        </div>
        <div className="flex justify-end mt-1">
          <button
            type="button"
            className="text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
            onClick={onForgotPassword}
          >
            Forgot password?
          </button>
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="mt-2 w-full">
        {isLoading ? 'Authenticating...' : 'Sign In'}
      </Button>
    </form>
  );
}

function SignUpForm() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formData.name || !formData.email || !formData.password) return toast.error('Check fields');

    setIsLoading(true);
    try {
      await simpleSignUp(formData.email.trim().toLowerCase(), formData.password, formData.name.trim());
      await new Promise(r => setTimeout(r, 500));
      toast.success('Account created successfully');
      router.push('/app/dashboard');
      router.refresh();
    } catch (error) {
      const message = (error as any)?.message || 'Sign up failed.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignUp} className="grid gap-4 mt-6">
      <div className="grid gap-1.5">
        <Input
          placeholder="Full Name"
          required
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="bg-black/20"
        />
      </div>
      <div className="grid gap-1.5">
        <Input
          type="email"
          placeholder="Email address"
          required
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          className="bg-black/20"
        />
      </div>
      <div className="grid gap-1.5">
        <PasswordInput
          placeholder="Create Password"
          required
          value={formData.password}
          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
          className="bg-black/20"
        />
      </div>
      <Button type="submit" disabled={isLoading} className="mt-2 w-full">
        {isLoading ? 'Creating Account...' : 'Get Started'}
      </Button>
    </form>
  );
}

function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) return toast.error('Please enter your email');

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/app/auth/callback?next=/app/reset-password`,
      });

      if (error) throw error;

      setIsSent(true);
      toast.success('Password reset email sent');
    } catch (error) {
      const message = (error as any)?.message || 'Failed to send reset email.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <div className="grid gap-4 mt-6">
        <div className="text-center space-y-2 p-4 bg-white/5 rounded-md border border-white/10">
          <div className="mx-auto w-12 h-12 bg-[#FFFF00]/10 rounded-md flex items-center justify-center mb-4">
            <Zap className="size-6 text-[#FFFF00]" />
          </div>
          <h3 className="text-white font-bold">Check your email</h3>
          <p className="text-zinc-400 text-sm">We've sent a password reset link to <span className="text-white">{email}</span></p>
        </div>
        <Button variant="outline" onClick={onBack} className="w-full">
          Back to Sign In
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleReset} className="grid gap-4 mt-6">
      <div className="text-center mb-2">
        <h3 className="text-white font-bold text-lg">Reset Password</h3>
        <p className="text-zinc-400 text-sm">Enter your email to receive instructions.</p>
      </div>
      <div className="grid gap-1.5">
        <Input
          type="email"
          placeholder="Email address"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-black/20"
        />
      </div>

      <Button type="submit" disabled={isLoading} className="mt-2 w-full">
        {isLoading ? 'Sending Link...' : 'Send Reset Link'}
      </Button>

      <Button type="button" variant="ghost" onClick={onBack} className="w-full text-zinc-500 hover:text-white mt-2">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sign In
      </Button>
    </form>
  );
}

// --- Main Auth UI ---

type AuthView = 'signin' | 'signup' | 'forgot_password';

export function AuthUI() {
  const [view, setView] = useState<AuthView>('signin');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'signup') {
      setView('signup');
    } else if (tab === 'signin') {
      setView('signin');
    }
    // No explicit support for forgot_password via URL yet, but could be added
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/app/auth/callback`,
        },
      });
      if (error) throw error;
      // User will be redirected
    } catch (e: any) {
      toast.error(e.message || 'Google sign in failed');
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

      <div className="relative z-10 w-full max-w-[400px] flex flex-col items-center gap-6">

        {/* Main Card */}
        <div className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-6 shadow-2xl">

          {/* Segmented Control - Only show for signin/signup users */}
          {view !== 'forgot_password' && (
            <div className="grid grid-cols-2 p-1 bg-white/5 rounded-md mb-2 gap-0.5">
              <button
                onClick={() => setView('signin')}
                className={cn(
                  "py-2 text-sm font-bold rounded transition-all duration-200",
                  view === 'signin'
                    ? "bg-white text-black shadow"
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                Sign In
              </button>
              <button
                onClick={() => setView('signup')}
                className={cn(
                  "py-2 text-sm font-bold rounded transition-all duration-200",
                  view === 'signup'
                    ? "bg-white text-black shadow"
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                Sign Up
              </button>
            </div>
          )}

          {view === 'signin' && <SignInForm onForgotPassword={() => setView('forgot_password')} />}
          {view === 'signup' && <SignUpForm />}
          {view === 'forgot_password' && <ForgotPasswordForm onBack={() => setView('signin')} />}

          {view !== 'forgot_password' && (
            <>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-[#0c0c0c] px-2 text-zinc-500 font-bold tracking-widest bg-opacity-0 backdrop-blur-md">Or</span>
                </div>
              </div>

              <Button variant="google" type="button" onClick={handleGoogleSignIn} className="w-full h-11 text-sm font-medium">
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </Button>
            </>
          )}

        </div>

        {/* Demo Button - Outside, minimal, high contrast but integrated */}
        <button
          onClick={() => {
            document.cookie = 'demo=true; path=/; max-age=7200; SameSite=Lax'
            router.push('/app/editor')
          }}
          className="group flex items-center gap-2.5 px-5 py-2.5 rounded-md bg-white/4 border border-white/8 hover:border-[#FFFF00]/30 transition-all duration-200 hover:bg-white/6"
        >
          <div className="w-6 h-6 rounded bg-[#FFFF00] flex items-center justify-center text-black">
            <Zap className="size-3.5 fill-black" />
          </div>
          <span className="text-sm font-semibold text-zinc-400 group-hover:text-white transition-colors">
            Enter Demo App
          </span>
          <ArrowRight className="size-3.5 text-zinc-600 group-hover:text-[#FFFF00] transition-colors" />
        </button>

      </div>
    </div>
  );
}