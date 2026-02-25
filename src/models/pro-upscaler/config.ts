export const PRO_UPSCALER_MODEL_ID = 'pro-upscaler'
export const PRO_UPSCALER_TASK_DURATION_SECS = 240

/**
 * Workflow selection:
 *   portrait=false, maxmode=false → output node #400
 *   portrait=false, maxmode=true  → output node #400
 *   portrait=true,  maxmode=false → output node #224
 *   portrait=true,  maxmode=true  → output node #400
 */
export const PRO_UPSCALER_WORKFLOWS = {
  portrait_false_maxmode_false: { workflowId: '2026681654638551042', outputNodeId: '400' },
  portrait_false_maxmode_true:  { workflowId: '2026681286101831681', outputNodeId: '400' },
  portrait_true_maxmode_false:  { workflowId: '2026681014017331201', outputNodeId: '224' },
  portrait_true_maxmode_true:   { workflowId: '2026564061286109185', outputNodeId: '400'  },
} as const

export type ProUpscalerWorkflowKey = keyof typeof PRO_UPSCALER_WORKFLOWS

export function getProUpscalerWorkflow(portrait: boolean, maxmode: boolean) {
  const key: ProUpscalerWorkflowKey = `portrait_${portrait}_maxmode_${maxmode}` as ProUpscalerWorkflowKey
  return PRO_UPSCALER_WORKFLOWS[key]
}

/** RunningHub node IDs */
export const PRO_UPSCALER_NODES = {
  LOAD_IMAGE:  '331',
  SKIN_PATH:   '341',
  PROMPT:      '337',
  RESOLUTION:  '378',
} as const

/** Skin preset → path value sent to node #341 */
export const PRO_UPSCALER_SKIN_PRESETS = {
  Subtle: 1,
  Real:   2,
  Cinema: 3,
} as const

export type SkinPreset = keyof typeof PRO_UPSCALER_SKIN_PRESETS

/** Credit costs */
export const PRO_UPSCALER_CREDITS = {
  standard:    100,
  maxmode_4k:  140,
  maxmode_8k:  200,
} as const

export function getProUpscalerCredits(maxmode: boolean, resolution: '4k' | '8k'): number {
  if (!maxmode) return PRO_UPSCALER_CREDITS.standard
  return resolution === '8k' ? PRO_UPSCALER_CREDITS.maxmode_8k : PRO_UPSCALER_CREDITS.maxmode_4k
}
