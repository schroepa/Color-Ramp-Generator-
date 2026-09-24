'use client'

import { Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  RAMP_SURFACES,
  type RampSurface,
} from '@/lib/ramp-surface'

type SurfaceSwitcherProps = {
  value: RampSurface
  onChange: (value: RampSurface) => void
}

/** Background behind ramps: dark / neutral / light (concept 2.2). */
export function SurfaceSwitcher({ value, onChange }: SurfaceSwitcherProps) {
  const active = RAMP_SURFACES.find((item) => item.value === value)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={`Ramp background: ${active?.label ?? 'Dark'}`}
        >
          <Circle
            className="size-3.5 fill-current"
            style={{ color: active?.css }}
            aria-hidden
          />
          <span className="hidden tablet:inline">{active?.label ?? 'Dark'}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {RAMP_SURFACES.map((surface) => (
          <DropdownMenuItem
            key={surface.value}
            onSelect={() => onChange(surface.value)}
          >
            <span
              className="size-3.5 rounded-full"
              style={{ backgroundColor: surface.css }}
              aria-hidden
            />
            {surface.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
