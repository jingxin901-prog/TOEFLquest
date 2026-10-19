export type FontScale = 'small' | 'standard' | 'large'

export const FONT_SCALE_STORAGE_KEY = 'toefl-quest:font-scale'

export function readFontScale(): FontScale {
  const saved = localStorage.getItem(FONT_SCALE_STORAGE_KEY)
  return saved === 'small' || saved === 'large' ? saved : 'standard'
}

export function applyFontScale(scale: FontScale) {
  document.documentElement.dataset.fontScale = scale
  localStorage.setItem(FONT_SCALE_STORAGE_KEY, scale)
}
