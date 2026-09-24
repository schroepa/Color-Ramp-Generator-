import { wcagContrast } from 'culori'
import { getBuiltinPreset } from './src/lib/presets/index.ts'
import { generateFromPreset } from './src/lib/presets/generate.ts'
import { assessRampQuality } from './src/lib/ramp-quality.ts'

const p = getBuiltinPreset('tailwind')!
for (const hex of ['#0D7377', '#808080', '#E5484D', '#F8F8F2', '#111114', '#F5D547']) {
  const r = generateFromPreset({
    baseHex: hex,
    preset: p,
    chromaMode: 'saturated',
    baseOverride: null,
    theme: 'light',
  })
  const colors = r.steps.map((s) => s.hex)
  const bi = r.steps.findIndex((s) => s.isBase)
  const q = assessRampQuality(colors, bi)
  console.log(
    hex,
    'base',
    r.baseStepId,
    'cW',
    wcagContrast(hex, '#fff').toFixed(2),
    'mono',
    q.monotone,
    'minΔ',
    q.minDeltaE,
    'minD',
    Math.min(...q.deltas).toFixed(4),
    'label',
    q.label,
  )
}
