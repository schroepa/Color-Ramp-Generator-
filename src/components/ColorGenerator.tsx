import { useEffect, useMemo, useRef, useState } from 'react'
import { Copy, Download, Plus, Trash2 } from 'lucide-react'
import { ColorScaleRow } from '@/components/ColorScaleRow'
import { GenerationSettingsPanel } from '@/components/GenerationSettingsPanel'
import { ProjectSwitcher } from '@/components/ProjectSwitcher'
import { SystemSwitch } from '@/components/SystemSwitch'
import { Button } from '@/components/ui/button'
import { AppTooltip } from '@/components/ui/tooltip'
import BasicToast from '@/components/ui/smoothui/basic-toast'
import Select from '@/components/ui/smoothui/select'
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
  name: string
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
    name: '',
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

function ScaleEditor({
  scale,
  stepKeys,
  baseIndex,
  onChange,
  onCopy,
  onRemove,
  onCopiedHex,
  onCopyFailed,
}: {
  scale: ColorScale
  stepKeys: string[]
  baseIndex: number
  onChange: (patch: Partial<Pick<ColorScale, 'name' | 'baseColor' | 'system'>>) => void
  onCopy: (format: CopyFormat) => void
  onRemove: () => void
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
    <li className="flex min-w-0 flex-col gap-4 border-t border-[var(--line)] py-5">
      <div className="relative z-10 flex min-w-0 flex-col gap-2 tablet:flex-row tablet:flex-wrap tablet:items-center">
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 tablet:flex tablet:flex-wrap">
          <input
            value={name}
            onChange={(event) => {
              const next = event.target.value
              setName(next)
              onChange({ name: next })
            }}
            aria-label={`Name for ${scale.name || scale.baseColor}`}
            placeholder="Name"
            spellCheck={false}
            className="h-8 min-w-0 rounded-full bg-[var(--chip)] px-3 type-label text-[var(--text)] outline-none placeholder:text-[var(--text-faint)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] tablet:w-[7.5rem]"
          />
          <label className="relative size-8 min-h-8 min-w-8 shrink-0 cursor-pointer overflow-hidden rounded-full shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--ring)]">
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
            className="h-8 min-w-0 rounded-full bg-[var(--chip)] px-3 type-mono text-[var(--text)] uppercase outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] tablet:w-[7.5rem]"
          />
        </div>
        <SystemSwitch
          value={scale.system}
          label={`System for ${scale.baseColor}`}
          onValueChange={(system) => onChange({ system })}
          className="w-full tablet:w-[280px]"
        />
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-1.5 tablet:flex tablet:flex-wrap [&>span]:w-full [&>span]:min-w-0 tablet:[&>span]:w-auto">
          {COPY_ACTIONS.map((action) => (
            <AppTooltip key={action.format} content={action.tooltip}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                aria-label={action.ariaLabel}
                className="w-full tablet:w-auto"
                onClick={() => onCopy(action.format)}
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
              onClick={onRemove}
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

  const announceName = () => {
    if (baseColorTimer.current != null) {
      window.clearTimeout(baseColorTimer.current)
    }
    baseColorTimer.current = window.setTimeout(() => {
      announce('Name updated')
      baseColorTimer.current = null
    }, 450)
  }

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

  const addScale = () => {
    setScales((prev) => [...prev, createScale(undefined, undefined, settings)])
    announce('Scale added')
  }

  const removeScale = (id: string) => {
    setScales((prev) => prev.filter((scale) => scale.id !== id))
    announce('Scale removed')
  }

  const updateScale = (
    id: string,
    patch: Partial<Pick<ColorScale, 'name' | 'baseColor' | 'system'>>,
  ) => {
    setScales((prev) =>
      prev.map((scale) => {
        if (scale.id !== id) return scale
        const baseColor = patch.baseColor
          ? (normalizeHex(patch.baseColor) ?? scale.baseColor)
          : scale.baseColor
        const system = patch.system ?? scale.system
        const name = patch.name ?? scale.name
        return {
          ...scale,
          name,
          baseColor,
          system,
          colors: generateScaleColors(baseColor, system, settings),
        }
      }),
    )
    if (patch.system) announce('System updated')
    if (patch.baseColor) announceBaseColor()
    if (patch.name !== undefined) announceName()
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
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--bg)] pt-[env(safe-area-inset-top)]">
        <div className="mx-auto grid w-full max-w-[90rem] min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-2 px-4 py-2.5 tablet:flex tablet:h-14 tablet:gap-3 tablet:px-6 tablet:py-0 desktop:px-8">
          <p className="type-heading shrink-0">Tintfield</p>

          <ProjectSwitcher
            activeId={projectId}
            activeName={projectName}
            projects={projects}
            onCreate={handleCreateProject}
            onRename={handleRenameProject}
            onSwitch={handleSwitchProject}
            onDelete={handleDeleteProject}
          />

          <div className="col-start-3 row-start-1 tablet:col-auto tablet:row-auto">
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
          </div>

          <div className="contents">
            <Button
              type="button"
              variant={preview ? 'secondary' : 'ghost'}
              size="sm"
              aria-pressed={preview}
              disabled={scales.length === 0}
              aria-label={preview ? 'Turn preview off' : 'Preview the interface with a scale'}
              className="col-start-2 row-start-2 justify-self-end tablet:col-auto tablet:row-auto"
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
              {preview ? 'Preview on' : 'Preview'}
            </Button>
            {preview && scales.length > 0 && (
              <div className="col-span-3 row-start-3 min-w-0 tablet:col-auto tablet:row-auto tablet:w-[11rem] [&>div]:w-full">
                <Select
                  aria-label="Scale used for the preview"
                  size="sm"
                  value={previewScale?.id ?? scales[0]?.id}
                  onValueChange={setPreviewId}
                  className="h-8 w-full"
                options={scales.map((scale) => ({
                  value: scale.id,
                  label: scale.name.trim() || scale.baseColor,
                  swatch: scale.colors[baseIndex] ?? scale.baseColor,
                }))}
                />
              </div>
            )}
            <div className="col-start-3 row-start-2 tablet:col-auto tablet:row-auto">
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
        </div>
      </header>

      <main
        className={
          'mx-auto flex w-full min-w-0 max-w-[90rem] flex-1 flex-col gap-5 px-4 py-5 ' +
          'tablet:gap-6 tablet:px-6 tablet:py-6 desktop:grid ' +
          'desktop:grid-cols-[minmax(17.5rem,22rem)_minmax(0,1fr)] desktop:items-start ' +
          'desktop:gap-6 desktop:px-8 desktop:py-6 ' +
          'desktop-plus:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)] desktop-plus:gap-8'
        }
      >
        <aside
          className={
            'scrollbar-quiet min-w-0 ' +
            'desktop:sticky desktop:top-[calc(3.5rem+1.5rem)] ' +
            'desktop:max-h-[calc(100svh-3.5rem-3rem)] desktop:overflow-y-auto ' +
            'desktop:overscroll-contain'
          }
        >
          <GenerationSettingsPanel
            settings={settings}
            onChange={handleSettingsChange}
          />
        </aside>

        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between gap-3">
            <h2 className="type-heading">
              {scales.length === 0
                ? 'Scales'
                : `${scales.length} scale${scales.length === 1 ? '' : 's'}`}
            </h2>
            <Button type="button" size="sm" onClick={addScale}>
              <Plus />
              Add scale
            </Button>
          </div>

          {scales.length === 0 ? (
            <p className="type-body mt-4 text-[var(--text-muted)]">
              Add a scale, then edit its base color.
            </p>
          ) : (
            <ul>
              {scales.map((scale) => (
                <ScaleEditor
                  key={scale.id}
                  scale={scale}
                  stepKeys={stepKeys}
                  baseIndex={baseIndex}
                  onChange={(patch) => updateScale(scale.id, patch)}
                  onCopy={(format) => copyScale(scale, format)}
                  onRemove={() => removeScale(scale.id)}
                  onCopiedHex={onCopiedHex}
                  onCopyFailed={onCopyFailed}
                />
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
          className="!top-auto bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 right-4 max-w-none tablet:right-auto tablet:w-80"
        />
      ) : null}
    </div>
  )
}
