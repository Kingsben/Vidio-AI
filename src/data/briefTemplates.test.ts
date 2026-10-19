import { describe, expect, it } from 'vitest'
import { briefTemplates, createBriefPath, getBriefTemplate, getCategoryBriefTemplate } from './briefTemplates'
import { inspirationCategories } from './inspirationVideos'
import { projectFormats } from './projects'

describe('brief template selection', () => {
  it('offers distinct valid starting points for the existing schema', () => {
    expect(briefTemplates).toHaveLength(9)
    expect(new Set(briefTemplates.map((template) => template.id)).size).toBe(9)
    for (const template of briefTemplates) {
      expect(projectFormats).toContain(template.format)
      expect(template.title.length).toBeLessThanOrEqual(100)
      expect(template.brief.length).toBeLessThanOrEqual(4000)
      expect(template.brief.length).toBeGreaterThan(100)
    }
  })
  it('resolves every gallery category to a real template', () => {
    for (const category of inspirationCategories) {
      expect(briefTemplates).toContain(getCategoryBriefTemplate(category))
    }
  })
  it('only accepts known template IDs in creation links', () => {
    expect(createBriefPath('product-ad')).toBe('/app/projects/new?template=product-ad')
    expect(createBriefPath('https://invalid.test')).toBe('/app/projects/new')
    expect(getBriefTemplate('unknown')).toBeUndefined()
  })
})
