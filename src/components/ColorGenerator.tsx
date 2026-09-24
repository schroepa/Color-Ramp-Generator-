import { useEffect, useRef, useState, type DragEvent } from 'react'
import { ChevronRight, Download, GripVertical, Pencil, Share2, SlidersHorizontal } from 'lucide-react'
import { ColorScaleRow } from '@/components/ColorScaleRow'
import { ContrastLegend } from '@/components/ContrastLegend'
import { EntryState } from '@/components/EntryState'
import { ExportDialog } from '@/components/ExportDialog'
import { GenerationSettingsPanel } from '@/components/GenerationSettingsPanel'
import { MobileScaleDetail } from '@/components/MobileScaleDetail'
import { MobileSheet } from '@/components/MobileSheet'
import { NewScaleForm } from '@/components/NewScaleForm'
import { ProjectSwitcher } from '@/components/ProjectSwitcher'
import { ScaleOverflowMenu } from '@/components/ScaleOverflowMenu'
import type { ScaleCopyFormat } from '@/components/ScaleCopyMenu'
import { StepInspector } from '@/components/StepInspector'
import { SurfaceSwitcher } from '@/components/SurfaceSwitcher'
import { SystemSwitch } from '@/components/SystemSwitch'
import { UiRampPreview } from '@/components/UiRampPreview'
import { Button } from '@/components/ui/button'
import { useActionToast } from '@/hooks/use-action-toast'
import { toast as sonnerToast } from 'sonner'
import { contrastAgainstWhiteAndBlack } from '@/lib/contrast'
import {
  baseIndexFor,
  type ColorSystem,
  normalizeHex,
  scaleToCssVars,
  scaleToJson,
  stepKeysFor,
} from '@/lib/color-system'
import {
  type GenerationSettings,
  normalizeGenerationSettings,
} from '@/lib/generation-settings'
import {
  generateFromPresetCached,
  getBuiltinPreset,
  migrateLegacyToPresetId,
  resolvePreset,
  saveLastPresetId,
  settingsFromPreset,
  type Preset,
  type CheckResult,
} from '@/lib/presets'
import {
  loadRampDensity,
  saveRampDensity,
  type RampDensity,
} from '@/lib/ramp-density'
import {
  loadRampSurface,
  rampSurfaceMeta,
  saveRampSurface,
  type RampSurface,
} from '@/lib/ramp-surface'
import { suggestScaleName } from '@/lib/scale-name'
import {
  buildShareUrl,
  decodeSharePayload,
  shareOrCopyUrl,
} from '@/lib/share-state'
import { applyThemePreview, clearThemePreview } from '@/lib/theme-preview'
import {
  type HydratedProject,
  type ProjectListItem,
  type ProjectsStore,
  createProject,
  deleteProject,
  getActiveProject,
  listProjects,
  loadProjectsStore,
  projectToJson,
  saveActiveProjectSnapshot,
  switchProject,
} from '@/lib/projects'
import { cn } from '@/lib/utils'

export type ColorScale = {
  id: string
  name: string
  baseColor: string
  system: ColorSystem
  colors: string[]
  /** Override base step id; null = preset rule. */
  baseOverride?: string | null
  darkColors?: string[]
}

type MainTab = 'ramps' | 'preview' | 'contrast'

function createScale(
  baseColor = '#0d7377',
  system: ColorSystem = 'saturated',
  settings: GenerationSettings,
  preset?: Preset | null,
  baseOverride: string | null = null,
): ColorScale {
  const hex = normalizeHex(baseColor) ?? '#0d7377'
  const active =
    preset ??
    resolvePreset(migrateLegacyToPresetId(settings, settings.presetId)) ??
    getBuiltinPreset('tailwind')!
  const light = generateFromPresetCached({
    baseHex: hex,
    preset: active,
    chromaMode: system,
    baseOverride,
    theme: 'light',
  })
  const dark =
    active.dark.mode === 'separate-ladder'
      ? generateFromPresetCached({
          baseHex: hex,
          preset: active,
          chromaMode: system,
          baseOverride,
          theme: 'dark',
        })
      : null
  return {
    id: crypto.randomUUID(),
    name: suggestScaleName(hex),
    baseColor: hex,
    system,
    colors: light.steps.map((s) => s.hex),
    baseOverride,
    darkColors: dark?.steps.map((s) => s.hex),
  }
}

function recomputeScales(
  scales: ColorScale[],
  settings: GenerationSettings,
  preset?: Preset | null,
): ColorScale[] {
  const active =
    preset ??
    resolvePreset(migrateLegacyToPresetId(settings, settings.presetId)) ??
    getBuiltinPreset('tailwind')!
  return scales.map((scale) => {
    const next = createScale(
      scale.baseColor,
      scale.system,
      settings,
      active,
      scale.baseOverride ?? null,
    )
    return {
      ...scale,
      colors: next.colors,
      darkColors: next.darkColors,
    }
  })
}

