import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { findUserByEmail, createUser, createSession } from '@/lib/supabase-server';
import { generateSessionToken } from '@/lib/auth-simple';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/app/dashboard';

    if (code) {
        const supabase = await createClient();
        const { data: { session: supabaseSession }, error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error && supabaseSession?.user?.email) {
            // Bridge Logic: Sync Supabase Auth with custom "session" cookie system
            try {
                const email = supabaseSession.user.email;
                let user = await findUserByEmail(email);

                let userId = user?.id;

                if (!user) {
                    // User doesn't exist in public.users yet (trigger might be slow or failed)
                    // Create manually.
                    console.log(`[Auth Callback] User ${email} not found in public.users, creating...`);
                    const name = supabaseSession.user.user_metadata?.full_name || email.split('@')[0];
                    try {
                        userId = await createUser({
                            email,
                            name,
                            passwordHash: 'google-oauth-managed',
                        });
                        console.log(`[Auth Callback] Created user ${userId}`);
                    } catch (createError) {
                        console.error('[Auth Callback] Failed to create user:', createError);
                        user = await findUserByEmail(email);
                        if (user) userId = user.id;
                        else throw createError;
                    }
                } else {
                    // User was created by DB trigger with 'managed_by_supabase_auth'.
                    // Mark them as Google so settings shows "Set Password" correctly.
                    if (user.passwordHash === 'managed_by_supabase_auth' || !user.passwordHash) {
                        ;(supabaseAdmin as any)
                            .from('users')
                            .update({ password_hash: 'google-oauth-managed', updated_at: new Date().toISOString() })
                            .eq('id', userId)
                            .then(() => {}).catch(() => {})
                    }
                }

                if (userId) {
                    // Create a custom session for the app's middleware
                    const sessionToken = generateSessionToken();
                    const sessionId = await createSession({
                        userId,
                        token: sessionToken,
                        expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
                        ipAddress: '0.0.0.0', // Fallback
                        userAgent: request.headers.get('user-agent') || undefined
                    });

                    // Set the session cookie
                    const cookieStore = await cookies();
                    cookieStore.set('session', sessionToken, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'lax',
                        path: '/',
                        maxAge: 60 * 60 * 24 * 7 // 7 days (matching signin route)
                    });
                    console.log(`[Auth Callback] Session bridge established for ${userId}`);
                }

            } catch (bridgeError) {
                console.error('[Auth Callback] Bridge error:', bridgeError);
                // We continue even if bridge fails, maybe some other part of app works with Supabase tokens?
                // But likely middleware will block.
            }

            const isLocalEnv = process.env.NODE_ENV === 'development';
            const productionUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sharpii.ai';
            if (isLocalEnv) {
                return NextResponse.redirect(`${origin}${next}`);
            } else {
                return NextResponse.redirect(`${productionUrl}${next}`);
            }
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/app/signin?error=auth_code_error`);
}
