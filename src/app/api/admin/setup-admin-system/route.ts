import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '../../../../lib/config';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Setting up admin system...');

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      config.database.supabaseUrl,
      config.database.supabaseServiceKey
    );

    // Step 1: Add is_admin column to users table if it doesn't exist
    console.log('1. Adding is_admin column to users table...');
    const { error: alterError } = await supabaseAdmin.rpc('sql', {
      query: `
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

        -- Create index for admin queries
        CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = true;

        -- Add admin role to enum if it doesn't exist (for future use)
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
            CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator');
          END IF;
        END $$;
      `
    });

    if (alterError) {
      console.error('Error altering users table:', alterError);
      // Try alternative approach using direct SQL
      try {
        await supabaseAdmin.from('users').select('is_admin').limit(1);
      } catch (selectError) {
        console.log('Column doesn\'t exist, attempting to add via SQL...');

        // Use a more direct approach
        const { error: directAlterError } = await supabaseAdmin
          .from('users')
          .update({ is_admin: false })
          .eq('email', 'nonexistent@test.com'); // This will fail but might trigger schema update

        console.log('Direct alter result:', directAlterError);
      }
    }

    // Step 2: Create or update admin user
    console.log('2. Creating/updating admin user...');
    const adminEmail = 'sharpiiaiweb@gmail.com';
    const adminPassword = '##SHARPpass123';
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Check if admin user exists
    const { data: existingUser, error: selectError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', adminEmail)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('Error checking existing user:', selectError);
    }

    let adminUser;
    if (existingUser) {
      console.log('Admin user exists, updating...');
      // Update existing user
      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          name: 'SharpII AI Admin',
          password_hash: hashedPassword,
          is_admin: true,
          subscription_status: 'enterprise',
          monthly_api_limit: 999999,
          updated_at: new Date().toISOString(),
        })
        .eq('email', adminEmail)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating admin user:', updateError);
        throw updateError;
      }

      adminUser = updatedUser;
    } else {
      console.log('Creating new admin user...');
      // Create new admin user
      const { data: newUser, error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          email: adminEmail,
          name: 'SharpII AI Admin',
          password_hash: hashedPassword,
          is_admin: true,
          subscription_status: 'enterprise',
          api_usage: 0,
          monthly_api_limit: 999999,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          avatar_url: '',
          is_email_verified: true,
          last_login_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating admin user:', insertError);
        throw insertError;
      }

      adminUser = newUser;
    }

    // Step 3: Grant admin user unlimited credits
    console.log('3. Granting admin unlimited credits...');
    const { error: creditsError } = await supabaseAdmin
      .from('credits')
      .upsert({
        user_id: adminUser.id,
        amount: 999999,
        type: 'admin_grant',
        source: 'admin_setup',
        expires_at: '2030-12-31T23:59:59.999Z',
        is_active: true,
        created_at: new Date().toISOString(),
        metadata: JSON.stringify({
          description: 'Admin unlimited credits',
          setup_date: new Date().toISOString()
        })
      });

    if (creditsError) {
      console.error('Error granting admin credits:', creditsError);
    }

    // Step 4: Create admin pricing configuration table
    console.log('4. Setting up admin pricing configuration...');
    const { error: pricingTableError } = await supabaseAdmin.rpc('sql', {
      query: `
        -- Create pricing configuration tables
        CREATE TABLE IF NOT EXISTS pricing_tiers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tier_id TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          max_megapixels DECIMAL NOT NULL,
          base_credits INTEGER NOT NULL,
          description TEXT NOT NULL,
          enabled BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS model_pricing (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          model_id TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          credit_multiplier DECIMAL NOT NULL DEFAULT 1.0,
          flat_fee INTEGER DEFAULT 0,
          enabled BOOLEAN DEFAULT TRUE,
          description TEXT,
          options JSONB DEFAULT '[]'::jsonb,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );

        -- Create admin activity log
        CREATE TABLE IF NOT EXISTS admin_activity (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          admin_user_id UUID REFERENCES users(id),
          action TEXT NOT NULL,
          target_type TEXT, -- 'user', 'pricing', 'system', etc.
          target_id TEXT,
          details JSONB,
          ip_address TEXT,
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );

        -- Create system settings table
        CREATE TABLE IF NOT EXISTS system_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          key TEXT UNIQUE NOT NULL,
          value JSONB NOT NULL,
          description TEXT,
          updated_by UUID REFERENCES users(id),
          updated_at TIMESTAMP DEFAULT NOW()
        );

        -- Add indexes
        CREATE INDEX IF NOT EXISTS idx_admin_activity_admin_user_id ON admin_activity(admin_user_id);
        CREATE INDEX IF NOT EXISTS idx_admin_activity_created_at ON admin_activity(created_at);
        CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
      `
    });

    if (pricingTableError) {
      console.error('Error creating pricing tables:', pricingTableError);
    }

    // Step 5: Insert default pricing configuration
    console.log('5. Inserting default pricing configuration...');

    // Insert default resolution tiers
    const defaultTiers = [
      { tier_id: 'sd', name: 'Standard Definition', max_megapixels: 1.0, base_credits: 60, description: '≤ 1000×1000 pixels (≤ 1MP)' },
      { tier_id: 'hd', name: 'High Definition', max_megapixels: 2.25, base_credits: 120, description: '≤ 1500×1500 pixels (≤ 2.25MP)' },
      { tier_id: '4k', name: '4K Resolution', max_megapixels: 4.66, base_credits: 360, description: '≤ 2160×2160 pixels (≤ 4.66MP)' },
      { tier_id: 'ultra', name: 'Ultra High Definition', max_megapixels: 999999, base_credits: 500, description: '> 2160×2160 pixels (> 4.66MP)' }
    ];

    for (const tier of defaultTiers) {
      await supabaseAdmin
        .from('pricing_tiers')
        .upsert(tier, { onConflict: 'tier_id' });
    }

    // Insert default model pricing
    const defaultModels = [
      {
        model_id: 'fermatresearch/magic-image-refiner',
        name: 'Magic Image Refiner',
        credit_multiplier: 1.0,
        flat_fee: 0,
        enabled: true,
        description: 'Balanced enhancement with good quality'
      },
      {
        model_id: 'nightmareai/real-esrgan',
        name: 'Real-ESRGAN Upscaler',
        credit_multiplier: 0.8,
        flat_fee: 10,
        enabled: true,
        description: 'Efficient upscaling model'
      },
      {
        model_id: 'runninghub-flux-upscaling',
        name: 'FLUX Advanced Upscaling',
        credit_multiplier: 1.4,
        flat_fee: 25,
        enabled: true,
        description: 'Premium model with advanced features'
      }
    ];

    for (const model of defaultModels) {
      await supabaseAdmin
        .from('model_pricing')
        .upsert(model, { onConflict: 'model_id' });
    }

    // Step 6: Create admin session
    console.log('6. Creating admin session...');
    const sessionToken = `admin_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const { error: sessionError } = await supabaseAdmin
      .from('sessions')
      .insert({
        user_id: adminUser.id,
        token: sessionToken,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        created_at: new Date().toISOString(),
        user_agent: 'Admin Setup',
        ip_address: '127.0.0.1'
      });

    if (sessionError) {
      console.error('Error creating admin session:', sessionError);
    }

    // Step 7: Log admin setup activity
    const { error: activityError } = await supabaseAdmin
      .from('admin_activity')
      .insert({
        admin_user_id: adminUser.id,
        action: 'admin_system_setup',
        target_type: 'system',
        details: {
          setup_date: new Date().toISOString(),
          features_enabled: ['pricing_management', 'user_management', 'analytics']
        },
        ip_address: '127.0.0.1',
        user_agent: 'Admin Setup Script'
      });

    if (activityError) {
      console.error('Error logging admin activity:', activityError);
    }

    console.log('✅ Admin system setup completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Admin system setup completed successfully',
      admin: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        is_admin: adminUser.is_admin,
        session_token: sessionToken
      },
      features_enabled: [
        'User Management',
        'Pricing Configuration',
        'Sales Analytics',
        'System Settings',
        'Activity Monitoring'
      ]
    });

  } catch (error) {
    console.error('❌ Admin setup failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Admin setup failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}