import { converter, parse } from 'culori'
import { describe, expect, it } from 'vitest'
import { normalizeHex, stepKeysFor } from '@/lib/color-system'
import { settingsForPreset, customStepKeys } from '@/lib/generation-settings'
import { hueShiftAt } from '@/lib/hue-shift'
import { getBuiltinPreset } from '@/lib/presets'
import { generateFromPreset } from '@/lib/presets/generate'
import { assessRampQuality } from '@/lib/ramp-quality'
import type { ChromaMode } from '@/lib/presets/types'

const toOklch = converter('oklch')

const COLORS: { name: string; hex: string; twBase?: string | string[] }[] = [
  { name: 'teal', hex: '#0D7377', twBase: ['600', '700'] },
  { name: 'orange', hex: '#C45C26', twBase: ['500', '600'] },
  { name: 'yellow', hex: '#F5D547', twBase: '200' },
  { name: 'navy', hex: '#1E2A5A', twBase: ['800', '900'] },
  { name: 'neon', hex: '#39FF14', twBase: ['200', '300'] },
  { name: 'nearWhite', hex: '#F8F8F2', twBase: ['50', '100'] },
  { name: 'nearBlack', hex: '#111114', twBase: ['900', '950'] },
  { name: 'gray', hex: '#808080', twBase: ['500', '600'] },
  { name: 'red', hex: '#E5484D', twBase: ['500', '600'] },
]

const SYSTEMS: ChromaMode[] = ['saturated', 'fade', 'pale']
const PRESET_IDS = ['tailwind', 'fine-50', 'material3', 'open-color'] as const

function hexOk(h: string) {
  return /^#[0-9a-fA-F]{6}$/.test(h)
}

describe('hueShiftAt (Befund 5)', () => {
  it('is near zero for teal / orange / gray', () => {
    for (const hex of ['#0D7377', '#C45C26', '#808080']) {
      const o = toOklch(parse(hex)!)
      const dark = hueShiftAt(o?.h, o?.c ?? 0, 1, 'dark')
      const light = hueShiftAt(o?.h, o?.c ?? 0, 1, 'light')
      expect(Math.abs(dark)).toBeLessThan(3)
      expect(Math.abs(light)).toBeLessThan(3)
    }
  })

  it('shifts yellow dark toward orange (negative)', () => {
    const o = toOklch(parse('#F5D547')!)
    expect(hueShiftAt(o?.h, o?.c ?? 0, 1, 'dark')).toBeLessThan(-10)
  })

  it('shifts blue light toward cyan (negative)', () => {
    const o = toOklch(parse('#2563EB')!)
    expect(hueShiftAt(o?.h, o?.c ?? 0, 1, 'light')).toBeLessThan(-3)
  })

  it('is continuous across yellow/green boundary', () => {
    const a = hueShiftAt(114, 0.12, 1, 'dark')
    const b = hueShiftAt(116, 0.12, 1, 'dark')
    expect(Math.abs(a - b)).toBeLessThan(5)
  })
})

describe('assessRampQuality (Befund 6)', () => {
  it('accepts red without wraparound false positive', () => {
    const preset = getBuiltinPreset('tailwind')!
    const r = generateFromPreset({
      baseHex: '#E5484D',
      preset,
      chromaMode: 'saturated',
      baseOverride: null,
      theme: 'light',
    })
    const q = assessRampQuality(
      r.steps.map((s) => s.hex),
      r.steps.findIndex((s) => s.isBase),
    )
    expect(q.deltas.every((d) => Number.isFinite(d) && d >= 0)).toBe(true)
    expect(q.label).not.toMatch(/wrap/i)
  })

  it('accepts gray with finite deltas', () => {
    const preset = getBuiltinPreset('tailwind')!
    const r = generateFromPreset({
      baseHex: '#808080',
      preset,
      chromaMode: 'saturated',
      baseOverride: null,
      theme: 'light',
    })
    const q = assessRampQuality(
      r.steps.map((s) => s.hex),
      r.steps.findIndex((s) => s.isBase),
    )
    expect(q.deltas.every((d) => Number.isFinite(d))).toBe(true)
  })

  it('fails when two neighbors are identical', () => {
    const colors = Array.from({ length: 5 }, () => '#808080')
    const q = assessRampQuality(colors, 2)
    expect(q.minDeltaE).toBe(false)
  })
})

describe('stepKeysFor (Befund 4)', () => {
  it('is stable across base colors for custom counts', () => {
    const settings = {
      lightSteps: 3,
      darkSteps: 3,
      presetId: 'custom',
    }
    const a = stepKeysFor(settings)
    const b = stepKeysFor(settings)
    expect(a).toEqual(b)
    expect(a).toEqual(customStepKeys(7))
    expect(a).not.toContain('base')
  })

  it('matches preset labels for tailwind', () => {
    const keys = stepKeysFor(settingsForPreset('tailwind'))
    expect(keys).toEqual([
      '50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950',
    ])
  })
})

describe('generateFromPreset matrix', () => {
  for (const presetId of PRESET_IDS) {
    for (const system of SYSTEMS) {
      for (const sample of COLORS) {
        it(`${presetId}/${system}/${sample.name}`, () => {
          const preset = getBuiltinPreset(presetId)!
          const locked = normalizeHex(sample.hex)!
          const result = generateFromPreset({
            baseHex: locked,
            preset,
            chromaMode: system,
            baseOverride: null,
            theme: 'light',
          })
          expect(result.steps.length).toBe(preset.steps.length)
          expect(result.steps.every((s) => hexOk(s.hex))).toBe(true)

          const colors = result.steps.map((s) => s.hex)
          const baseIdx = result.steps.findIndex((s) => s.isBase)
          if (baseIdx >= 0 && preset.baseRule.mode !== 'none') {
            expect(colors[baseIdx]!.toLowerCase()).toBe(locked.toLowerCase())
          }

          const q = assessRampQuality(
            colors,
            baseIdx >= 0 ? baseIdx : Math.floor(colors.length / 2),
          )
          const extreme =
            sample.name === 'nearWhite' || sample.name === 'nearBlack'
          if (presetId !== 'material3' && !extreme) {
            expect(q.monotone).toBe(true)
            expect(q.usable).toBe(true)
          } else {
            expect(q.deltas.every((d) => Number.isFinite(d))).toBe(true)
          }

          if (presetId === 'tailwind' && sample.twBase) {
            const expected = Array.isArray(sample.twBase)
              ? sample.twBase
              : [sample.twBase]
            expect(expected).toContain(result.baseStepId)
          }
        })
      }
    }
  }
})

describe('snapshots', () => {
  it('teal / yellow / navy on tailwind', () => {
    const preset = getBuiltinPreset('tailwind')!
    for (const hex of ['#0D7377', '#F5D547', '#1E2A5A']) {
      const result = generateFromPreset({
        baseHex: hex,
        preset,
        chromaMode: 'saturated',
        baseOverride: null,
        theme: 'light',
      })
      expect(result.steps.map((s) => s.hex.toLowerCase())).toMatchSnapshot(
        hex.toLowerCase(),
      )
    }
  })
})
