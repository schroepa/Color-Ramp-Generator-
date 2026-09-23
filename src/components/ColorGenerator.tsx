import { useId, useMemo, useState } from 'react'
import {
  Braces,
  ClipboardCopy,
  Plus,
  Trash2,
  Variable,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ColorScaleRow } from '@/components/ColorScaleRow'
import {
  COLOR_SYSTEMS,
  type ColorSystem,
  generateScaleColors,
  normalizeHex,
  scaleToCssVars,
  scaleToJson,
} from '@/lib/color-system'
import { cn } from '@/lib/utils'

export type ColorScale = {
  id: string
  baseColor: string
  system: ColorSystem
  colors: string[]
}

function createScale(
  baseColor = '#0d7377',
  system: ColorSystem = 'saturated',
): ColorScale {
  const hex = normalizeHex(baseColor) ?? '#0d7377'
  return {
    id: crypto.randomUUID(),
    baseColor: hex,
    system,
    colors: generateScaleColors(hex, system),
  }
}

type CopyFormat = 'json' | 'css'

export function ColorGenerator() {
  const pickerId = useId()
  const hexId = useId()
  const [draftColor, setDraftColor] = useState('#0d7377')
  const [draftSystem, setDraftSystem] = useState<ColorSystem>('saturated')
  const [scales, setScales] = useState<ColorScale[]>(() => [
    createScale('#0d7377', 'saturated'),
    createScale('#c45c26', 'fade'),
  ])
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)

  const draftPreview = useMemo(
    () => generateScaleColors(normalizeHex(draftColor) ?? '#0d7377', draftSystem),
    [draftColor, draftSystem],
  )

  const flash = (message: string) => {
    setCopyFeedback(message)
    window.setTimeout(() => setCopyFeedback(null), 1600)
  }

  const handleHexChange = (value: string) => {
    setDraftColor(value)
    const normalized = normalizeHex(value)
    if (normalized) setDraftColor(normalized)
  }

  const addScale = () => {
    const hex = normalizeHex(draftColor) ?? '#0d7377'
    setScales((prev) => [...prev, createScale(hex, draftSystem)])
  }

  const removeScale = (id: string) => {
    setScales((prev) => prev.filter((scale) => scale.id !== id))
  }

  const updateScale = (
    id: string,
    patch: Partial<Pick<ColorScale, 'baseColor' | 'system'>>,
  ) => {
    setScales((prev) =>
      prev.map((scale) => {
        if (scale.id !== id) return scale
        const baseColor = patch.baseColor
          ? (normalizeHex(patch.baseColor) ?? scale.baseColor)
          : scale.baseColor
        const system = patch.system ?? scale.system
        return {
          ...scale,
          baseColor,
          system,
          colors: generateScaleColors(baseColor, system),
        }
      }),
    )
  }

  const copyScale = async (scale: ColorScale, format: CopyFormat) => {
    const payload =
      format === 'json'
        ? scaleToJson(scale.colors)
        : `:root {\n${scaleToCssVars(scale.colors)}\n}`
    try {
      await navigator.clipboard.writeText(payload)
      navigator.vibrate?.(50)
      flash(format === 'json' ? 'JSON copied' : 'CSS vars copied')
    } catch {
      flash('Copy failed')
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
      <section
        className={cn(
          'relative overflow-hidden rounded-2xl border border-[var(--line)]',
          'bg-[var(--elevated)]/80 p-5 shadow-[0_24px_60px_rgba(15,23,32,0.08)] backdrop-blur-md',
          'sm:p-7',
          'animate-rise',
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-[radial-gradient(circle,var(--accent-glow),transparent_70%)] opacity-80"
        />
        <div className="relative flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <p className="font-display text-sm tracking-[0.2em] text-[var(--accent)] uppercase">
              Build a ramp
            </p>
            <h2 className="font-display text-2xl text-[var(--ink)] sm:text-3xl">
              Base color → 19 OKLCH steps
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-[auto_1fr_1fr_auto] sm:items-end">
            <div className="flex flex-col gap-2">
              <Label htmlFor={pickerId}>Base</Label>
              <div className="flex items-center gap-3">
                <label className="relative size-12 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-[var(--line)] shadow-inner">
                  <input
                    id={pickerId}
                    type="color"
                    value={normalizeHex(draftColor) ?? '#0d7377'}
                    onChange={(e) => setDraftColor(e.target.value)}
                    className="absolute inset-0 size-[150%] -translate-x-1/4 -translate-y-1/4 cursor-pointer border-0 p-0"
                  />
                </label>
                <div className="flex min-w-0 flex-1 flex-col gap-1 sm:hidden">
                  <Label htmlFor={hexId}>HEX</Label>
                  <input
                    id={hexId}
                    value={draftColor}
                    onChange={(e) => handleHexChange(e.target.value)}
                    spellCheck={false}
                    className="h-10 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 font-mono text-sm uppercase text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  />
                </div>
              </div>
            </div>

            <div className="hidden flex-col gap-2 sm:flex">
              <Label htmlFor={`${hexId}-desktop`}>HEX</Label>
              <input
                id={`${hexId}-desktop`}
                value={draftColor}
                onChange={(e) => handleHexChange(e.target.value)}
                spellCheck={false}
                className="h-10 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 font-mono text-sm uppercase text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>System</Label>
              <Select
                value={draftSystem}
                onValueChange={(value) => setDraftSystem(value as ColorSystem)}
              >
                <SelectTrigger aria-label="Color system">
                  <SelectValue placeholder="System" />
                </SelectTrigger>
                <SelectContent>
                  {COLOR_SYSTEMS.map((system) => (
                    <SelectItem key={system.value} value={system.value}>
                      {system.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="button" onClick={addScale} className="w-full sm:w-auto">
              <Plus />
              Add Scale
            </Button>
          </div>

          <div className="overflow-hidden rounded-xl border border-[var(--line)]">
            <ColorScaleRow colors={draftPreview} />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-display text-sm tracking-[0.2em] text-[var(--accent)] uppercase">
              Your scales
            </p>
            <h2 className="font-display text-2xl text-[var(--ink)]">
              {scales.length === 0
                ? 'No scales yet'
                : `${scales.length} scale${scales.length === 1 ? '' : 's'}`}
            </h2>
          </div>
          {copyFeedback && (
            <p
              className="animate-fade-in rounded-full border border-[var(--line)] bg-[var(--elevated)] px-3 py-1 text-xs font-medium text-[var(--ink)]"
              role="status"
            >
              {copyFeedback}
            </p>
          )}
        </div>

        {scales.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface)]/60 px-5 py-10 text-center text-[var(--muted)]">
            Pick a base color and add your first scale.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {scales.map((scale, index) => (
              <li
                key={scale.id}
                className="animate-rise overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--elevated)]/75 shadow-[0_16px_40px_rgba(15,23,32,0.06)] backdrop-blur-sm"
                style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}
              >
                <div className="flex flex-col gap-3 border-b border-[var(--line)] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="relative size-9 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-[var(--line)]">
                      <input
                        type="color"
                        value={scale.baseColor}
                        onChange={(e) =>
                          updateScale(scale.id, { baseColor: e.target.value })
                        }
                        aria-label="Edit base color"
                        className="absolute inset-0 size-[150%] -translate-x-1/4 -translate-y-1/4 cursor-pointer border-0 p-0"
                      />
                    </label>
                    <span className="font-mono text-sm uppercase tracking-wide text-[var(--ink)]">
                      {scale.baseColor}
                    </span>
                    <Select
                      value={scale.system}
                      onValueChange={(value) =>
                        updateScale(scale.id, { system: value as ColorSystem })
                      }
                    >
                      <SelectTrigger
                        className="h-9 w-[140px]"
                        aria-label="Change system"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COLOR_SYSTEMS.map((system) => (
                          <SelectItem key={system.value} value={system.value}>
                            {system.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => copyScale(scale, 'json')}
                    >
                      <Braces />
                      JSON
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => copyScale(scale, 'css')}
                    >
                      <Variable />
                      CSS vars
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        void navigator.clipboard.writeText(
                          scale.colors.join('\n'),
                        )
                        flash('HEX list copied')
                      }}
                    >
                      <ClipboardCopy />
                      HEX
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Delete scale"
                      onClick={() => removeScale(scale.id)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
                <ColorScaleRow colors={scale.colors} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
