'use client'

import { ChevronDown, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export type ScaleCopyFormat = 'json' | 'css' | 'hex'

const COPY_ACTIONS: {
  format: ScaleCopyFormat
  label: string
  ariaLabel: string
}[] = [
  { format: 'json', label: 'JSON', ariaLabel: 'Copy scale as JSON' },
  { format: 'css', label: 'CSS', ariaLabel: 'Copy scale as CSS' },
  { format: 'hex', label: 'HEX', ariaLabel: 'Copy scale as HEX' },
]

type ScaleCopyMenuProps = {
  onCopy: (format: ScaleCopyFormat) => void
  className?: string
}

/** Compact Copy control: JSON / CSS / HEX in a dropdown. */
export function ScaleCopyMenu({ onCopy, className }: ScaleCopyMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          aria-label="Copy scale"
          className={cn(className)}
        >
          <Copy aria-hidden />
          <span>Copy</span>
          <ChevronDown className="size-3.5 opacity-60" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {COPY_ACTIONS.map((action) => (
          <DropdownMenuItem
            key={action.format}
            aria-label={action.ariaLabel}
            onSelect={() => onCopy(action.format)}
          >
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
