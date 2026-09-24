'use client'

import { ChevronDown, Copy, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { SetExportFormat } from '@/lib/export-formats'
import { cn } from '@/lib/utils'

type ProjectExportMenuProps = {
  disabled?: boolean
  onDownload: (format: SetExportFormat) => void
  onCopy: (format: SetExportFormat) => void
  className?: string
}

const FORMATS: {
  format: SetExportFormat
  label: string
  hint: string
}[] = [
  { format: 'json', label: 'JSON', hint: 'Tintfield project' },
  { format: 'css', label: 'CSS', hint: 'Custom properties' },
  { format: 'tailwind', label: 'Tailwind', hint: 'theme.extend.colors' },
  { format: 'dtcg', label: 'Design tokens', hint: 'DTCG / Figma Variables' },
]

/** Set-level export: JSON, CSS, Tailwind, DTCG — download or copy. */
export function ProjectExportMenu({
  disabled,
  onDownload,
  onCopy,
  className,
}: ProjectExportMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="default"
          size="sm"
          disabled={disabled}
          aria-label="Export set"
          className={cn(className)}
        >
          <Download aria-hidden />
          Export
          <ChevronDown className="size-3.5 opacity-70" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[14rem]">
        {FORMATS.map((item) => (
          <DropdownMenuItem
            key={`dl-${item.format}`}
            aria-label={`Download set as ${item.label}`}
            onSelect={() => onDownload(item.format)}
          >
            <Download className="size-3.5 shrink-0" aria-hidden />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span>Download {item.label}</span>
              <span className="type-caption text-[var(--text-faint)]">
                {item.hint}
              </span>
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        {FORMATS.map((item) => (
          <DropdownMenuItem
            key={`cp-${item.format}`}
            aria-label={`Copy set as ${item.label}`}
            onSelect={() => onCopy(item.format)}
          >
            <Copy className="size-3.5 shrink-0" aria-hidden />
            <span>Copy {item.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