function bootstrapProject(): {
  project: HydratedProject
  projects: ProjectListItem[]
} {
  const shared = decodeSharePayload(window.location.hash)
  if (shared && shared.scales.length > 0) {
    const { project } = createProject(shared.name)
    const hydratedScales = shared.scales.map((s, i) => ({
      ...createScale(s.baseColor, s.system, shared.generation),
      name: shared.scales[i]?.name || suggestScaleName(s.baseColor),
    }))
    const store = saveActiveProjectSnapshot({
      id: project.id,
      name: shared.name,
      scales: hydratedScales,
      generation: shared.generation,
    })
    window.history.replaceState(
      null,
      '',
      window.location.pathname + window.location.search,
    )
    return {
      project: {
        ...project,
        name: shared.name,
        generation: shared.generation,
        scales: hydratedScales,
      },
      projects: listProjects(store),
    }
  }
  const store = loadProjectsStore()
  return { project: getActiveProject(store), projects: listProjects(store) }
}

type CopyFormat = ScaleCopyFormat

function ScaleChecksBadge({ checks }: { checks: CheckResult[] }) {
  const errors = checks.filter((c) => !c.ok && c.level === 'error')
  const warnings = checks.filter((c) => !c.ok && c.level === 'warning')
  const [open, setOpen] = useState(false)
  let label = 'All roles ok'
  if (errors.length > 0) label = `${errors.length} role failed`
  else if (warnings.length > 0) label = `${warnings.length} note`
  const tone =
    errors.length > 0 ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'

  return (
    <div className="relative mt-1">
      <button
        type="button"
        className={cn(
          'type-caption min-h-8 outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
          tone,
        )}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {errors.length > 0 ? '✕ ' : warnings.length > 0 ? '⚠ ' : '✓ '}
        {label}
      </button>
      {open ? (
        <ul className="absolute left-0 z-20 mt-1 max-w-xs rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--bg)] p-2 shadow-[var(--material-shadow)]">
          {checks
            .filter((c) => !c.ok)
            .map((c) => (
              <li key={c.id} className="type-caption py-1 text-[var(--text)]">
                {c.message}
                {c.recommendation ? (
                  <span className="block text-[var(--text-muted)]">
                    {c.recommendation}
                  </span>
                ) : null}
              </li>
            ))}
          {checks.every((c) => c.ok) ? (
            <li className="type-caption text-[var(--text-muted)]">
              All role checks passed.
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  )
}

function ScaleEditor({
  scale,
  stepKeys,
  baseIndex,
  density,
  selectedStep,
  dragIndex,
  index,
  surfaceCss,
  preset,
  checks,
  onSelectStep,
  onOpenDetail,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  previewActive,
  onChange,
  onCopy,
  onRemove,
  onTogglePreview,
  onCopiedHex,
  onCopyFailed,
}: {
  scale: ColorScale
  stepKeys: string[]
  baseIndex: number
  density: RampDensity
  selectedStep: number | null
  dragIndex: number | null
  index: number
  surfaceCss: string
  preset: Preset
  checks: CheckResult[]
  onSelectStep: (index: number) => void
  onOpenDetail: () => void
  onDragStart: (index: number) => void
  onDragOver: (event: DragEvent, index: number) => void
  onDrop: (index: number) => void
  onDragEnd: () => void
  previewActive: boolean
  onChange: (
    patch: Partial<
      Pick<ColorScale, 'name' | 'baseColor' | 'system' | 'baseOverride'>
    >,
  ) => void
  onCopy: (format: CopyFormat) => void
  onRemove: () => void
  onTogglePreview: () => void
  onCopiedHex?: () => void
  onCopyFailed?: () => void
}) {
  const [hex, setHex] = useState(scale.baseColor)
  const [name, setName] = useState(scale.name)

  useEffect(() => {
    setHex(scale.baseColor)
  }, [scale.baseColor])

  useEffect(() => {
    setName(scale.name)
  }, [scale.name])

  return (
    <li
      id={`scale-${scale.id}`}
      draggable={false}
      onDragOver={(event) => onDragOver(event, index)}
      onDrop={() => onDrop(index)}
      className={cn(
        '@container flex min-w-0 scroll-mt-20 flex-col gap-4 rounded-[var(--radius-md)] py-1',
        dragIndex === index && 'opacity-50',
      )}
    >
      <div className="relative z-10 flex min-w-0 flex-col gap-3">
        <div className="flex min-w-0 items-center gap-1">
          <button
            type="button"
            draggable
            aria-label={`Reorder ${scale.name || scale.baseColor}`}
            className="hidden size-8 shrink-0 cursor-grab items-center justify-center rounded-full text-[var(--text-faint)] outline-none active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-[var(--ring)] tablet:inline-flex"
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = 'move'
              event.dataTransfer.setData('text/plain', String(index))
              onDragStart(index)
            }}
            onDragEnd={onDragEnd}
          >
            <GripVertical className="size-4" />
          </button>
          <div className="relative min-w-0 flex-1">
            <input
              value={name}
              onChange={(event) => {
                const next = event.target.value
                setName(next)
                onChange({ name: next })
              }}
              aria-label={`Name for ${scale.name || scale.baseColor}`}
              placeholder="Scale name"
              spellCheck={false}
              className="type-heading w-full min-w-0 border-b border-transparent bg-transparent pr-8 text-[var(--text)] outline-none placeholder:text-[var(--text-faint)] hover:border-[var(--line)] focus-visible:border-[var(--ring)]"
            />
            <Pencil
              className="pointer-events-none absolute right-0 top-1/2 size-3.5 -translate-y-1/2 text-[var(--text-faint)]"
              aria-hidden
            />
            <p className="type-caption mt-0.5 text-[var(--text-faint)]">
              {preset.baseRule.mode === 'none' ? (
                <>Nearest tone: {stepKeys[baseIndex] ?? '—'}</>
              ) : (
                <label className="inline-flex items-center gap-1">
                  Base on
                  <select
                    className="type-caption rounded-sm bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                    value={scale.baseOverride ?? ''}
                    aria-label="Base step"
                    onChange={(event) => {
                      const v = event.target.value
                      onChange({ baseOverride: v === '' ? null : v })
                    }}
                  >
                    <option value="">
                      {preset.baseRule.mode === 'fixed'
                        ? `${preset.baseRule.stepId} (${preset.label.replace(/-Schema$/, '')})`
                        : `Auto (${stepKeys[baseIndex] ?? '—'})`}
                    </option>
                    {preset.steps.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                        {preset.baseRule.mode === 'fixed' &&
                        preset.baseRule.stepId === s.id
                          ? ' · recommended'
                          : ''}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </p>
            {checks.length > 0 ? (
              <ScaleChecksBadge checks={checks} />
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="tablet:hidden"
            aria-label={`Open ${scale.name || scale.baseColor} detail`}
            onClick={onOpenDetail}
          >
            <ChevronRight />
          </Button>
          <div className="hidden tablet:block">
            <ScaleOverflowMenu
              previewActive={previewActive}
              onTogglePreview={onTogglePreview}
              onCopy={onCopy}
              onRemove={onRemove}
            />
          </div>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <label className="relative size-10 min-h-10 min-w-10 shrink-0 cursor-pointer overflow-hidden rounded-[var(--radius-sm)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--ring)]">
            <input
              type="color"
              value={scale.baseColor}
              onChange={(event) => onChange({ baseColor: event.target.value })}
              aria-label={`Edit base color ${scale.baseColor}`}
              className="absolute inset-0 size-[160%] -translate-x-1/4 -translate-y-1/4 cursor-pointer border-0 p-0"
            />
          </label>
          <input
            value={hex}
            onChange={(event) => {
              const next = event.target.value
              setHex(next)
              if (normalizeHex(next)) onChange({ baseColor: next })
            }}
            aria-label={`HEX for ${scale.baseColor}`}
            spellCheck={false}
            className="h-10 w-[7.5rem] shrink-0 rounded-full bg-[var(--chip)] px-3 type-mono text-[var(--text)] uppercase outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          />
          <SystemSwitch
            value={scale.system}
            baseColor={scale.baseColor}
            label={`System for ${scale.name || scale.baseColor}`}
            onValueChange={(system) => onChange({ system })}
          />
        </div>
      </div>
      <ColorScaleRow
        colors={scale.colors}
        stepKeys={stepKeys}
        baseIndex={baseIndex}
        density={density}
        selectedIndex={selectedStep}
        surfaceCss={surfaceCss}
        onSelectStep={onSelectStep}
        onCopiedHex={onCopiedHex}
        onCopyFailed={onCopyFailed}
      />
    </li>
  )
}

export function ColorGenerator() {
  const [boot] = useState(bootstrapProject)
  const [projectId, setProjectId] = useState(boot.project.id)
  const [projectName, setProjectName] = useState(boot.project.name)
  const [projects, setProjects] = useState<ProjectListItem[]>(boot.projects)
  const [settings, setSettings] = useState<GenerationSettings>(
    boot.project.generation,
  )
  const [activePreset, setActivePreset] = useState<Preset>(() => {
    const id = migrateLegacyToPresetId(
      boot.project.generation,
      boot.project.generation.presetId,
    )
    return resolvePreset(id) ?? getBuiltinPreset('tailwind')!
  })
  const [scales, setScales] = useState<ColorScale[]>(boot.project.scales)
  const [density, setDensity] = useState<RampDensity>(() => loadRampDensity())
  const [surface, setSurface] = useState<RampSurface>(() => loadRampSurface())
  const [generationOpen, setGenerationOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [adjustCollapsed, setAdjustCollapsed] = useState(false)
  const [mainTab, setMainTab] = useState<MainTab>('ramps')
  const [selected, setSelected] = useState<{
    scaleId: string
    stepIndex: number
  } | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [detailScaleId, setDetailScaleId] = useState<string | null>(null)
  const { announce } = useActionToast()
  const [previewId, setPreviewId] = useState<string | null>(null)
  const importRef = useRef<HTMLInputElement>(null)
  const baseColorTimer = useRef<number | null>(null)
  const skipPersist = useRef(false)

  const [tabScaleId, setTabScaleId] = useState<string | null>(null)
  const previewScale = scales.find((scale) => scale.id === previewId) ?? null
  const surfaceMeta = rampSurfaceMeta(surface)
  const selectedScale = selected
    ? scales.find((s) => s.id === selected.scaleId) ?? null
    : null
  const selectedHex =
    selectedScale && selected
      ? selectedScale.colors[selected.stepIndex] ?? null
      : null
  const detailScale = detailScaleId
    ? scales.find((s) => s.id === detailScaleId) ?? null
    : null
  const tabScale =
    scales.find((s) => s.id === (tabScaleId ?? previewId ?? scales[0]?.id)) ??
    scales[0] ??
    null
  const tabBaseIndex = tabScale
    ? baseIndexFor(tabScale.baseColor, settings, {
        preset: activePreset,
        baseOverride: tabScale.baseOverride ?? null,
      })
    : 0
  const tabStepKeys = tabScale
    ? stepKeysFor(settings, tabBaseIndex, activePreset)
    : stepKeysFor(settings, undefined, activePreset)
  const selectedBaseIndex = selectedScale
    ? baseIndexFor(selectedScale.baseColor, settings, {
        preset: activePreset,
        baseOverride: selectedScale.baseOverride ?? null,
      })
    : 0

  const openScaleDetail = (id: string) => {
    setDetailScaleId(id)
    window.history.pushState({ tintfieldDetail: id }, '')
  }

  const closeScaleDetail = () => {
    setDetailScaleId(null)
    if (window.history.state?.tintfieldDetail) {
      window.history.back()
    }
  }

  useEffect(() => {
    const onPop = () => {
      if (detailScaleId) setDetailScaleId(null)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [detailScaleId])

  const reorderScales = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return
    setScales((prev) => {
      if (from >= prev.length || to >= prev.length) return prev
      const next = [...prev]
      const [item] = next.splice(from, 1)
      if (!item) return prev
      next.splice(to, 0, item)
      return next
    })
  }

  useEffect(() => {
    if (!previewScale) {
      clearThemePreview()
      return
    }
    applyThemePreview(
      previewScale.colors,
      baseIndexFor(previewScale.baseColor, settings, {
        preset: activePreset,
        baseOverride: previewScale.baseOverride ?? null,
      }),
    )
    return () => clearThemePreview()
  }, [previewScale, settings, activePreset])

  useEffect(() => {
    if (previewId && !scales.some((scale) => scale.id === previewId)) {
      setPreviewId(null)
    }
  }, [scales, previewId])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === '\\') {
        event.preventDefault()
        setAdjustCollapsed((v) => !v)
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'e') {
        event.preventDefault()
        if (scales.length > 0) setExportOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [scales.length])

  const applyProject = (project: HydratedProject, store: ProjectsStore) => {
    skipPersist.current = true
    setProjectId(project.id)
    setProjectName(project.name)
    setSettings(project.generation)
    const id = migrateLegacyToPresetId(
      project.generation,
      project.generation.presetId,
    )
    setActivePreset(resolvePreset(id) ?? getBuiltinPreset('tailwind')!)
    setScales(project.scales)
    setProjects(listProjects(store))
    setPreviewId(null)
    setSelected(null)
  }

  const flushActiveProject = () => {
    const store = saveActiveProjectSnapshot({
      id: projectId,
      name: projectName,
      scales,
      generation: settings,
    })
    setProjects(listProjects(store))
  }

  useEffect(() => {
    if (skipPersist.current) {
      skipPersist.current = false
      return
    }
    const store = saveActiveProjectSnapshot({
      id: projectId,
      name: projectName,
      scales,
      generation: settings,
    })
    setProjects(listProjects(store))
  }, [projectId, projectName, scales, settings])

  useEffect(
    () => () => {
      if (baseColorTimer.current != null) window.clearTimeout(baseColorTimer.current)
    },
    [],
  )

  const announceName = () => {
    if (baseColorTimer.current != null) window.clearTimeout(baseColorTimer.current)
    baseColorTimer.current = window.setTimeout(() => {
      announce('Name updated')
      baseColorTimer.current = null
    }, 450)
  }

  const announceBaseColor = () => {
    if (baseColorTimer.current != null) window.clearTimeout(baseColorTimer.current)
    baseColorTimer.current = window.setTimeout(() => {
      announce('Base color updated')
      baseColorTimer.current = null
    }, 450)
  }

  const handlePresetChange = (next: Preset) => {
    const prevPreset = activePreset
    const prevSettings = settings
    const prevScales = scales
    const nextSettings = normalizeGenerationSettings({
      ...settingsFromPreset(next),
      presetId: next.id,
    })
    setActivePreset(next)
    setSettings(nextSettings)
    setScales((current) =>
      recomputeScales(
        current.map((s) => ({
          ...s,
          baseOverride:
            s.baseOverride && next.steps.some((st) => st.id === s.baseOverride)
              ? s.baseOverride
              : null,
        })),
        nextSettings,
        next,
      ),
    )
    saveLastPresetId(next.id)
    sonnerToast(`Switched to ${next.label}`, {
      action: {
        label: 'Undo',
        onClick: () => {
          setActivePreset(prevPreset)
          setSettings(prevSettings)
          setScales(prevScales)
        },
      },
    })
  }

  const handleDensityChange = (next: RampDensity) => {
    setDensity(next)
    saveRampDensity(next)
  }

  const handleSurfaceChange = (next: RampSurface) => {
    setSurface(next)
    saveRampSurface(next)
  }

  const handleCreateProject = () => {
    flushActiveProject()
    const { store, project } = createProject('Untitled')
    applyProject(project, store)
    announce('Set created')
  }

  const handleSwitchProject = (id: string) => {
    if (id === projectId) return
    flushActiveProject()
    const result = switchProject(id)
    if (!result) return
    applyProject(result.project, result.store)
    announce('Set opened')
  }

  const handleDeleteProject = () => {
    const result = deleteProject(projectId)
    applyProject(result.project, result.store)
    announce('Set deleted')
  }

  const addScale = (
    baseColor: string,
    system: ColorSystem = 'saturated',
    presetId?: string,
  ) => {
    let preset = activePreset
    let nextSettings = settings
    if (presetId) {
      const resolved = resolvePreset(presetId)
      if (resolved) {
        preset = resolved
        nextSettings = normalizeGenerationSettings({
          ...settingsFromPreset(resolved),
          presetId: resolved.id,
        })
        setActivePreset(resolved)
        setSettings(nextSettings)
        saveLastPresetId(resolved.id)
      }
    }
    setScales((prev) => [
      ...prev,
      createScale(baseColor, system, nextSettings, preset),
    ])
    announce('Scale added')
  }

  const removeScale = (id: string) => {
    const removed = scales.find((scale) => scale.id === id)
    if (!removed) return
    const index = scales.findIndex((scale) => scale.id === id)
    setScales((prev) => prev.filter((scale) => scale.id !== id))
    if (previewId === id) setPreviewId(null)
    if (selected?.scaleId === id) setSelected(null)
    sonnerToast.success('Scale deleted', {
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: () => {
          setScales((prev) => {
            const next = [...prev]
            next.splice(Math.min(index, next.length), 0, removed)
            return next
          })
        },
      },
    })
  }

  const togglePreview = (id: string) => {
    const next = previewId === id ? null : id
    setPreviewId(next)
    announce(next ? 'Preview on' : 'Preview off')
  }

  const updateScale = (
    id: string,
    patch: Partial<
      Pick<ColorScale, 'name' | 'baseColor' | 'system' | 'baseOverride'>
    >,
  ) => {
    setScales((prev) =>
      prev.map((scale) => {
        if (scale.id !== id) return scale
        const baseColor = patch.baseColor
          ? (normalizeHex(patch.baseColor) ?? scale.baseColor)
          : scale.baseColor
        const system = patch.system ?? scale.system
        const name = patch.name ?? scale.name
        const baseOverride =
          patch.baseOverride !== undefined
            ? patch.baseOverride
            : (scale.baseOverride ?? null)
        const regenerated = createScale(
          baseColor,
          system,
          settings,
          activePreset,
          baseOverride,
        )
        return {
          ...scale,
          name,
          baseColor,
          system,
          baseOverride,
          colors: regenerated.colors,
          darkColors: regenerated.darkColors,
        }
      }),
    )
    if (patch.system) announce('System updated')
    if (patch.baseColor) announceBaseColor()
    if (patch.name !== undefined) announceName()
    if (patch.baseOverride !== undefined) announce('Base step updated')
  }

  const copyScale = async (scale: ColorScale, format: CopyFormat) => {
    const payload =
      format === 'json'
        ? scaleToJson(scale.colors, settings, activePreset)
        : format === 'css'
          ? `:root {\n${scaleToCssVars(scale.colors, 'color', settings, activePreset)}\n}`
          : scale.colors.join('\n')
    try {
      await navigator.clipboard.writeText(payload)
      navigator.vibrate?.(40)
      announce(
        format === 'json' ? 'JSON copied' : format === 'css' ? 'CSS copied' : 'HEX copied',
      )
    } catch {
      announce('Copy failed', 'error')
    }
  }

  const handleShare = async () => {
    const url = buildShareUrl({
      v: 1,
      name: projectName,
      generation: settings,
      scales: scales.map((s) => ({
        name: s.name,
        baseColor: s.baseColor,
        system: s.system,
      })),
    })
    try {
      const result = await shareOrCopyUrl(url)
      announce(result === 'shared' ? 'Shared' : 'Link copied')
    } catch (error) {
      if ((error as Error).name !== 'AbortError') announce('Share failed', 'error')
    }
  }

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as {
        name?: string
        generation?: GenerationSettings
        scales?: { name?: string; baseColor: string; system: ColorSystem }[]
      }
      if (!Array.isArray(parsed.scales) || parsed.scales.length === 0) {
        announce('Invalid JSON', 'error')
        return
      }
      const generation = normalizeGenerationSettings(parsed.generation)
      setProjectName(parsed.name?.trim() || projectName)
      setSettings(generation)
      setScales(
        parsed.scales.map((s) => ({
          ...createScale(s.baseColor, s.system, generation),
          name: s.name?.trim() || suggestScaleName(s.baseColor),
        })),
      )
      announce('Imported')
    } catch {
      announce('Import failed', 'error')
    }
  }

  const onCopiedHex = () => announce('Copied HEX')
  const onCopyFailed = () => announce('Copy failed', 'error')

  const renderGeneration = (opts?: {
    showDensity?: boolean
    hideTitle?: boolean
    rampPreviews?: boolean
  }) => (
    <GenerationSettingsPanel
      preset={activePreset}
      onPresetChange={handlePresetChange}
      density={density}
      onDensityChange={handleDensityChange}
      showDensity={opts?.showDensity ?? false}
      hideTitle={opts?.hideTitle}
      rampPreviews={
        opts?.rampPreviews
          ? scales.map((s) => ({
              id: s.id,
              name: s.name,
              colors: s.colors,
            }))
          : undefined
      }
    />
  )

  const showEntry = scales.length === 0

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--bg)] pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-14 w-full min-w-0 items-center gap-2 px-4 tablet:px-6 desktop:px-8">
          <p className="type-heading shrink-0">Tintfield</p>
          <ProjectSwitcher
            activeId={projectId}
            activeName={projectName}
            projects={projects}
            scales={scales.map((s) => ({
              id: s.id,
              name: s.name,
              baseColor: s.baseColor,
            }))}
            onCreate={handleCreateProject}
            onSwitch={handleSwitchProject}
            onDelete={handleDeleteProject}
            onRename={(name) => {
              setProjectName(name)
              announce('Set renamed')
            }}
            onFocusScale={(id) => {
              document.getElementById(`scale-${id}`)?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
              })
            }}
            onImport={() => importRef.current?.click()}
            className="min-w-0 flex-1"
          />
          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void handleImportFile(file)
              event.target.value = ''
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Share set"
            onClick={() => void handleShare()}
            disabled={scales.length === 0}
          >
            <Share2 />
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            aria-label="Export set"
            disabled={scales.length === 0}
            onClick={() => setExportOpen(true)}
            className="hidden tablet:inline-flex"
          >
            <Download />
            Export
          </Button>
          <SurfaceSwitcher value={surface} onChange={handleSurfaceChange} />
        </div>
      </header>

      {showEntry ? (
        <EntryState onStart={(hex, presetId) => addScale(hex, 'saturated', presetId)} />
      ) : (
        <main
          className={cn(
            'mx-auto flex w-full min-w-0 flex-1 flex-col gap-0',
            'desktop-plus:grid desktop-plus:grid-cols-[auto_minmax(0,1fr)_auto] desktop-plus:items-stretch',
          )}
        >
          {/* Adjust panel — desktop wide */}
          <aside
            className={cn(
              'hidden border-[var(--line)] desktop-plus:block',
              adjustCollapsed
                ? 'w-0 overflow-hidden border-0 p-0'
                : 'w-[280px] border-r px-5 py-6',
            )}
          >
            {!adjustCollapsed ? (
              <>
                {renderGeneration()}
                {previewScale || scales[0] ? (
                  <UiRampPreview
                    colors={(previewScale ?? scales[0]!).colors}
                    baseIndex={baseIndexFor(
                      (previewScale ?? scales[0]!).baseColor,
                      settings,
                      {
                        preset: activePreset,
                        baseOverride:
                          (previewScale ?? scales[0]!).baseOverride ?? null,
                      },
                    )}
                    preset={activePreset}
                    darkColors={(previewScale ?? scales[0]!).darkColors}
                  />
                ) : null}
              </>
            ) : null}
          </aside>

          {/* Main workspace */}
          <section
            className="flex min-h-0 min-w-0 flex-1 flex-col"
            style={{ backgroundColor: surfaceMeta.css, color: surfaceMeta.ink }}
          >
            <div
              className="flex flex-wrap items-center gap-2 border-b px-4 py-3 tablet:px-6"
              style={{ borderColor: 'color-mix(in oklab, currentColor 14%, transparent)' }}
            >
              {(
                [
                  ['ramps', 'Ramps'],
                  ['preview', 'Preview'],
                  ['contrast', 'Contrast'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMainTab(id)}
                  className={cn(
                    'type-label rounded-full px-3 py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
                    mainTab === id
                      ? 'bg-[var(--primary)] text-[var(--primary-ink)]'
                      : 'text-current opacity-70 hover:opacity-100',
                  )}
                >
                  {label}
                </button>
              ))}
              <div className="ml-auto hidden items-center gap-1 tablet:flex">
                {(['compact', 'detail'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleDensityChange(mode)}
                    className={cn(
                      'type-caption rounded-full px-2.5 py-1 capitalize outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
                      density === mode
                        ? 'bg-[var(--primary)] text-[var(--primary-ink)]'
                        : 'opacity-60 hover:opacity-100',
                    )}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 py-5 pb-24 tablet:px-6 tablet:pb-8 desktop:px-8">
              {mainTab === 'ramps' ? (
                <>
                  {density === 'detail' ? (
                    <ContrastLegend className="type-caption opacity-70" />
                  ) : null}
                  <ul className="flex flex-col gap-8">
                    {scales.map((scale, index) => {
                      const scaleBase = baseIndexFor(
                        scale.baseColor,
                        settings,
                        {
                          preset: activePreset,
                          baseOverride: scale.baseOverride ?? null,
                        },
                      )
                      const scaleKeys = stepKeysFor(
                        settings,
                        scaleBase,
                        activePreset,
                      )
                      const gen = generateFromPresetCached({
                        baseHex: scale.baseColor,
                        preset: activePreset,
                        chromaMode: scale.system,
                        baseOverride: scale.baseOverride ?? null,
                        theme: 'light',
                      })
                      return (
                      <ScaleEditor
                        key={scale.id}
                        scale={scale}
                        stepKeys={scaleKeys}
                        baseIndex={scaleBase}
                        density={density}
                        index={index}
                        dragIndex={dragIndex}
                        surfaceCss={surfaceMeta.css}
                        preset={activePreset}
                        checks={gen.checks}
                        selectedStep={
                          selected?.scaleId === scale.id
                            ? selected.stepIndex
                            : null
                        }
                        onSelectStep={(stepIndex) =>
                          setSelected({ scaleId: scale.id, stepIndex })
                        }
                        onOpenDetail={() => openScaleDetail(scale.id)}
                        onDragStart={(from) => setDragIndex(from)}
                        onDragOver={(event, overIndex) => {
                          event.preventDefault()
                          event.dataTransfer.dropEffect = 'move'
                          if (dragIndex == null || dragIndex === overIndex) return
                        }}
                        onDrop={(to) => {
                          if (dragIndex == null) return
                          reorderScales(dragIndex, to)
                          setDragIndex(null)
                          announce('Order updated')
                        }}
                        onDragEnd={() => setDragIndex(null)}
                        previewActive={previewId === scale.id}
                        onChange={(patch) => updateScale(scale.id, patch)}
                        onCopy={(format) => copyScale(scale, format)}
                        onRemove={() => removeScale(scale.id)}
                        onTogglePreview={() => togglePreview(scale.id)}
                        onCopiedHex={onCopiedHex}
                        onCopyFailed={onCopyFailed}
                      />
                      )
                    })}
                  </ul>
                  <NewScaleForm onAdd={addScale} />
                </>
              ) : null}

              {mainTab === 'preview' && tabScale ? (
                <div className="flex flex-col gap-4">
                  <label className="flex max-w-xs flex-col gap-1.5">
                    <span className="type-caption text-current opacity-60">
                      Primary
                    </span>
                    <select
                      className="type-label h-9 rounded-full border border-current/20 bg-transparent px-3 outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                      value={tabScale.id}
                      onChange={(event) => setTabScaleId(event.target.value)}
                      aria-label="Primary scale for preview"
                    >
                      {scales.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name || s.baseColor}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="grid gap-6 tablet:grid-cols-2">
                    <div className="rounded-[var(--radius-md)] bg-white p-5 text-black">
                      <p className="type-caption mb-3 opacity-60">Light</p>
                      <UiRampPreview
                        colors={tabScale.colors}
                        baseIndex={tabBaseIndex}
                        preset={activePreset}
                        className="mt-0 border-0 pt-0"
                      />
                    </div>
                    <div className="rounded-[var(--radius-md)] bg-[#121212] p-5 text-white">
                      <p className="type-caption mb-3 opacity-60">Dark</p>
                      <UiRampPreview
                        colors={tabScale.darkColors ?? tabScale.colors}
                        baseIndex={tabBaseIndex}
                        preset={activePreset}
                        darkColors={tabScale.darkColors}
                        className="mt-0 border-0 pt-0"
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {mainTab === 'contrast' && tabScale ? (
                <div className="flex flex-col gap-4">
                  <label className="flex max-w-xs flex-col gap-1.5">
                    <span className="type-caption opacity-60">Scale</span>
                    <select
                      className="type-label h-9 rounded-full border border-current/20 bg-transparent px-3 outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                      value={tabScale.id}
                      onChange={(event) => setTabScaleId(event.target.value)}
                      aria-label="Scale for contrast table"
                    >
                      {scales.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name || s.baseColor}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="overflow-x-auto">
                    <table className="type-caption w-full border-collapse text-left">
                      <thead>
                        <tr>
                          <th className="p-2 opacity-60">Step</th>
                          <th className="p-2 opacity-60">White</th>
                          <th className="p-2 opacity-60">Black</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tabScale.colors.map((hex, i) => {
                          const c = contrastAgainstWhiteAndBlack(hex)
                          return (
                            <tr
                              key={tabStepKeys[i]}
                              className="border-t border-current/10"
                            >
                              <td className="p-2">
                                <span
                                  className="mr-2 inline-block size-4 rounded-sm align-middle"
                                  style={{ backgroundColor: hex }}
                                />
                                {tabStepKeys[i]}
                              </td>
                              <td className="p-2">
                                <span className="type-label">{c.onWhite.mark}</span>
                              </td>
                              <td className="p-2">
                                <span className="type-label">{c.onBlack.mark}</span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          {/* Inspector — wide desktop; collapsed when empty */}
          <aside
            className={cn(
              'hidden border-l border-[var(--line)] bg-[var(--bg)] text-[var(--text)] desktop-plus:block',
              selectedHex ? 'w-[280px] px-5 py-6' : 'w-0 overflow-hidden border-0 p-0',
            )}
          >
            {selectedScale && selectedHex && selected ? (
              <StepInspector
                hex={selectedHex}
                step={
                  stepKeysFor(settings, selectedBaseIndex, activePreset)[
                    selected.stepIndex
                  ] ?? String(selected.stepIndex)
                }
                isBase={selected.stepIndex === selectedBaseIndex}
                neighbors={selectedScale.colors}
                stepIndex={selected.stepIndex}
                stepCount={selectedScale.colors.length}
                onStepChange={(stepIndex) =>
                  setSelected({ scaleId: selected.scaleId, stepIndex })
                }
                onClose={() => setSelected(null)}
                onCopy={(text, label) => {
                  void navigator.clipboard.writeText(text).then(
                    () => announce(`${label} copied`),
                    () => announce('Copy failed', 'error'),
                  )
                }}
              />
            ) : null}
          </aside>
        </main>
      )}

      {/* Mobile / tablet adjust sheet */}
      <MobileSheet
        open={generationOpen}
        title="Adjust"
        maxHeightClass="max-h-[55svh]"
        onClose={() => setGenerationOpen(false)}
      >
        {renderGeneration({
          showDensity: false,
          hideTitle: true,
          rampPreviews: true,
        })}
      </MobileSheet>

      {/* Mobile bottom bar */}
      {!showEntry ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--line)] bg-[var(--bg)] pb-[env(safe-area-inset-bottom)] tablet:hidden">
          <div className="mx-auto flex h-12 max-w-lg items-stretch gap-2 px-4 py-0">
            <Button
              type="button"
              variant="secondary"
              className="h-12 flex-1 rounded-none"
              onClick={() => setGenerationOpen(true)}
            >
              <SlidersHorizontal />
              Adjust
            </Button>
            <Button
              type="button"
              variant="default"
              className="h-12 flex-1 rounded-none"
              onClick={() => setExportOpen(true)}
            >
              <Download />
              Export
            </Button>
          </div>
        </div>
      ) : null}

      {/* Inspector sheet below desktop-plus */}
      {selectedScale && selectedHex && selected ? (
        <div className="desktop-plus:hidden">
          <MobileSheet
            open
            title="Inspector"
            maxHeightClass="max-h-[min(70svh,36rem)]"
            onClose={() => setSelected(null)}
          >
            <StepInspector
              hex={selectedHex}
              step={
                stepKeysFor(settings, selectedBaseIndex, activePreset)[
                  selected.stepIndex
                ] ?? String(selected.stepIndex)
              }
              isBase={selected.stepIndex === selectedBaseIndex}
              neighbors={selectedScale.colors}
              stepIndex={selected.stepIndex}
              stepCount={selectedScale.colors.length}
              onStepChange={(stepIndex) =>
                setSelected({ scaleId: selected.scaleId, stepIndex })
              }
              onCopy={(text, label) => {
                void navigator.clipboard.writeText(text).then(
                  () => announce(`${label} copied`),
                  () => announce('Copy failed', 'error'),
                )
              }}
            />
          </MobileSheet>
        </div>
      ) : null}

      {detailScale ? (
        <MobileScaleDetail
          name={detailScale.name}
          baseColor={detailScale.baseColor}
          system={detailScale.system}
          colors={detailScale.colors}
          stepKeys={stepKeysFor(
            settings,
            baseIndexFor(detailScale.baseColor, settings, {
              preset: activePreset,
              baseOverride: detailScale.baseOverride ?? null,
            }),
            activePreset,
          )}
          baseIndex={baseIndexFor(detailScale.baseColor, settings, {
            preset: activePreset,
            baseOverride: detailScale.baseOverride ?? null,
          })}
          onBack={closeScaleDetail}
          onChange={(patch) => updateScale(detailScale.id, patch)}
          onCopyHex={(hex) => {
            void navigator.clipboard.writeText(hex.toUpperCase()).then(
              () => {
                navigator.vibrate?.(40)
                onCopiedHex()
              },
              () => onCopyFailed(),
            )
          }}
          onInspect={(stepIndex) => {
            setSelected({ scaleId: detailScale.id, stepIndex })
          }}
          onDelete={() => {
            closeScaleDetail()
            removeScale(detailScale.id)
          }}
        />
      ) : null}

      <ExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        setName={projectName}
        scales={scales}
        settings={settings}
        preset={activePreset}
        projectJson={projectToJson(projectName, scales, settings)}
        onCopied={(label) => announce(label === 'Exported' ? 'Exported' : `${label} copied`)}
        onFailed={() => announce('Copy failed', 'error')}
      />
    </div>
  )
}
