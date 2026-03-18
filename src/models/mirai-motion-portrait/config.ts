/**
 * Mirai Motion - Replicate: Portrait
 *
 * RunningHub motion-transfer model optimised for portrait/character subjects.
 * Supports three workflow paths depending on Smart Recreate mode.
 *
 * Provider: RunningHub
 * Sub-model family: mirai-motion-replicate (variantGroupId)
 *
 * Node mapping (identical across all three workflow variants):
 *   #15   VHS_LoadVideo          fieldName: 'video'  — motion source video
 *   #80   LoadImage              fieldName: 'image'  — character/subject image
 *   #328  PrimitiveStringMultiline  fieldName: 'value'  — positive prompt
 *   #329  PrimitiveStringMultiline  fieldName: 'value'  — negative prompt
 *   #26   VHS_VideoCombine       OUTPUT node — generated video
 *
 * Workflow selection:
 *   Smart Recreate OFF                        → WORKFLOW_NO_MASK      (2034256769005916161)
 *   Smart Recreate ON  + mode 'replace'       → WORKFLOW_TOTAL_MASK   (2033916743386664962)
 *   Smart Recreate ON  + mode 'smart-replace' → WORKFLOW_PERSON_MASK  (2034256112647671809)
 */

export const MIRAI_PORTRAIT_WORKFLOW_NO_MASK      = '2034256769005916161'
export const MIRAI_PORTRAIT_WORKFLOW_TOTAL_MASK   = '2033916743386664962'
export const MIRAI_PORTRAIT_WORKFLOW_PERSON_MASK  = '2034256112647671809'

export const MIRAI_PORTRAIT_NODES = {
  LOAD_VIDEO:    '15',
  LOAD_IMAGE:    '80',
  PROMPT:        '328',
  NEG_PROMPT:    '329',
  SAVE_VIDEO:    '26',
} as const

/** Portrait-specific Smart Recreate sub-modes */
export type PortraitSmartRecreateMode = 'replace' | 'smart-replace'
export const PORTRAIT_DEFAULT_MODE: PortraitSmartRecreateMode = 'replace'

/** Constraints for input validation */
export const MIRAI_PORTRAIT_CONSTRAINTS = {
  MAX_VIDEO_DURATION_S: 10,
  MAX_VIDEO_SIZE_MB:    50,
  MAX_IMAGE_SIZE_MB:    50,
} as const
