import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import * as crypto from 'crypto'
import nodemailer from 'nodemailer'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const transporter = nodemailer.createTransport({
  host: 'smtp.maileroo.com',
  port: 465,
  secure: true,
  auth: {
    user: 'noreply@sharpii.ai',
    pass: process.env.MAILEROO_SMTP_PASS!,
  },
})

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Look up user in custom auth table
    const { data: user } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    // Always return success to avoid revealing whether an email exists
    if (!user) {
      return NextResponse.json({ message: 'If that email exists, a reset link has been sent.' })
    }

    // Delete any existing unused tokens for this user
    await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('user_id', user.id)
      .is('used_at', null)

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    const { error: insertError } = await supabase
      .from('password_reset_tokens')
      .insert({ user_id: user.id, token, expires_at: expiresAt.toISOString() })

    if (insertError) {
      console.error('forgot-password: failed to insert token:', insertError)
      return NextResponse.json({ error: 'Failed to generate reset token' }, { status: 500 })
    }

    const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://sharpii.ai'}/app/reset-password?token=${token}`

    await transporter.sendMail({
      from: '"Sharpii AI" <noreply@sharpii.ai>',
      to: user.email,
      subject: 'Reset Your Password – Sharpii AI',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #0a0a0a; color: #ffffff; border-radius: 12px; overflow: hidden;">
          <div style="background: #111111; padding: 32px; text-align: center; border-bottom: 1px solid #222;">
            <h1 style="color: #FFFF00; font-size: 24px; margin: 0;">Sharpii AI</h1>
          </div>
          <div style="padding: 32px;">
            <h2 style="color: #ffffff; font-size: 20px; margin-top: 0;">Reset Your Password</h2>
            <p style="color: #aaaaaa; line-height: 1.6;">
              We received a request to reset the password for your account (<strong style="color: #ffffff;">${user.email}</strong>).
              Click the button below to set a new password.
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetUrl}"
                style="background: #FFFF00; color: #000000; font-weight: bold; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 15px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="color: #777777; font-size: 13px; line-height: 1.6;">
              This link expires in <strong style="color: #aaaaaa;">1 hour</strong>. If you didn't request a password reset, you can safely ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #222; margin: 24px 0;" />
            <p style="color: #555555; font-size: 12px;">
              If the button doesn't work, copy and paste this link into your browser:<br />
              <a href="${resetUrl}" style="color: #FFFF00; word-break: break-all;">${resetUrl}</a>
            </p>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ message: 'If that email exists, a reset link has been sent.' })
  } catch (error) {
    console.error('forgot-password error:', error)
    return NextResponse.json({ error: 'Failed to send reset email' }, { status: 500 })
  }
}
