import type { Preset, RoleDef, StepDef } from '@/lib/presets/types'

const LOCKS_BUILTIN = {
  stepCount: true,
  naming: true,
  baseRule: false,
  chromaMode: false,
} as const

function stepsFrom(
  ids: string[],
  labelFn: (id: string) => string = (id) => id,
): StepDef[] {
  return ids.map((id) => ({
    id,
    label: labelFn(id),
    tokenSuffix: id,
  }))
}

/** Fallback contrast-vs-white ladders (§4.3) until calibrate-ladders runs. */
const TW_FALLBACK = [
  1.05, 1.15, 1.35, 1.7, 2.4, 3.3, 4.6, 6.5, 9, 12.5, 16,
]

/** Densify TW ladder log-linear to n stops (fine-50 = 19). */
function densifyContrast(ref: number[], count: number): number[] {
  if (count === ref.length) return [...ref]
  const out: number[] = []
  const last = ref.length - 1
  for (let i = 0; i < count; i += 1) {
    const t = count === 1 ? 0 : i / (count - 1)
    const pos = t * last
    const lo = Math.floor(pos)
    const hi = Math.min(last, lo + 1)
    const f = pos - lo
    out.push(Math.exp(Math.log(ref[lo]!) + (Math.log(ref[hi]!) - Math.log(ref[lo]!)) * f))
  }
  return out
}

const FINE_IDS = [
  '50', '100', '150', '200', '250', '300', '350', '400', '450', '500',
  '550', '600', '650', '700', '750', '800', '850', '900', '950',
]

const RADIX_ROLES: RoleDef[] = [
  {
    id: 'app-bg',
    label: 'App background',
    stepIds: ['1'],
    usage: 'App background',
    checks: [],
  },
  {
    id: 'subtle-bg',
    label: 'Subtle background',
    stepIds: ['2'],
    usage: 'Subtle background',
    checks: [],
  },
  {
    id: 'ui-bg',
    label: 'UI component background',
    stepIds: ['3'],
    usage: 'UI component background',
    checks: [],
  },
  {
    id: 'ui-hover',
    label: 'Hovered UI background',
    stepIds: ['4'],
    usage: 'Hovered UI component background',
    checks: [],
  },
  {
    id: 'ui-active',
    label: 'Active / selected',
    stepIds: ['5'],
    usage: 'Active or selected background',
    checks: [],
  },
  {
    id: 'border-subtle',
    label: 'Subtle border',
    stepIds: ['6'],
    usage: 'Subtle borders and separators',
    checks: [],
  },
  {
    id: 'border',
    label: 'UI border',
    stepIds: ['7'],
    usage: 'UI borders and focus rings',
    checks: [],
  },
  {
    id: 'border-hover',
    label: 'Hovered border',
    stepIds: ['8'],
    usage: 'Hovered borders',
    checks: [],
  },
  {
    id: 'solid',
    label: 'Solid background',
    stepIds: ['9'],
    usage: 'Solid color (brand base)',
    checks: [
      {
        fg: { fixed: 'white' },
        bg: { step: '9' },
        min: 4.5,
        level: 'warning',
      },
    ],
  },
  {
    id: 'solid-hover',
    label: 'Solid hover',
    stepIds: ['10'],
    usage: 'Hovered solid',
    checks: [],
  },
  {
    id: 'text-low',
    label: 'Low-contrast text',
    stepIds: ['11'],
    usage: 'Lower-contrast text',
    checks: [
      { fg: { step: '11' }, bg: { step: '2' }, min: 4.5, level: 'error' },
    ],
  },
  {
    id: 'text-high',
    label: 'High-contrast text',
    stepIds: ['12'],
    usage: 'High-contrast text',
    checks: [
      { fg: { step: '12' }, bg: { step: '2' }, min: 7, level: 'error' },
    ],
  },
]

const RADIX_LIGHT_TARGETS = densifyContrast(TW_FALLBACK, 12)
/** Mirrored Radix dark ladder: step 1 dark → 12 light. */
const RADIX_DARK_TARGETS = [...RADIX_LIGHT_TARGETS].reverse()

const MATERIAL_TONES = [
  '100', '99', '95', '90', '80', '70', '60', '50', '40', '30', '20', '10', '0',
]
// L* targets = tone numbers (100 first = lightest)
const MATERIAL_LSTAR = MATERIAL_TONES.map((t) => Number(t))

