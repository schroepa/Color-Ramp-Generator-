'use client'

import { Copy, Eye, EyeOff, MoreHorizontal, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ScaleCopyFormat } from '@/components/ScaleCopyMenu'

type ScaleOverflowMenuProps = {
  previewActive: boolean
  onTogglePreview: () => void
  onCopy: (format: ScaleCopyFormat) => void
  onRemove: () => void
}

/** Scale actions in one ⋯ menu (concept 4.5 / 2.5). */
export function ScaleOverflowMenu({
  previewActive,
  onTogglePreview,
  onCopy,
  onRemove,
}: ScaleOverflowMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Scale actions"
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[12rem]">
        <DropdownMenuItem onSelect={onTogglePreview}>
          {previewActive ? (
            <EyeOff className="size-3.5" aria-hidden />
          ) : (
            <Eye className="size-3.5" aria-hidden />
          )}
          {previewActive ? 'Hide preview' : 'Preview UI'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onCopy('json')}>
          <Copy className="size-3.5" aria-hidden />
          Copy JSON
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onCopy('css')}>
          <Copy className="size-3.5" aria-hidden />
          Copy CSS
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onCopy('hex')}>
          <Copy className="size-3.5" aria-hidden />
          Copy HEX list
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={onRemove}
          className="text-[var(--text-muted)] focus:text-[var(--text)]"
        >
          <Trash2 className="size-3.5" aria-hidden />
          Delete scale
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
