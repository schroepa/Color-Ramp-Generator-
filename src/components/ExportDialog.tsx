'use client'

import { useMemo, useState } from 'react'
import { Copy, Download, Share2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  downloadSetExport,
  setToCss,
  setToDtcg,
  setToScss,
  setToSvg,
  setToTailwind,
  type SetExportFormat,
} from '@/lib/export-formats'
import type { GenerationSettings } from '@/lib/generation-settings'
import type { ScaleLike } from '@/lib/palette-storage'
import { cn } from '@/lib/utils'

type ExportDialogProps = {
  open: boolean
  onClose: () => void
  setName: string
  scales: ScaleLike[]
  settings: GenerationSettings
  projectJson: string
  onCopied: (label: string) => void
  onFailed: () => void
}

const FORMATS: { format: SetExportFormat; label: string }[] = [
  { format: 'css', label: 'CSS' },
  { format: 'scss', label: 'SCSS' },
  { format: 'tailwind', label: 'Tailwind' },
  { format: 'dtcg', label: 'Design tokens' },
  { format: 'svg', label: 'SVG' },
  { format: 'json', label: 'JSON' },
]

/** Full export dialog with live preview (concept 4.8 · review v2). */
export function ExportDialog({
  open,
  onClose,
  setName,
  scales,
  settings,
  projectJson,
  onCopied,
  onFailed,
}: ExportDialogProps) {
  const [format, setFormat] = useState<SetExportFormat>('css')

  const preview = useMemo(() => {
    switch (format) {
      case 'css':
        return setToCss(scales, settings)
      case 'scss':
        return setToScss(scales, settings)
      case 'tailwind':
        return setToTailwind(scales, settings)
      case 'dtcg':
        return setToDtcg(scales, settings)
      case 'svg':
        return setToSvg(scales, settings)
      case 'json':
      default:
        return projectJson
    }
  }, [format, scales, settings, projectJson])

  if (!open) return null

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(preview)
      onCopied(format.toUpperCase())
    } catch {
      onFailed()
    }
  }

  const download = () => {
    downloadSetExport(format, setName, preview)
    onCopied('Exported')
  }

  const share = async () => {
    if (!navigator.share) {
      await copy()
      return
    }
    try {
      await navigator.share({
        title: setName || 'Tintfield export',
        text: preview.slice(0, 4000),
      })
      onCopied('Shared')
    } catch (error) {
      if ((error as Error).name !== 'AbortError') onFailed()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center tablet:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/55"
        aria-label="Close export"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Export set"
        className={cn(
          'relative z-10 flex max-h-[min(90svh,40rem)] w-full max-w-3xl flex-col',
          'rounded-t-[var(--radius-lg)] border border-[var(--line)] bg-[var(--bg)]',
          'tablet:rounded-[var(--radius-lg)]',
          'pb-[env(safe-area-inset-bottom)]',
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--line)] px-4 py-3">
          <p className="type-heading">Export</p>
          <Button type="button" variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
            <X />
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 tablet:flex-row">
          {/* Mobile: select · tablet+: side list */}
          <div className="shrink-0 tablet:hidden">
            <Select
              value={format}
              onValueChange={(next) => setFormat(next as SetExportFormat)}
            >
              <SelectTrigger size="sm" aria-label="Export format" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMATS.map((item) => (
                  <SelectItem key={item.format} value={item.format}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="hidden shrink-0 flex-col gap-1 tablet:flex tablet:w-44">
            {FORMATS.map((item) => (
              <button
                key={item.format}
                type="button"
                onClick={() => setFormat(item.format)}
                className={cn(
                  'type-label shrink-0 rounded-full px-3 py-2 text-left outline-none',
                  'focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
                  format === item.format
                    ? 'bg-[var(--primary)] text-[var(--primary-ink)]'
                    : 'bg-[var(--chip)] text-[var(--text-muted)] hover:text-[var(--text)]',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <pre className="scrollbar-quiet type-mono min-h-0 min-w-0 flex-1 overflow-auto rounded-[var(--radius-md)] bg-[var(--chip)] p-3 text-[var(--text)]">
            {preview}
          </pre>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 border-t border-[var(--line)] px-4 py-3">
          <Button type="button" variant="default" onClick={copy}>
            <Copy />
            Copy
          </Button>
          <Button type="button" variant="secondary" onClick={download}>
            <Download />
            Download
          </Button>
          {'share' in navigator ? (
            <Button type="button" variant="secondary" onClick={() => void share()}>
              <Share2 />
              Share
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
