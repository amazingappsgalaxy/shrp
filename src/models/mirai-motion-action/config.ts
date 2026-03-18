/**
 * Mirai Motion - Replicate: Action
 *
 * RunningHub motion-transfer model. Transfers motion from a reference video
 * onto a character image using WanVideo-based ComfyUI workflows.
 *
 * Provider: RunningHub
 * Sub-model family: mirai-motion-replicate (variantGroupId)
 *
 * Node mapping (identical across both workflow variants):
 *   #172  VHS_LoadVideo          fieldName: 'video'  — motion source video
 *   #149  LoadImage              fieldName: 'image'  — character/subject image
 *   #191  PrimitiveStringMultiline  fieldName: 'value'  — positive prompt
 *   #192  PrimitiveStringMultiline  fieldName: 'value'  — negative prompt
 *   #118  VHS_VideoCombine       OUTPUT node — generated video
 *
 * Workflow selection:
 *   Smart Recreate OFF → WORKFLOW_NO_MASK   (2034285341502349314)
 *   Smart Recreate ON  → WORKFLOW_WITH_MASK (2033904737749311490)
 */

export const MIRAI_ACTION_WORKFLOW_NO_MASK    = '2034285341502349314'
export const MIRAI_ACTION_WORKFLOW_WITH_MASK  = '2033904737749311490'

export const MIRAI_ACTION_NODES = {
  LOAD_VIDEO:    '172',
  LOAD_IMAGE:    '149',
  PROMPT:        '191',
  NEG_PROMPT:    '192',
  SAVE_VIDEO:    '118',
} as const

/** Constraints for input validation */
export const MIRAI_ACTION_CONSTRAINTS = {
  MAX_VIDEO_DURATION_S: 10,
  MAX_VIDEO_SIZE_MB:    50,
  MAX_IMAGE_SIZE_MB:    50,
} as const
