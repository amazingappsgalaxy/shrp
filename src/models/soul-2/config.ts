export const SOUL2_MODEL_ID = 'soul-2'

/**
 * Approximate task duration in seconds — used to calibrate the loading progress animation.
 */
export const SOUL2_TASK_DURATION_SECS = 90

export const SOUL2_WORKFLOW_ID = '2033529679528861697'

export const SOUL2_CREDITS = 50

export const SOUL2_NODES = {
  PROMPT: '45',       // CLIPTextEncode — user text prompt
  ASPECT_RATIO: '77', // AspectRatioResolution_Warper — aspect ratio + long_edge
  SAVE_IMAGE: '63',   // SaveImage — output node
} as const

/**
 * Map from standard aspect ratio string (e.g. "16:9") to the RunningHub
 * AspectRatioResolution_Warper combo value.
 */
export const SOUL2_ASPECT_RATIO_MAP: Record<string, string> = {
  '16:9': '16:9 (Wide)',
  '4:3':  '4:3 (Standard)',
  '3:2':  '3:2 (Photo)',
  '1:1':  '1:1 (Square)',
  '2:3':  '2:3 (Portrait Photo)',
  '3:4':  '3:4 (Portrait Standard)',
  '9:16': '9:16 (Portrait Wide)',
}

/** Default long_edge resolution (pixels) fed to the aspect ratio node */
export const SOUL2_LONG_EDGE = 1920
