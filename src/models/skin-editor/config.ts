import { EnhancementSettings } from '@/services/ai-providers/common/types'

export const SKIN_EDITOR_MODEL_ID = 'skin-editor'

export interface SkinEditorSettings extends EnhancementSettings {
    mode?: 'Subtle' | 'Clear' | 'Pimples' | 'Freckles' | 'Custom'
    denoise?: number
    maxshift?: number
    megapixels?: number
    guidance?: number
}

export const SKIN_EDITOR_MODES = {
    Subtle: {
        prompt: 'visible natural pore scars embedded into the skin geometry on face near forehead and cheeks, uneven skin topology, natural scars skin topology, multiple natural scars on face, Ultra-high-definition professional photograph, 8K resolution, crystal-clear sharpness, do not add too many blemishes, apply this texture only for skin, apply this texture only for face and skin and not on hair or dress, skin texture creates subtle micro-shadows and highlights under lighting',
        denoise: 0.20,
        maxshift: 1,
        megapixels: 4,
        guidance: 80
    },
    Clear: {
        prompt: 'Silky smooth skin, beautiful smooth skin, perfect skin, enhance skin, realistice skin, visible skin texture, ultra realistic, Ultra-high-definition professional photograph, 8K resolution, crystal-clear sharpness, lifelike details, studio-grade image quality, no blurring or distortion, sublty reduce existing blemishes, sublty soften existing blemishes, do not remove blemishes just soften them and reduce the opacity of all the blemishes, apply skin texture only for skin, apply skin texture only for face and skin and not on hair or dress strictly, skin texture creates subtle micro-shadows and highlights under lighting',
        denoise: 0.35,
        maxshift: 1.2,
        megapixels: 4,
        guidance: 100
    },
    Pimples: {
        prompt: 'subtle soft natural pimples on nose and cheeks, 100+ multple pimples on face, huge pimples, natural skin pattern, majar intense acne, acne scars, lots of acne, surface marks, acne covering whole face, acne, covering the whole face without any gap, acne marks should be of the same color as the skin, no dark acne, acne marks same skin color, light color acne marks, apply skin texture only for skin, apply skin texture only for face and skin and not on hair or dress, skin texture creates subtle micro-shadows and highlights under lighting',
        denoise: 0.37,
        maxshift: 1.2,
        megapixels: 2,
        guidance: 100
    },
    Freckles: {
        prompt: 'intense freckles on nose and cheeks, multple freckles on nose and cheeks, extreme freckles on nose and cheeks, countless large number frekles, natural skin pattern, natural freckle size and arrangement matching face, freckles are evenly arranged naturally on the face, apply freckles only for skin, apply freckles only for face and skin and not on hair or dress, skin texture creates subtle micro-shadows and highlights under lighting',
        denoise: 0.37,
        maxshift: 1.2,
        megapixels: 2,
        guidance: 100
    },
    Custom: {
        prompt: '', // Will be filled dynamically
        denoise: 0.24,
        maxshift: 1,
        megapixels: 4,
        guidance: 100
    }
}

