'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { type ColorSystem, normalizeHex } from '@/lib/color-system'
import { cn } from '@/lib/utils'

const DEFAULT_DRAFT = '#0d7377'

type NewScaleFormProps = {
  onAdd: (baseColor: string, system: ColorSystem) => void
  className?: string
}

/**
 * Dashed add card at the end of the scale list (concept 4.5).
 */
export function NewScaleForm({ onAdd, className }: NewScaleFormProps) {
  const [hex, setHex] = useState(DEFAULT_DRAFT)
  const normalized = normalizeHex(hex)
  const canAdd = Boolean(normalized)

  const handleAdd = () => {
    if (!normalized) return
    onAdd(normalized, 'saturated')
  }

  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-3 rounded-[var(--radius-md)] border border-dashed border-[var(--line)] p-4 tablet:p-6',
        className,
      )}
    >
      <p className="type-label text-[var(--text-muted)]">Add a color</p>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <label className="relative size-10 min-h-10 min-w-10 shrink-0 cursor-pointer overflow-hidden rounded-[var(--radius-sm)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--ring)]">
          <input
            type="color"
            value={normalized ?? DEFAULT_DRAFT}
            onChange={(event) => setHex(event.target.value)}
            aria-label="Base color for new scale"
            className="absolute inset-0 size-[160%] -translate-x-1/4 -translate-y-1/4 cursor-pointer border-0 p-0"
          />
        </label>
        <input
          value={hex}
          onChange={(event) => setHex(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              handleAdd()
            }
          }}
          aria-label="HEX for new scale base color"
          aria-invalid={hex.length > 0 && !normalized}
          spellCheck={false}
          placeholder="#000000"
          className={cn(
            'h-10 min-w-0 w-[8rem] rounded-full bg-[var(--chip)] px-3 type-mono text-[var(--text)] uppercase outline-none',
            'focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
            hex.length > 0 && !normalized && 'ring-1 ring-[var(--line)]',
          )}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!canAdd}
          aria-label="Add color"
          onClick={handleAdd}
        >
          <Plus />
          Add color
        </Button>
      </div>
    </div>
  )
}
