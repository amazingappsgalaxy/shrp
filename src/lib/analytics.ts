'use client'

/**
 * Sharpii.ai — Centralized Analytics
 *
 * All GA4 event tracking lives here. Every event is typed so nothing is
 * accidentally misspelled or omitted in product pages.
 *
 * Usage:
 *   import { track } from '@/lib/analytics'
 *   track.toolStarted({ tool: 'upscaler', model: 'pro-upscaler', resolution: '8k' })
 */

type GtagFn = Window['gtag']

function gtag(...args: Parameters<GtagFn>) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag(...args)
  }
}

// ─── Tool Events ───────────────────────────────────────────────────────────

/** Fired when user clicks the main CTA to start processing */
function toolStarted(params: {
  tool: 'upscaler' | 'skin-editor' | 'image-generation' | 'image-edit'
  model?: string          // e.g. 'pro-upscaler', 'smart-upscaler', 'seedream-5'
  resolution?: string     // '4k' | '8k' | '1K' | '2K' | '3K'
  mode?: string           // skin mode: 'Subtle' | 'Clear' | 'Pimples' etc.
  style?: string          // LoRA or style preset
  count?: number          // image generation count
  has_reference?: boolean // whether a reference image was used
  credit_cost?: number
}) {
  gtag('event', 'tool_started', params)
}

/** Fired when a task completes successfully (async — when result appears) */
function toolCompleted(params: {
  tool: 'upscaler' | 'skin-editor' | 'image-generation' | 'image-edit'
  model?: string
  resolution?: string
  duration_ms?: number
  credit_cost?: number
}) {
  gtag('event', 'tool_completed', params)
}

/** Fired when a task fails */
function toolFailed(params: {
  tool: 'upscaler' | 'skin-editor' | 'image-generation' | 'image-edit'
  model?: string
  error?: string
}) {
  gtag('event', 'tool_failed', params)
}

// ─── Model & Setting Selection Events ──────────────────────────────────────

/** Fired when user switches between models on the upscaler page */
function modelSelected(params: {
  tool: string
  model: string
  previous_model?: string
}) {
  gtag('event', 'model_selected', params)
}

/** Fired when resolution is changed */
function resolutionSelected(params: {
  tool: string
  resolution: string
  model?: string
}) {
  gtag('event', 'resolution_selected', params)
}

/** Fired when skin enhancement mode is changed */
function skinModeSelected(params: {
  mode: string
  previous_mode?: string
}) {
  gtag('event', 'skin_mode_selected', params)
}

/** Fired when LoRA / style preset is changed */
function styleSelected(params: {
  tool: string
  style: string
  previous_style?: string
}) {
  gtag('event', 'style_selected', params)
}

/** Fired when aspect ratio is changed in image generation */
function aspectRatioSelected(params: {
  aspect: string
}) {
  gtag('event', 'aspect_ratio_selected', params)
}

/** Fired when generation count changes (1/2/4 images) */
function generationCountSelected(params: {
  count: number
}) {
  gtag('event', 'generation_count_selected', params)
}

/** Fired when a reference image is added to the generation canvas */
function referenceImageAdded(params: {
  model?: string
  ref_count: number
}) {
  gtag('event', 'reference_image_added', params)
}

// ─── Image Upload Events ────────────────────────────────────────────────────

/** Fired when user uploads / drops an image */
function imageUploaded(params: {
  tool: string
  file_type?: string
  width?: number
  height?: number
}) {
  gtag('event', 'image_uploaded', params)
}

// ─── Credit / Paywall Events ────────────────────────────────────────────────

/** Fired when user is blocked because credit balance is zero */
function creditsEmpty(params: {
  tool: string
  model?: string
}) {
  gtag('event', 'credits_empty', params)
}

/** Fired when user has some credits but not enough for this task */
function creditsInsufficient(params: {
  tool: string
  model?: string
  available?: number
  required?: number
}) {
  gtag('event', 'credits_insufficient', params)
}

/** Fired when the upgrade/plans popup is opened */
function upgradePrompted(params: {
  source: string  // which page/tool triggered it
}) {
  gtag('event', 'upgrade_prompted', params)
}

// ─── Pricing & Conversion Events ────────────────────────────────────────────

/** Fired when user views the pricing/plans page */
function pricingViewed(params?: {
  source?: string  // where they came from
}) {
  gtag('event', 'pricing_viewed', params ?? {})
}

/** Fired when user clicks on a specific plan to start checkout */
function planClicked(params: {
  plan_name: string
  plan_price?: number
  billing_period?: string
}) {
  gtag('event', 'plan_clicked', params)
}

/** Fired when checkout flow is initiated */
function checkoutStarted(params: {
  plan_name: string
  plan_price?: number
  billing_period?: string
}) {
  gtag('event', 'checkout_started', params)
}

// ─── Auth Events (supplement to sign_up already in auth-client-simple.ts) ──

/** Fired when user successfully signs in */
function signedIn() {
  gtag('event', 'login', { method: 'email' })
}

// ─── Result / Download Events ───────────────────────────────────────────────

/** Fired when user downloads a result image */
function resultDownloaded(params: {
  tool: string
  model?: string
  resolution?: string
}) {
  gtag('event', 'result_downloaded', params)
}

/** Fired when user opens a result in the expand/zoom modal */
function resultViewed(params: {
  tool: string
}) {
  gtag('event', 'result_viewed', params)
}

/** Fired when user uses the before/after comparison slider */
function comparisonSliderUsed(params: {
  tool: string
}) {
  gtag('event', 'comparison_slider_used', params)
}

// ─── History Events ─────────────────────────────────────────────────────────

/** Fired when user opens the history page */
function historyViewed() {
  gtag('event', 'history_viewed', {})
}

/** Fired when user opens a history item detail */
function historyItemOpened(params: {
  tool?: string
  status?: string
}) {
  gtag('event', 'history_item_opened', params)
}

// ─── Dashboard Events ───────────────────────────────────────────────────────

/** Fired when user views their credit balance card */
function dashboardViewed(params: {
  has_subscription: boolean
  credit_balance?: number
}) {
  gtag('event', 'dashboard_viewed', params)
}

// ─── Export ─────────────────────────────────────────────────────────────────

export const track = {
  // Tool lifecycle
  toolStarted,
  toolCompleted,
  toolFailed,

  // Settings
  modelSelected,
  resolutionSelected,
  skinModeSelected,
  styleSelected,
  aspectRatioSelected,
  generationCountSelected,
  referenceImageAdded,

  // Upload
  imageUploaded,

  // Credits / paywall
  creditsEmpty,
  creditsInsufficient,
  upgradePrompted,

  // Conversion funnel
  pricingViewed,
  planClicked,
  checkoutStarted,

  // Auth
  signedIn,

  // Results
  resultDownloaded,
  resultViewed,
  comparisonSliderUsed,

  // History
  historyViewed,
  historyItemOpened,

  // Dashboard
  dashboardViewed,
}
