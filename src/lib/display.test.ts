import { beforeEach, describe, expect, it } from 'vitest'
import { applyFontScale, FONT_SCALE_STORAGE_KEY, readFontScale } from './display'

describe('display preferences', () => {
  beforeEach(() => {
    localStorage.clear()
    delete document.documentElement.dataset.fontScale
  })

  it('uses the standard size by default', () => {
    expect(readFontScale()).toBe('standard')
  })

  it('applies and persists a selected size', () => {
    applyFontScale('large')
    expect(document.documentElement.dataset.fontScale).toBe('large')
    expect(localStorage.getItem(FONT_SCALE_STORAGE_KEY)).toBe('large')
    expect(readFontScale()).toBe('large')
  })
})
