'use client'

import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Liquid } from 'liquid-gooey'
import { useReducedMotion } from 'motion/react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLiquidMotion } from '@/components/ui/smoothui/smooth-button'
import { AppTooltip } from '@/components/ui/tooltip'
import type { ProjectListItem } from '@/lib/projects'
import { cn } from '@/lib/utils'

type ProjectSwitcherProps = {
  activeId: string
  activeName: string
  projects: ProjectListItem[]
  onCreate: () => void
  onRename: () => void
  onSwitch: (id: string) => void
  onDelete: () => void
  className?: string
}

/** Project select trigger with the same liquid hover/press language as buttons. */
function ProjectSelectTrigger({
  activeName,
  className,
}: {
  activeName: string
  className?: string
}) {
  const shouldReduceMotion = useReducedMotion()
  const { scale, transition, bind } = useLiquidMotion()
  const liquidScale = shouldReduceMotion ? 1 : scale

  return (
    <Liquid
      blur={6}
      contrast={18}
      fill="var(--chip)"
      filterPadding={14}
      className="relative col-start-2 row-start-1 w-full min-w-0 tablet:col-auto tablet:row-auto tablet:w-auto [&_[data-gooey-svg]]:pointer-events-none"
    >
      <Liquid.Item
        scale={liquidScale}
        transition={shouldReduceMotion ? 'snappy' : transition}
        morph={
          shouldReduceMotion
            ? { shape: false, contentBlur: 0, bounce: 0 }
            : { shape: true, contentBlur: 0, bounce: 0.35 }
        }
      >
        <SelectTrigger
          aria-label="Active project"
          className={cn(
            'h-8 min-h-8 w-full min-w-0 border-[var(--line)] bg-[var(--chip)] px-2.5 type-label text-[var(--text)] tablet:w-[min(100%,14rem)]',
            className,
          )}
          onPointerEnter={bind.onPointerEnter}
          onPointerLeave={bind.onPointerLeave}
          onPointerDown={bind.onPointerDown}
          onPointerUp={bind.onPointerUp}
          onPointerCancel={bind.onPointerCancel}
          onFocus={bind.onFocus}
          onBlur={bind.onBlur}
        >
          <SelectValue placeholder={activeName}>{activeName}</SelectValue>
        </SelectTrigger>
      </Liquid.Item>
    </Liquid>
  )
}

/** App-chrome project controls: switch, create, rename, delete. */
export function ProjectSwitcher({
  activeId,
  activeName,
  projects,
  onCreate,
  onRename,
  onSwitch,
  onDelete,
  className,
}: ProjectSwitcherProps) {
  const sorted = [...projects].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  )

  return (
    <div
      className={cn('contents', className)}
      role="group"
      aria-label="Projects"
    >
      <Select value={activeId} onValueChange={onSwitch}>
        <ProjectSelectTrigger activeName={activeName} />
        <SelectContent align="start">
          {sorted.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="col-start-1 row-start-2 flex items-center gap-1.5 tablet:col-auto tablet:row-auto tablet:ml-1">
        <AppTooltip content="New project">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="New project"
            onClick={onCreate}
          >
            <Plus />
          </Button>
        </AppTooltip>

        <AppTooltip content="Rename project">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Rename project"
            onClick={onRename}
          >
            <Pencil />
          </Button>
        </AppTooltip>

        <AppTooltip content="Delete project">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Delete project"
            onClick={onDelete}
          >
            <Trash2 />
          </Button>
        </AppTooltip>
      </div>
    </div>
  )
}
