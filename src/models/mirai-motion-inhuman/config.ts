/**
 * Mirai Motion - Replicate: Inhuman
 *
 * RunningHub motion-transfer model for non-human / creature subjects.
 * No prompt or Smart Recreate — purely video + image driven.
 *
 * Provider: RunningHub
 * Sub-model family: mirai-motion-replicate (variantGroupId)
 *
 * Node mapping:
 *   #128  VHS_LoadVideo    fieldName: 'video'  — motion source video
 *   #212  LoadImage        fieldName: 'image'  — character/subject image
 *   #366  VHS_VideoCombine OUTPUT node — generated video
 *
 * Single workflow: 2034259237353824258
 */

export const MIRAI_INHUMAN_WORKFLOW = '2034259237353824258'

export const MIRAI_INHUMAN_NODES = {
  LOAD_VIDEO:    '128',
  LOAD_IMAGE:    '212',
  SAVE_VIDEO:    '366',
} as const

/** Constraints for input validation */
export const MIRAI_INHUMAN_CONSTRAINTS = {
  MAX_VIDEO_DURATION_S: 10,
  MAX_VIDEO_SIZE_MB:    50,
  MAX_IMAGE_SIZE_MB:    50,
} as const
