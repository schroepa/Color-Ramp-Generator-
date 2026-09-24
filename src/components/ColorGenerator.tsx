import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Copy, Download, Plus, Trash2 } from 'lucide-react'
import { ColorScaleRow } from '@/components/ColorScaleRow'
import { GenerationSettingsPanel } from '@/components/GenerationSettingsPanel'
import { ProjectSwitcher } from '@/components/ProjectSwitcher'
import { SystemSwitch } from '@/components/SystemSwitch'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Stage, Surface } from '@/components/ui/surface'
import { AppTooltip } from '@/components/ui/tooltip'
import AnimatedInput from '@/components/ui/smoothui/animated-input'
import BasicToast from '@/components/ui/smoothui/basic-toast'
import { useActionToast } from '@/hooks/use-action-toast'
import {
  baseStepIndex,
  type ColorSystem,
  generateScaleColors,
  normalizeHex,
  scaleToCssVars,
  scaleToJson,
  stepKeysFor,
} from '@/lib/color-system'
import {
  type GenerationSettings,
  normalizeGenerationSettings,
} from '@/lib/generation-settings'
import { applyThemePreview, clearThemePreview } from '@/lib/theme-preview'
import {
  type HydratedProject,
  type ProjectListItem,
  type ProjectsStore,
  createProject,
  deleteProject,
  downloadProjectJson,
  getActiveProject,
  listProjects,
  loadProjectsStore,
  projectToJson,
  renameProject,
  saveActiveProjectSnapshot,
  switchProject,
} from '@/lib/projects'

export type ColorScale = {
  id: string
  baseColor: string
  system: ColorSystem
  colors: string[]
}

function createScale(
  baseColor = '#0d7377',
  system: ColorSystem = 'saturated',
  settings: GenerationSettings,
): ColorScale {
  const hex = normalizeHex(baseColor) ?? '#0d7377'
  return {
    id: crypto.randomUUID(),
    baseColor: hex,
    system,
    colors: generateScaleColors(hex, system, settings),
  }
}

function recomputeScales(
  scales: ColorScale[],
  settings: GenerationSettings,
): ColorScale[] {
  return scales.map((scale) => ({
    ...scale,
    colors: generateScaleColors(scale.baseColor, scale.system, settings),
  }))
}

function bootstrapProject(): {
  project: HydratedProject
  projects: ProjectListItem[]
} {
  const store = loadProjectsStore()
  return { project: getActiveProject(store), projects: listProjects(store) }
}

type CopyFormat = 'json' | 'css' | 'hex'

const COPY_ACTIONS: {
  format: CopyFormat
  label: string
  tooltip: string
  ariaLabel: string
}[] = [
  { format: 'json', label: 'JSON', tooltip: 'Copy as JSON', ariaLabel: 'Copy scale as JSON' },
  { format: 'css', label: 'CSS', tooltip: 'Copy as CSS', ariaLabel: 'Copy scale as CSS' },
  { format: 'hex', label: 'HEX', tooltip: 'Copy as HEX', ariaLabel: 'Copy scale as HEX' },
]

