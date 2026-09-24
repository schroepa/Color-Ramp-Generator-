import {
  BUILTIN_PRESETS,
  DEFAULT_PRESET_ID,
  getBuiltinPreset,
} from '@/lib/presets/builtins'
import type { Preset } from '@/lib/presets/types'
import type { GenerationSettings } from '@/lib/generation-settings'

export {
  BUILTIN_PRESETS,
  DEFAULT_PRESET_ID,
  getBuiltinPreset,
  presetStepSummary,
  roleGroupsForPreset,
  roleForStep,
  cloneAsCustom,
} from '@/lib/presets/builtins'

export type { Preset, GenerateResult, CheckResult } from '@/lib/presets/types'
export { generateFromPreset, generateFromPresetCached } from '@/lib/presets/generate'

const LAST_PRESET_KEY = 'tintfield.lastPresetId'

export function loadLastPresetId(): string {
  try {
    const id = localStorage.getItem(LAST_PRESET_KEY)
    if (id && resolvePreset(id)) return id
  } catch {
    /* ignore */
  }
  return DEFAULT_PRESET_ID
}

export function saveLastPresetId(id: string): void {
  try {
    localStorage.setItem(LAST_PRESET_KEY, id)
  } catch {
    /* ignore */
  }
}

/** Resolve built-in or provided custom preset. */
export function resolvePreset(
  id: string,
  custom?: Preset | null,
): Preset | undefined {
  if (custom && custom.id === id) return custom
  return getBuiltinPreset(id)
}

/**
 * Migrate legacy generation settings → preset id (§9.3).
 * - tailwind-dense / 19 steps → fine-50
 * - tailwind / 11 → tailwind
 * - material 10 → material3 (closest)
 * - compact → custom-like open-color or keep as fine via custom
 */
export function migrateLegacyToPresetId(
  settings: GenerationSettings | null | undefined,
  explicitPresetId?: string | null,
): string {
  if (explicitPresetId) {
    const aliased = migratePresetIdAlias(explicitPresetId)
    if (aliased === 'custom') return 'custom'
    if (aliased === 'compact') return 'compact'
    if (resolvePreset(aliased)) return aliased
  }
  if (!settings) return DEFAULT_PRESET_ID
  // Migration only: infer from step counts when presetId missing
  const total = settings.lightSteps + 1 + settings.darkSteps
  if (settings.lightSteps === 9 && settings.darkSteps === 9) return 'fine-50'
  if (settings.lightSteps === 5 && settings.darkSteps === 5) return 'tailwind'
  if (settings.lightSteps === 4 && settings.darkSteps === 5) return 'material3'
  if (settings.lightSteps === 2 && settings.darkSteps === 2) return 'compact'
  if (total === 19) return 'fine-50'
  if (total === 11) return 'tailwind'
  if (total === 12) return 'radix'
  if (total === 13) return 'material3'
  if (total === 10) return 'ant'
  if (total === 5) return 'compact'
  return 'custom'
}

/** Map old GenerationPresetId strings. */
export function migratePresetIdAlias(id: string): string {
  if (id === 'tailwind-dense') return 'fine-50'
  if (id === 'material' || id === 'material-2014') return 'material3'
  return id
}

export function listSelectablePresets(customLibrary: Preset[] = []): Preset[] {
  return [...BUILTIN_PRESETS, ...customLibrary]
}

export function settingsFromPreset(preset: Preset): GenerationSettings {
  const n = preset.steps.length
  const light = Math.floor((n - 1) / 2)
  const dark = n - 1 - light
  return {
    lightSteps: light,
    darkSteps: dark,
    presetId: preset.id,
  }
}
