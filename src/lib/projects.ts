import {
  type ColorSystem,
  generateScaleColors,
  normalizeHex,
} from '@/lib/color-system'
import {
  DEFAULT_GENERATION_SETTINGS,
  GENERATION_STORAGE_KEY,
  type GenerationSettings,
  loadGenerationSettings,
  normalizeGenerationSettings,
} from '@/lib/generation-settings'
import {
  PALETTE_STORAGE_KEY,
  type PersistedPalette,
  type ScaleLike,
  hydrateScale,
  toPaletteExport,
} from '@/lib/palette-storage'

export const PROJECTS_STORAGE_KEY = 'tintfield.projects.v1'

const VALID_SYSTEMS = new Set<ColorSystem>(['saturated', 'fade', 'pale'])

export type PersistedProject = {
  id: string
  name: string
  updatedAt: string
  scales: PersistedPalette[]
  generation: GenerationSettings
}

export type ProjectsStore = {
  version: 1
  activeId: string
  projects: PersistedProject[]
}

export type ProjectListItem = {
  id: string
  name: string
  updatedAt: string
}

export type HydratedProject = {
  id: string
  name: string
  updatedAt: string
  scales: ScaleLike[]
  generation: GenerationSettings
}

export type ProjectExport = {
  name: string
  generation: GenerationSettings
  scales: ReturnType<typeof toPaletteExport>[]
}

function isPersistedPalette(value: unknown): value is PersistedPalette {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return (
    typeof item.id === 'string' &&
    typeof item.baseColor === 'string' &&
    typeof item.system === 'string' &&
    VALID_SYSTEMS.has(item.system as ColorSystem)
  )
}

function stripScales(scales: PersistedPalette[]): PersistedPalette[] {
  return scales.map(({ id, name, baseColor, system }) => ({
    id,
    name: typeof name === 'string' ? name : '',
    baseColor: normalizeHex(baseColor) ?? '#0d7377',
    system: VALID_SYSTEMS.has(system) ? system : 'saturated',
  }))
}

function nowIso(): string {
  return new Date().toISOString()
}

function createProjectId(): string {
  return crypto.randomUUID()
}

export function createBlankProject(name = 'Untitled'): PersistedProject {
  return {
    id: createProjectId(),
    name,
    updatedAt: nowIso(),
    scales: [
      { id: createProjectId(), baseColor: '#0d7377', system: 'saturated' },
      { id: createProjectId(), baseColor: '#c45c26', system: 'fade' },
    ],
    generation: { ...DEFAULT_GENERATION_SETTINGS },
  }
}

function hydrateProject(project: PersistedProject): HydratedProject {
  const generation = normalizeGenerationSettings(project.generation)
  return {
    id: project.id,
    name: project.name,
    updatedAt: project.updatedAt,
    generation,
    scales: project.scales
      .filter(isPersistedPalette)
      .map((scale) => hydrateScale(scale, generation)),
  }
}

function parseStore(raw: string | null): ProjectsStore | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    const payload = parsed as Partial<ProjectsStore>
    if (payload.version !== 1 || !Array.isArray(payload.projects)) return null
    if (typeof payload.activeId !== 'string') return null

    const projects = payload.projects
      .map((item) => {
        if (!item || typeof item !== 'object') return null
        const project = item as Partial<PersistedProject>
        if (
          typeof project.id !== 'string' ||
          typeof project.name !== 'string' ||
          typeof project.updatedAt !== 'string' ||
          !Array.isArray(project.scales)
        ) {
          return null
        }
        return {
          id: project.id,
          name: project.name.trim() || 'Untitled',
          updatedAt: project.updatedAt,
          scales: project.scales.filter(isPersistedPalette),
          generation: normalizeGenerationSettings(project.generation),
        } satisfies PersistedProject
      })
      .filter((project): project is PersistedProject => project != null)

    if (projects.length === 0) return null

    const activeId = projects.some((p) => p.id === payload.activeId)
      ? payload.activeId
      : projects[0].id

    return { version: 1, activeId, projects }
  } catch {
    return null
  }
}

function readLegacyScales(): PersistedPalette[] {
  try {
    const raw = localStorage.getItem(PALETTE_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return []
    const payload = parsed as { version?: number; scales?: unknown }
    if (payload.version !== 1 || !Array.isArray(payload.scales)) return []
    return payload.scales.filter(isPersistedPalette)
  } catch {
    return []
  }
}

function migrateFromLegacy(): ProjectsStore {
  const generation = loadGenerationSettings()
  const legacyScales = readLegacyScales()
  const project = createBlankProject('Untitled')
  if (legacyScales.length > 0) {
    project.scales = stripScales(legacyScales)
  }
  project.generation = generation
  project.updatedAt = nowIso()
  return {
    version: 1,
    activeId: project.id,
    projects: [project],
  }
}

function writeStore(store: ProjectsStore): void {
  localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(store))
}

/** Load projects store, migrating legacy palette + generation keys once. */
export function loadProjectsStore(): ProjectsStore {
  const existing = parseStore(localStorage.getItem(PROJECTS_STORAGE_KEY))
  if (existing) return existing

  const migrated = migrateFromLegacy()
  writeStore(migrated)
  return migrated
}

