export const CRISP_UPSCALER_MODEL_ID = 'crisp-upscaler'

/**
 * Approximate task duration in seconds — used to calibrate the loading progress animation.
 */
export const CRISP_UPSCALER_TASK_DURATION_SECS = 200

export const CRISP_UPSCALER_WORKFLOW_ID = '2033549152264654849'

export const CRISP_UPSCALER_CREDITS = 120

export const CRISP_UPSCALER_NODES = {
  LOAD_IMAGE: '80', // LoadImage — input image
  SAVE_IMAGE: '70', // SaveImage — output node
} as const
