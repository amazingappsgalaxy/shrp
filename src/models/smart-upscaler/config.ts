export const SMART_UPSCALER_MODEL_ID = 'smart-upscaler'

export interface SmartUpscalerSettings {
  resolution?: '4k' | '8k'
  [key: string]: any
}

export const SMART_UPSCALER_WORKFLOW_ID = '2024900845141233665'

export const SMART_UPSCALER_CREDITS = {
  '4k': 80,
  '8k': 120,
} as const

export const SMART_UPSCALER_NODES = {
  LOAD_IMAGE: '230',   // LoadImage - input image
  SCALE_BY: '213',     // ImageScaleBy - scale_by field
  RESIZE: '214',       // ImageResize+ - width and height fields
  SAVE_IMAGE: '215',   // SaveImage - output
} as const

export const SMART_UPSCALER_RESOLUTION_SETTINGS = {
  '4k': {
    scaleBy: '2.000000000000',
    width: '4096',
    height: '4096',
  },
  '8k': {
    scaleBy: '4.000000000000',
    width: '8192',
    height: '8192',
  },
} as const
