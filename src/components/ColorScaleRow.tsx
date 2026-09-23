import { useEffect, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { BASE_STEP_INDEX, STEP_KEYS } from '@/lib/color-system'
import { cn } from '@/lib/utils'

type ColorSwatchProps = {
  hex: string
  step: number
  isBase: boolean
}

function ColorSwatch({ hex, step, isBase }: ColorSwatchProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const id = window.setTimeout(() => setCopied(false), 1200)
    return () => window.clearTimeout(id)
  }, [copied])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(hex.toUpperCase())
      setCopied(true)
      navigator.vibrate?.(50)
    } catch {
      // Clipboard may be blocked; still show brief feedback attempt
      setCopied(true)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={`${step}: ${hex.toUpperCase()}`}
      aria-label={`Copy ${hex.toUpperCase()}`}
      className={cn(
        'group relative h-20 shrink-0 overflow-hidden transition-transform duration-300 ease-out',
        'w-16 snap-center sm:w-20',
        'md:h-24 md:w-auto md:min-w-0 md:flex-1 md:snap-align-none',
        'md:hover:z-10 md:hover:scale-y-110 md:hover:shadow-[0_12px_28px_rgba(15,23,32,0.18)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]',
        isBase && 'md:scale-y-105',
      )}
      style={{ backgroundColor: hex }}
    >
      {isBase && (
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white mix-blend-difference"
        />
      )}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/45 to-transparent px-1.5 pb-1.5 pt-5 text-[10px] font-medium tracking-wide text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 md:px-2">
        <span className="truncate font-mono uppercase">{hex.replace('#', '')}</span>
        {copied ? (
          <Check className="size-3.5 shrink-0" strokeWidth={2.5} />
        ) : (
          <Copy className="size-3.5 shrink-0 opacity-80" strokeWidth={2} />
        )}
      </span>
      {copied && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/25 md:hidden">
          <Check className="size-5 text-white" strokeWidth={2.5} />
        </span>
      )}
    </button>
  )
}

type ColorScaleRowProps = {
  colors: string[]
  className?: string
}

export function ColorScaleRow({ colors, className }: ColorScaleRowProps) {
  return (
    <div
      className={cn(
        'flex w-full overflow-x-auto overscroll-x-contain scroll-smooth',
        'snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        'md:overflow-visible md:snap-none',
        className,
      )}
    >
      {colors.map((hex, index) => (
        <ColorSwatch
          key={`${STEP_KEYS[index]}-${hex}`}
          hex={hex}
          step={STEP_KEYS[index] ?? index}
          isBase={index === BASE_STEP_INDEX}
        />
      ))}
    </div>
  )
}