const MATERIAL_ROLES: RoleDef[] = [
  {
    id: 'primary',
    label: 'Primary',
    stepIds: ['40'],
    usage: 'Primary brand (light)',
    checks: [
      { fg: { step: '100' }, bg: { step: '40' }, min: 4.5, level: 'warning' },
    ],
  },
  {
    id: 'on-primary',
    label: 'On primary',
    stepIds: ['100'],
    usage: 'Text/icons on primary',
    checks: [],
  },
  {
    id: 'primary-container',
    label: 'Primary container',
    stepIds: ['90'],
    usage: 'Primary container surface',
    checks: [],
  },
  {
    id: 'on-primary-container',
    label: 'On primary container',
    stepIds: ['10'],
    usage: 'Content on primary container',
    checks: [
      { fg: { step: '10' }, bg: { step: '90' }, min: 4.5, level: 'warning' },
    ],
  },
]

export const BUILTIN_PRESETS: Preset[] = [
  {
    id: 'tailwind',
    version: 1,
    label: 'Tailwind-Schema',
    description:
      '11 steps 50–950 — structure compatible with Tailwind theme colors. Not official Tailwind colors.',
    builtIn: true,
    steps: stepsFrom([
      '50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950',
    ]),
    ladder: {
      metric: 'contrast-white',
      targets: [...TW_FALLBACK],
      calibratedFrom: 'fallback §4.3 (pending scripts/calibrate-ladders)',
      endpointsAdjustable: false,
    },
    baseRule: { mode: 'auto' },
    chroma: { mode: 'saturated', hueShift: true },
    roles: [],
    dark: { mode: 'none' },
    exportDefaults: {
      format: 'tailwind-v4',
      tokenPattern: '--color-{scale}-{step}',
      colorFormat: 'oklch',
    },
    locks: { ...LOCKS_BUILTIN },
  },
  {
    id: 'fine-50',
    version: 1,
    label: 'Fein (50er)',
    description:
      '19 half-steps 50–950 for custom systems. Not a Tailwind schema.',
    builtIn: true,
    steps: stepsFrom(FINE_IDS),
    ladder: {
      metric: 'contrast-white',
      targets: densifyContrast(TW_FALLBACK, 19),
      calibratedFrom: 'fallback densified from Tailwind §4.3',
      endpointsAdjustable: false,
    },
    baseRule: { mode: 'auto' },
    chroma: { mode: 'saturated', hueShift: true },
    roles: [],
    dark: { mode: 'none' },
    exportDefaults: {
      format: 'css',
      tokenPattern: '--color-{scale}-{step}',
      colorFormat: 'hex',
    },
    locks: { ...LOCKS_BUILTIN },
  },
  {
    id: 'radix',
    version: 1,
    label: 'Radix-Schema',
    description:
      '12 steps with fixed roles for backgrounds, borders, and text. Structure of Radix Colors — not official palettes.',
    builtIn: true,
    steps: stepsFrom(
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    ),
    ladder: {
      metric: 'contrast-white',
      targets: RADIX_LIGHT_TARGETS,
      calibratedFrom: 'fallback densified §4.3',
      endpointsAdjustable: false,
    },
    baseRule: { mode: 'fixed', stepId: '9', maxWarp: 1.6 },
    chroma: { mode: 'saturated', hueShift: true },
    roles: RADIX_ROLES,
    dark: { mode: 'separate-ladder', targets: RADIX_DARK_TARGETS },
    exportDefaults: {
      format: 'css',
      tokenPattern: '--{scale}-{step}',
      darkSelector: '.dark, .dark-theme',
      colorFormat: 'hex',
    },
    locks: { ...LOCKS_BUILTIN },
  },
  {
    id: 'material3',
    version: 1,
    label: 'Material-3-Schema',
    description:
      '13 HCT/L* tones 100→0 for Material You roles. Own colors in M3 structure — not Google palettes.',
    builtIn: true,
    steps: stepsFrom(MATERIAL_TONES),
    ladder: {
      metric: 'lstar',
      targets: MATERIAL_LSTAR,
      calibratedFrom: 'M3 tone = L*',
      endpointsAdjustable: false,
    },
    baseRule: { mode: 'none' },
    chroma: { mode: 'saturated', hueShift: false },
    roles: MATERIAL_ROLES,
    dark: {
      mode: 'role-remap',
      map: {
        primary: '80',
        'on-primary': '20',
        'primary-container': '30',
        'on-primary-container': '90',
      },
    },
    exportDefaults: {
      format: 'css',
      tokenPattern: '--md-ref-palette-{scale}{step}',
      colorFormat: 'hex',
    },
    locks: { ...LOCKS_BUILTIN },
  },
  {
    id: 'ant',
    version: 1,
    label: 'Ant-Design-Schema',
    description:
      '10 steps with primary on step 6. Structure compatible with Ant Design — not official colors.',
    builtIn: true,
    steps: stepsFrom(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']),
    ladder: {
      metric: 'contrast-white',
      targets: densifyContrast(TW_FALLBACK, 10),
      calibratedFrom: 'fallback densified §4.3',
      endpointsAdjustable: false,
    },
    baseRule: { mode: 'fixed', stepId: '6', maxWarp: 1.6 },
    chroma: { mode: 'saturated', hueShift: true },
    roles: [],
    dark: { mode: 'none' },
    exportDefaults: {
      format: 'css',
      tokenPattern: '--{scale}-{step}',
      colorFormat: 'hex',
    },
    locks: { ...LOCKS_BUILTIN },
  },
  {
    id: 'carbon',
    version: 1,
    label: 'Carbon-Schema',
    description:
      '10 steps 10–100 in IBM Carbon structure. Not official Carbon colors.',
    builtIn: true,
    steps: stepsFrom([
      '10', '20', '30', '40', '50', '60', '70', '80', '90', '100',
    ]),
    ladder: {
      metric: 'contrast-white',
      targets: densifyContrast(TW_FALLBACK, 10),
      calibratedFrom: 'fallback densified §4.3',
      endpointsAdjustable: false,
    },
    baseRule: { mode: 'auto' },
    chroma: { mode: 'saturated', hueShift: true },
    roles: [],
    dark: { mode: 'none' },
    exportDefaults: {
      format: 'scss',
      tokenPattern: '${scale}-{step}',
      colorFormat: 'hex',
    },
    locks: { ...LOCKS_BUILTIN },
  },
  {
    id: 'open-color',
    version: 1,
    label: 'Open-Color-Schema',
    description:
      '10 steps 0–9 matching Open Color naming. Not the official Open Color palette.',
    builtIn: true,
    steps: stepsFrom(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']),
    ladder: {
      metric: 'contrast-white',
      targets: densifyContrast(TW_FALLBACK, 10),
      calibratedFrom: 'fallback densified §4.3',
      endpointsAdjustable: false,
    },
    baseRule: { mode: 'auto' },
    chroma: { mode: 'saturated', hueShift: true },
    roles: [],
    dark: { mode: 'none' },
    exportDefaults: {
      format: 'css',
      tokenPattern: '--oc-{scale}-{step}',
      colorFormat: 'hex',
    },
    locks: { ...LOCKS_BUILTIN },
  },
]

export const DEFAULT_PRESET_ID = 'tailwind'

export function getBuiltinPreset(id: string): Preset | undefined {
  return BUILTIN_PRESETS.find((p) => p.id === id)
}

/** Compact summary for cards/chips. */
export function presetStepSummary(preset: Preset): string {
  const n = preset.steps.length
  const first = preset.steps[0]?.label ?? ''
  const last = preset.steps[n - 1]?.label ?? ''
  return `${first}–${last} · ${n} Stufen`
}

/** Role groups for strip brackets (Radix-style). */
export function roleGroupsForPreset(
  preset: Preset,
): { label: string; from: string; to: string }[] {
  if (preset.id === 'radix') {
    return [
      { label: 'Hintergründe', from: '1', to: '2' },
      { label: 'Komponenten', from: '3', to: '5' },
      { label: 'Rahmen', from: '6', to: '8' },
      { label: 'Solid', from: '9', to: '10' },
      { label: 'Text', from: '11', to: '12' },
    ]
  }
  return []
}

export function roleForStep(
  preset: Preset,
  stepId: string,
): RoleDef | undefined {
  return preset.roles.find((r) => r.stepIds.includes(stepId))
}

/** Clone built-in as editable custom preset. */
export function cloneAsCustom(preset: Preset, id = crypto.randomUUID()): Preset {
  return {
    ...structuredClone(preset),
    id,
    version: 1,
    builtIn: false,
    label: `${preset.label.replace(/-Schema$/, '')} (eigen)`,
    description: `Eigenes Preset, basierend auf ${preset.label}.`,
    locks: {
      stepCount: false,
      naming: false,
      baseRule: false,
      chromaMode: false,
    },
  }
}
