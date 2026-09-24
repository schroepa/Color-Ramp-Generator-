'use client'

import { useMemo } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  COLOR_SYSTEMS,
  generateScaleColors,
  type ColorSystem,
} from '@/lib/color-system'
import { settingsForPreset } from '@/lib/generation-settings'
import { cn } from '@/lib/utils'

type SystemSwitchProps = {
  value: ColorSystem
  onValueChange: (value: ColorSystem) => void
  /** Base HEX used for mini ramp previews in the menu. */
  baseColor?: string
  label?: string
  className?: string
}

const PREVIEW_SETTINGS = settingsForPreset('open-color')

/**
 * Quiet system picker with a 5-swatch preview per option.
 */
export function SystemSwitch({
  value,
  onValueChange,
  baseColor = '#0d7377',
  label = 'Color system',
  className,
}: SystemSwitchProps) {
  const active = COLOR_SYSTEMS.find((system) => system.value === value)
  const previews = useMemo(() => {
    return COLOR_SYSTEMS.map((system) => ({
      ...system,
      swatches: generateScaleColors(baseColor, system.value, PREVIEW_SETTINGS),
    }))
  }, [baseColor])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          aria-label={label}
          className={cn(
            'w-fit shrink-0 text-[var(--text-muted)] hover:text-[var(--text)]',
            className,
          )}
        >
          {active?.label ?? 'System'}
          <ChevronDown className="size-3.5 opacity-60" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[12rem]">
        {previews.map((system) => {
          const selected = system.value === value
          return (
            <DropdownMenuItem
              key={system.value}
              aria-label={`${system.label}. ${system.hint}`}
              onSelect={() => onValueChange(system.value)}
              className="flex-col items-start gap-1.5"
            >
              <span className="flex w-full items-center justify-between gap-3">
                <span className="flex flex-col gap-0.5">
                  <span>{system.label}</span>
                  <span className="type-caption text-[var(--text-faint)]">
                    {system.hint}
                  </span>
                </span>
                {selected ? (
                  <Check className="size-3.5 shrink-0 opacity-70" aria-hidden />
                ) : null}
              </span>
              <span className="flex gap-0.5" aria-hidden>
                {system.swatches.map((hex, i) => (
                  <span
                    key={`${system.value}-${i}`}
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