export function ColorGenerator() {
  const pickerId = useId()
  const [draftColor, setDraftColor] = useState('#0d7377')
  const [draftSystem, setDraftSystem] = useState<ColorSystem>('saturated')
  const [boot] = useState(bootstrapProject)
  const [projectId, setProjectId] = useState(boot.project.id)
  const [projectName, setProjectName] = useState(boot.project.name)
  const [projects, setProjects] = useState<ProjectListItem[]>(boot.projects)
  const [settings, setSettings] = useState<GenerationSettings>(
    boot.project.generation,
  )
  const [scales, setScales] = useState<ColorScale[]>(boot.project.scales)
  const { toast, announce, clear } = useActionToast()
  const [preview, setPreview] = useState(false)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const baseColorTimer = useRef<number | null>(null)
  const settingsTimer = useRef<number | null>(null)
  const skipPersist = useRef(false)

  const stepKeys = useMemo(() => stepKeysFor(settings), [settings])
  const baseIndex = useMemo(() => baseStepIndex(settings), [settings])
  const previewScale = scales.find((scale) => scale.id === previewId) ?? null

  useEffect(() => {
    if (!preview || !previewScale) {
      clearThemePreview()
      return
    }
    applyThemePreview(previewScale.colors, baseIndex)
    return () => clearThemePreview()
  }, [preview, previewScale, baseIndex])

  const applyProject = (project: HydratedProject, store: ProjectsStore) => {
    skipPersist.current = true
    setProjectId(project.id)
    setProjectName(project.name)
    setSettings(project.generation)
    setScales(project.scales)
    setProjects(listProjects(store))
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
      if (baseColorTimer.current != null) {
        window.clearTimeout(baseColorTimer.current)
      }
      if (settingsTimer.current != null) {
        window.clearTimeout(settingsTimer.current)
      }
    },
    [],
  )

  const draftHex = normalizeHex(draftColor) ?? '#0d7377'
  const draftPreview = useMemo(
    () => generateScaleColors(draftHex, draftSystem, settings),
    [draftHex, draftSystem, settings],
  )

  const announceBaseColor = () => {
    if (baseColorTimer.current != null) {
      window.clearTimeout(baseColorTimer.current)
    }
    baseColorTimer.current = window.setTimeout(() => {
      announce('Base color updated')
      baseColorTimer.current = null
    }, 450)
  }

  const announceSettingsUpdated = () => {
    if (settingsTimer.current != null) {
      window.clearTimeout(settingsTimer.current)
    }
    settingsTimer.current = window.setTimeout(() => {
      announce('Settings updated')
      settingsTimer.current = null
    }, 450)
  }

  const handleSettingsChange = (patch: Partial<GenerationSettings>) => {
    setSettings((prev) => {
      const next = normalizeGenerationSettings({ ...prev, ...patch })
      setScales((current) => recomputeScales(current, next))
      return next
    })
    announceSettingsUpdated()
  }

  const handleCreateProject = () => {
    flushActiveProject()
    const { store, project } = createProject('Untitled')
    applyProject(project, store)
    announce('Project created')
  }

  const handleRenameProject = () => {
    const next = window.prompt('Rename project', projectName)
    if (next == null) return
    const result = renameProject(projectId, next)
    if (!result) return
    setProjectName(result.project.name)
    setProjects(listProjects(result.store))
    announce('Project renamed')
  }

  const handleSwitchProject = (id: string) => {
    if (id === projectId) return
    flushActiveProject()
    const result = switchProject(id)
    if (!result) return
    applyProject(result.project, result.store)
    announce('Project opened')
  }

  const handleDeleteProject = () => {
    const result = deleteProject(projectId)
    applyProject(result.project, result.store)
    announce('Project deleted')
  }

  const handleHexChange = (value: string) => {
    const normalized = normalizeHex(value)
    setDraftColor(normalized ?? value)
    if (normalized) announceBaseColor()
  }

  const handleDraftPicker = (value: string) => {
    setDraftColor(value)
    announceBaseColor()
  }

  const handleDraftSystem = (system: ColorSystem) => {
    setDraftSystem(system)
    announce('System updated')
  }

  const addScale = () => {
    setScales((prev) => [...prev, createScale(draftHex, draftSystem, settings)])
    announce('Scale added')
  }

  const removeScale = (id: string) => {
    setScales((prev) => prev.filter((scale) => scale.id !== id))
    announce('Scale removed')
  }

  const updateScale = (
    id: string,
    patch: Partial<Pick<ColorScale, 'baseColor' | 'system'>>,
  ) => {
    setScales((prev) =>
      prev.map((scale) => {
        if (scale.id !== id) return scale
        const baseColor = patch.baseColor
          ? (normalizeHex(patch.baseColor) ?? scale.baseColor)
          : scale.baseColor
        const system = patch.system ?? scale.system
        return {
          ...scale,
          baseColor,
          system,
          colors: generateScaleColors(baseColor, system, settings),
        }
      }),
    )
    if (patch.system) announce('System updated')
    if (patch.baseColor) announceBaseColor()
  }

  const copyScale = async (scale: ColorScale, format: CopyFormat) => {
    const payload =
      format === 'json'
        ? scaleToJson(scale.colors, settings)
        : format === 'css'
          ? `:root {\n${scaleToCssVars(scale.colors, 'color', settings)}\n}`
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

  const copyAllPalettes = async () => {
    try {
      await navigator.clipboard.writeText(
        projectToJson(projectName, scales, settings),
      )
      navigator.vibrate?.(40)
      announce('JSON copied')
    } catch {
      announce('Copy failed', 'error')
    }
  }

  const exportPalettes = () => {
    downloadProjectJson(projectName, scales, settings)
    announce('Exported')
  }

  const onCopiedHex = () => announce('Copied HEX')
  const onCopyFailed = () => announce('Copy failed', 'error')

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--bg)]">
        <div className="mx-auto flex h-14 w-full max-w-[90rem] items-center gap-2 px-4 tablet:gap-3 tablet:px-6 desktop:px-8">
          <p className="type-heading shrink-0 truncate">Tintfield</p>

          <ProjectSwitcher
            className="min-w-0 flex-1 justify-end tablet:justify-center"
            activeId={projectId}
            activeName={projectName}
            projects={projects}
            onCreate={handleCreateProject}
            onRename={handleRenameProject}
            onSwitch={handleSwitchProject}
            onDelete={handleDeleteProject}
          />

          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant={preview ? 'secondary' : 'ghost'}
              size="sm"
              aria-pressed={preview}
              disabled={scales.length === 0}
              aria-label={preview ? 'Turn preview off' : 'Preview the interface with a scale'}
              onClick={() => {
                setPreview((on) => {
                  const next = !on
                  if (next) {
                    setPreviewId((current) =>
                      scales.some((scale) => scale.id === current)
                        ? current
                        : (scales[0]?.id ?? null),
                    )
                  }
                  return next
                })
              }}
            >
              <span className="hidden tablet:inline">{preview ? 'Preview on' : 'Preview'}</span>
              <span className="tablet:hidden">{preview ? 'On' : 'Preview'}</span>
            </Button>
            {preview && scales.length > 0 && (
              <select
                aria-label="Scale used for the preview"
                value={previewScale?.id ?? scales[0]?.id}
                onChange={(event) => setPreviewId(event.target.value)}
                className="h-8 max-w-[7.5rem] rounded-full bg-[var(--chip)] px-2.5 type-label text-[var(--text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] tablet:max-w-[11rem]"
              >
                {scales.map((scale) => (
                  <option key={scale.id} value={scale.id}>
                    {scale.baseColor} · {scale.system}
                  </option>
                ))}
              </select>
            )}
            <AppTooltip content="Export active project as JSON">
              <Button
                type="button"
                variant="default"
                size="sm"
                disabled={scales.length === 0}
                aria-label="Export active project as JSON"
                onClick={exportPalettes}
              >
                <Download />
                <span className="hidden tablet:inline">Export</span>
              </Button>
            </AppTooltip>
            <AppTooltip content="Copy active project as JSON">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={scales.length === 0}
                aria-label="Copy active project as JSON"
                onClick={copyAllPalettes}
              >
                <Copy />
                <span className="hidden tablet:inline">Copy</span>
              </Button>
            </AppTooltip>
          </div>
        </div>
      </header>

      <main
        className={
          'mx-auto flex w-full max-w-[90rem] flex-1 flex-col gap-5 px-4 py-5 ' +
          'tablet:gap-6 tablet:px-6 tablet:py-6 desktop:grid ' +
          'desktop:grid-cols-[minmax(17.5rem,22rem)_minmax(0,1fr)] desktop:items-start ' +
          'desktop:gap-6 desktop:px-8 desktop:py-6 ' +
          'desktop-plus:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)] desktop-plus:gap-8'
        }
      >
        {/* Editor column: composer + generation knobs */}
        <aside
          className={
            'scrollbar-quiet flex flex-col gap-4 ' +
            'desktop:sticky desktop:top-[calc(3.5rem+1.5rem)] ' +
            'desktop:max-h-[calc(100svh-3.5rem-3rem)] desktop:overflow-y-auto ' +
            'desktop:overscroll-contain'
          }
        >
          <Surface aria-label="Composer">
            <div className="flex flex-col gap-4">
              <div className="flex items-end gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor={pickerId}>Base</Label>
                  <label className="relative size-9 min-h-8 min-w-8 cursor-pointer overflow-hidden rounded-full shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--ring)]">
                    <input
                      id={pickerId}
                      type="color"
                      value={draftHex}
                      onChange={(event) => handleDraftPicker(event.target.value)}
                      aria-label="Pick base color"
                      className="absolute inset-0 size-[160%] -translate-x-1/4 -translate-y-1/4 cursor-pointer border-0 p-0"
                    />
                  </label>
                </div>
                <div className="min-w-0 flex-1">
                  <AnimatedInput
                    label="HEX"
                    value={draftColor}
                    onChange={handleHexChange}
                    aria-label="Base color HEX"
                    spellCheck={false}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label>System</Label>
                <SystemSwitch value={draftSystem} onValueChange={handleDraftSystem} />
              </div>

              <Button type="button" onClick={addScale} className="w-full">
                <Plus />
                Add scale
              </Button>
            </div>

            <Stage className="mt-4">
              <ColorScaleRow
                colors={draftPreview}
                stepKeys={stepKeys}
                baseIndex={baseIndex}
                onCopiedHex={onCopiedHex}
                onCopyFailed={onCopyFailed}
              />
            </Stage>
          </Surface>

          <GenerationSettingsPanel
            settings={settings}
            onChange={handleSettingsChange}
          />
        </aside>

        {/* Scales: main view */}
        <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
          <h2 className="type-heading">
            {scales.length === 0
              ? 'Scales'
              : `${scales.length} scale${scales.length === 1 ? '' : 's'}`}
          </h2>

          {scales.length === 0 ? (
            <p className="type-body text-[var(--text-muted)]">
              Pick a base color and add your first scale.
            </p>
          ) : (
            <ul className="flex flex-col gap-2.5 pb-4 desktop:gap-2">
              {scales.map((scale) => (
                <Surface as="li" key={scale.id} inset>
                  <div className="mb-2.5 flex flex-col gap-2 tablet:flex-row tablet:flex-wrap tablet:items-center tablet:justify-between">
                    <div className="flex min-w-0 flex-wrap items-center gap-2.5">
                      <label className="relative size-8 min-h-8 min-w-8 shrink-0 cursor-pointer overflow-hidden rounded-full shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--ring)]">
                        <input
                          type="color"
                          value={scale.baseColor}
                          onChange={(event) =>
                            updateScale(scale.id, { baseColor: event.target.value })
                          }
                          aria-label={`Edit base color ${scale.baseColor}`}
                          className="absolute inset-0 size-[160%] -translate-x-1/4 -translate-y-1/4 cursor-pointer border-0 p-0"
                        />
                      </label>
                      <span className="type-mono text-[var(--text)] uppercase">
                        {scale.baseColor}
                      </span>
                      <SystemSwitch
                        value={scale.system}
                        label={`System for ${scale.baseColor}`}
                        onValueChange={(system) => updateScale(scale.id, { system })}
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {COPY_ACTIONS.map((action) => (
                        <AppTooltip key={action.format} content={action.tooltip}>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            aria-label={action.ariaLabel}
                            onClick={() => copyScale(scale, action.format)}
                          >
                            {action.label}
                          </Button>
                        </AppTooltip>
                      ))}
                      <AppTooltip content="Delete scale">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Delete scale ${scale.baseColor}`}
                          onClick={() => removeScale(scale.id)}
                        >
                          <Trash2 />
                        </Button>
                      </AppTooltip>
                    </div>
                  </div>
                  <ColorScaleRow
                    colors={scale.colors}
                    stepKeys={stepKeys}
                    baseIndex={baseIndex}
                    onCopiedHex={onCopiedHex}
                    onCopyFailed={onCopyFailed}
                  />
                </Surface>
              ))}
            </ul>
          )}
        </section>
      </main>

      {toast ? (
        <BasicToast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={3000}
          onClose={clear}
          className="!top-auto bottom-4 left-4 right-auto sm:left-4"
        />
      ) : null}
    </div>
  )
}
