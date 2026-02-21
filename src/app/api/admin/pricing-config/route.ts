import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '../../../../lib/config';
import { PricingEngine, PRICING_CONFIG } from '../../../../lib/pricing-engine';

export async function GET(request: NextRequest) {
  try {
    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      config.database.supabaseUrl,
      config.database.supabaseServiceKey
    );

    // Try to get pricing config from database, fallback to default config
    let resolutionTiers = PRICING_CONFIG.resolutionTiers;
    let modelConfigs = PRICING_CONFIG.modelConfigs;

    try {
      // Get resolution tiers from database
      const { data: dbTiers, error: tiersError } = await supabaseAdmin
        .from('pricing_tiers')
        .select('*')
        .eq('enabled', true)
        .order('max_megapixels');

      if (!tiersError && dbTiers && dbTiers.length > 0) {
        resolutionTiers = dbTiers.map(tier => ({
          id: tier.tier_id,
          name: tier.name,
          maxMegapixels: tier.max_megapixels,
          baseCredits: tier.base_credits,
          description: tier.description
        }));
      }

      // Get model configs from database
      const { data: dbModels, error: modelsError } = await supabaseAdmin
        .from('model_pricing')
        .select('*')
        .eq('enabled', true);

      if (!modelsError && dbModels && dbModels.length > 0) {
        modelConfigs = dbModels.map(model => ({
          modelId: model.model_id,
          name: model.name,
          creditMultiplier: model.credit_multiplier,
          flatFee: model.flat_fee,
          enabled: model.enabled,
          description: model.description,
          options: model.options || []
        }));
      }
    } catch (dbError) {
      console.warn('Using default pricing config, database tables may not exist:', dbError);
    }

    return NextResponse.json({
      success: true,
      config: {
        resolutionTiers,
        modelConfigs
      }
    });

  } catch (error) {
    console.error('Error fetching pricing config:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch pricing configuration',
      config: {
        resolutionTiers: PRICING_CONFIG.resolutionTiers,
        modelConfigs: PRICING_CONFIG.modelConfigs
      }
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { config: pricingConfig } = await request.json();

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      config.database.supabaseUrl,
      config.database.supabaseServiceKey
    );

    // Update resolution tiers
    if (pricingConfig.resolutionTiers) {
      for (const tier of pricingConfig.resolutionTiers) {
        await supabaseAdmin
          .from('pricing_tiers')
          .upsert({
            tier_id: tier.id,
            name: tier.name,
            max_megapixels: tier.maxMegapixels,
            base_credits: tier.baseCredits,
            description: tier.description,
            enabled: true,
            updated_at: new Date().toISOString()
          }, { onConflict: 'tier_id' });
      }
    }

    // Update model configs
    if (pricingConfig.modelConfigs) {
      for (const model of pricingConfig.modelConfigs) {
        await supabaseAdmin
          .from('model_pricing')
          .upsert({
            model_id: model.modelId,
            name: model.name,
            credit_multiplier: model.creditMultiplier,
            flat_fee: model.flatFee,
            enabled: model.enabled,
            description: model.description,
            options: model.options || [],
            updated_at: new Date().toISOString()
          }, { onConflict: 'model_id' });
      }
    }

    // Update the in-memory pricing config
    if (pricingConfig.resolutionTiers) {
      PRICING_CONFIG.resolutionTiers = pricingConfig.resolutionTiers;
    }
    if (pricingConfig.modelConfigs) {
      PRICING_CONFIG.modelConfigs = pricingConfig.modelConfigs;
    }

    return NextResponse.json({
      success: true,
      message: 'Pricing configuration updated successfully'
    });

  } catch (error) {
    console.error('Error updating pricing config:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update pricing configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}