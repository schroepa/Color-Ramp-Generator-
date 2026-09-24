'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown, Pencil, Plus, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ProjectListItem } from '@/lib/projects'
import { cn } from '@/lib/utils'

export type ScaleMenuItem = {
  id: string
  name: string
  baseColor: string
}

type ProjectSwitcherProps = {
  activeId: string
  activeName: string
  projects: ProjectListItem[]
  /** Scales in the active set — shown in the menu so names are discoverable. */
  scales?: ScaleMenuItem[]
  onCreate: () => void
  onSwitch: (id: string) => void
  onDelete: () => void
  onRename: (name: string) => void
  onFocusScale?: (id: string) => void
  onImport?: () => void
  className?: string
}

/**
 * Header set switcher — set name on the trigger; scales listed inside the menu.
 */
export function ProjectSwitcher({
  activeId,
  activeName,
  projects,
  scales = [],
  onCreate,
  onSwitch,
  onDelete,
  onRename,
  onFocusScale,
  onImport,
  className,
}: ProjectSwitcherProps) {
  const [renaming, setRenaming] = useState(false)
  const [draft, setDraft] = useState(activeName)
  const sorted = [...projects].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  )
  const canDelete = projects.length > 1
  const displayName = activeName.trim() || 'Untitled'

  const commitRename = () => {
    const next = draft.trim() || 'Untitled'
    onRename(next)
    setRenaming(false)
  }

  if (renaming) {
    return (
      <div className={cn('flex min-w-0 flex-1 items-center gap-1.5', className)}>
        <input
          autoFocus
          value={draft}
          aria-label="Set name"
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commitRename}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              commitRename()
            }
            if (event.key === 'Escape') {
              setDraft(activeName)
              setRenaming(false)
            }
          }}
          className="type-label h-8 min-w-0 max-w-[16rem] flex-1 rounded-full bg-[var(--chip)] px-3 text-[var(--text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        />
      </div>
    )
  }

  return (
    <div
      className={cn('flex min-w-0 items-center gap-1.5', className)}
      role="group"
      aria-label="Sets"
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            aria-label={`Set: ${displayName}`}
            className="min-w-0 max-w-[12rem] tablet:max-w-[16rem]"
          >
            <span className="truncate">{displayName}</span>
            <ChevronsUpDown className="size-3.5 shrink-0 opacity-60" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[14rem]">
          {sorted.map((project) => {
            const selected = project.id === activeId
            return (
              <DropdownMenuItem
                key={project.id}
                aria-label={`Open set ${project.name}`}
                onSelect={() => onSwitch(project.id)}
                className="justify-between gap-3"
              >
                <span className="truncate">{project.name}</span>
                {selected ? (
                  <Check className="size-3.5 shrink-0 opacity-70" aria-hidden />
                ) : null}
              </DropdownMenuItem>
            )
          })}

          {scales.length > 0 ? (
            <>
              <DropdownMenuSeparator />
              <p className="type-caption px-3 py-1.5 text-[var(--text-faint)]">
                Scales in this set
              </p>
              {scales.map((scale) => {
                const label = scale.name.trim() || scale.baseColor
                return (
                  <DropdownMenuItem
                    key={scale.id}
                    aria-label={`Go to scale ${label}`}
                    onSelect={() => onFocusScale?.(scale.id)}
                  >
                    <span
                      className="size-3.5 shrink-0 rounded-full"
                      style={{ backgroundColor: scale.baseColor }}
                      aria-hidden
                    />
                    <span className="truncate">{label}</span>
                  </DropdownMenuItem>
                )
              })}
            </>
          ) : null}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            aria-label="Rename set"
            onSelect={(event) => {
              event.preventDefault()
              setDraft(activeName)
              setRenaming(true)
            }}
          >
            <Pencil className="size-3.5" aria-hidden />
            Rename set
          </DropdownMenuItem>
          <DropdownMenuItem aria-label="New set" onSelect={onCreate}>
            <Plus className="size-3.5" aria-hidden />
            New set
          </DropdownMenuItem>
          {onImport ? (
            <DropdownMenuItem aria-label="Import JSON" onSelect={onImport}>
              <Upload className="size-3.5" aria-hidden />
              Import JSON
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            aria-label="Delete set"
            disabled={!canDelete}
            onSelect={onDelete}
            className="text-[var(--text-muted)] focus:text-[var(--text)]"
          >
            <Trash2 className="size-3.5" aria-hidden />
            Delete set
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