export function listProjects(store: ProjectsStore = loadProjectsStore()): ProjectListItem[] {
  return store.projects
    .map(({ id, name, updatedAt }) => ({ id, name, updatedAt }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function getActiveProject(
  store: ProjectsStore = loadProjectsStore(),
): HydratedProject {
  const active =
    store.projects.find((project) => project.id === store.activeId) ??
    store.projects[0]
  return hydrateProject(active)
}

export function saveActiveProjectSnapshot(input: {
  id: string
  name: string
  scales: PersistedPalette[]
  generation: GenerationSettings
}): ProjectsStore {
  const store = loadProjectsStore()
  const updatedAt = nowIso()
  const nextProject: PersistedProject = {
    id: input.id,
    name: input.name.trim() || 'Untitled',
    updatedAt,
    scales: stripScales(input.scales),
    generation: normalizeGenerationSettings(input.generation),
  }

  const projects = store.projects.some((project) => project.id === input.id)
    ? store.projects.map((project) =>
        project.id === input.id ? nextProject : project,
      )
    : [...store.projects, nextProject]

  const next: ProjectsStore = {
    version: 1,
    activeId: input.id,
    projects,
  }
  writeStore(next)

  // Keep legacy keys in sync for the active project (reload / mid-flight agents).
  localStorage.setItem(
    PALETTE_STORAGE_KEY,
    JSON.stringify({ version: 1, scales: nextProject.scales }),
  )
  localStorage.setItem(
    GENERATION_STORAGE_KEY,
    JSON.stringify({ version: 1, settings: nextProject.generation }),
  )

  return next
}

export function createProject(
  name = 'Untitled',
  seed?: Partial<Pick<PersistedProject, 'scales' | 'generation'>>,
): { store: ProjectsStore; project: HydratedProject } {
  const store = loadProjectsStore()
  const project: PersistedProject = {
    ...createBlankProject(name),
    ...(seed?.scales ? { scales: stripScales(seed.scales) } : {}),
    ...(seed?.generation
      ? { generation: normalizeGenerationSettings(seed.generation) }
      : {}),
  }
  const next: ProjectsStore = {
    version: 1,
    activeId: project.id,
    projects: [...store.projects, project],
  }
  writeStore(next)
  return { store: next, project: hydrateProject(project) }
}

export function renameProject(
  id: string,
  name: string,
): { store: ProjectsStore; project: HydratedProject } | null {
  const store = loadProjectsStore()
  const trimmed = name.trim() || 'Untitled'
  const projects = store.projects.map((project) =>
    project.id === id
      ? { ...project, name: trimmed, updatedAt: nowIso() }
      : project,
  )
  if (!projects.some((project) => project.id === id)) return null
  const next: ProjectsStore = { ...store, projects }
  writeStore(next)
  const project = projects.find((item) => item.id === id)!
  return { store: next, project: hydrateProject(project) }
}

export function switchProject(
  id: string,
): { store: ProjectsStore; project: HydratedProject } | null {
  const store = loadProjectsStore()
  const project = store.projects.find((item) => item.id === id)
  if (!project) return null
  const next: ProjectsStore = { ...store, activeId: id }
  writeStore(next)

  const generation = normalizeGenerationSettings(project.generation)
  localStorage.setItem(
    PALETTE_STORAGE_KEY,
    JSON.stringify({ version: 1, scales: project.scales }),
  )
  localStorage.setItem(
    GENERATION_STORAGE_KEY,
    JSON.stringify({ version: 1, settings: generation }),
  )

  return { store: next, project: hydrateProject(project) }
}

export function deleteProject(
  id: string,
): { store: ProjectsStore; project: HydratedProject } {
  const store = loadProjectsStore()
  let projects = store.projects.filter((project) => project.id !== id)

  if (projects.length === 0) {
    const fresh = createBlankProject('Untitled')
    projects = [fresh]
  }

  const activeId =
    store.activeId === id
      ? projects[0].id
      : projects.some((project) => project.id === store.activeId)
        ? store.activeId
        : projects[0].id

  const next: ProjectsStore = { version: 1, activeId, projects }
  writeStore(next)

  const active = projects.find((project) => project.id === activeId)!
  const generation = normalizeGenerationSettings(active.generation)
  localStorage.setItem(
    PALETTE_STORAGE_KEY,
    JSON.stringify({ version: 1, scales: active.scales }),
  )
  localStorage.setItem(
    GENERATION_STORAGE_KEY,
    JSON.stringify({ version: 1, settings: generation }),
  )

  return { store: next, project: hydrateProject(active) }
}

export function projectToJson(
  name: string,
  scales: ScaleLike[],
  generation: GenerationSettings,
): string {
  const payload: ProjectExport = {
    name,
    generation: normalizeGenerationSettings(generation),
    scales: scales.map((scale) => toPaletteExport(scale, generation)),
  }
  return JSON.stringify(payload, null, 2)
}

export function downloadProjectJson(
  name: string,
  scales: ScaleLike[],
  generation: GenerationSettings,
  filename?: string,
): void {
  const safeName =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'untitled'
  const blob = new Blob([projectToJson(name, scales, generation)], {
    type: 'application/json;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename ?? `tintfield-${safeName}.json`
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

/** Recompute colors for scales when generation settings change. */
export function recomputeProjectScales(
  scales: ScaleLike[],
  generation: GenerationSettings,
): ScaleLike[] {
  const settings = normalizeGenerationSettings(generation)
  return scales.map((scale) => ({
    ...scale,
    colors: generateScaleColors(scale.baseColor, scale.system, settings),
  }))
}
