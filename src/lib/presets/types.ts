/** Design-system preset schema (tintfield-anforderungen-presets.md §3). */

export type PresetId = string

export type LadderMetric = 'contrast-white' | 'lstar' | 'oklch-l'

export type ChromaMode = 'saturated' | 'fade' | 'pale'

export interface StepDef {
  id: string
  label: string
  tokenSuffix: string
}

export interface Ladder {
  metric: LadderMetric
  targets: number[]
  calibratedFrom?: string
  endpointsAdjustable: boolean
}

export type BaseRule =
  | { mode: 'auto' }
  | { mode: 'fixed'; stepId: string; maxWarp: number }
  | { mode: 'none' }

export interface ChromaDefaults {
  mode: ChromaMode
  hueShift: boolean
}

export type StepRef = { step: string } | { fixed: 'white' | 'black' }

export interface ContrastCheck {
  fg: StepRef
  bg: StepRef
  min: number
  level: 'error' | 'warning'
}

export interface RoleDef {
  id: string
  label: string
  stepIds: string[]
  usage: string
  checks: ContrastCheck[]
}

export type DarkStrategy =
  | { mode: 'none' }
  | { mode: 'role-remap'; map: Record<string, string> }
  | { mode: 'separate-ladder'; targets: number[] }

export interface ExportDefaults {
  format: 'css' | 'tailwind-v4' | 'tailwind-v3' | 'scss' | 'dtcg' | 'json'
  tokenPattern: string
  darkSelector?: string
  colorFormat: 'hex' | 'oklch' | 'rgb'
}

export interface PresetLocks {
  stepCount: boolean
  naming: boolean
  baseRule: boolean
  chromaMode: boolean
}

export interface Preset {
  id: PresetId
  version: number
  label: string
  description: string
  builtIn: boolean
  steps: StepDef[]
  ladder: Ladder
  baseRule: BaseRule
  chroma: ChromaDefaults
  roles: RoleDef[]
  dark: DarkStrategy
  exportDefaults: ExportDefaults
  locks: PresetLocks
}

export type CheckResult = {
  id: string
  roleId?: string
  level: 'error' | 'warning' | 'info'
  ok: boolean
  message: string
  recommendation?: string
  applyRecommendation?: { baseOverride: string } | { chromaMode: ChromaMode }
}

export type GenerateInput = {
  baseHex: string
  preset: Preset
  chromaMode: ChromaMode
  baseOverride: string | null
  endpoints?: { lightest: number; darkest: number }
  theme: 'light' | 'dark'
}

export type GenerateStep = {
  stepId: string
  hex: string
  oklch: [number, number, number]
  isBase: boolean
}

export type GenerateResult = {
  steps: GenerateStep[]
  baseStepId: string | null
  baseDeltaE: number
  warpFactor: number
  checks: CheckResult[]
  /** Recommended auto step when warp exceeds maxWarp. */
  suggestedBaseStepId?: string
}
