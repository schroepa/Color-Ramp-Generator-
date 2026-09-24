import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'
import { cn } from '@/lib/utils'

type SliderProps = React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
  /** Visible value readout next to the track (mobile-friendly). */
  display?: string
}

/**
 * shadcn Slider restyled with Tintfield tokens.
 * Touch-friendly thumb; optional display string for settings rows.
 */
const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, display, value, defaultValue, min = 0, max = 100, ...props }, ref) => {
  const values = React.useMemo(() => {
    if (Array.isArray(value)) return value
    if (Array.isArray(defaultValue)) return defaultValue
    return [min]
  }, [value, defaultValue, min])

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <SliderPrimitive.Root
        ref={ref}
        data-slot="slider"
        value={value}
        defaultValue={defaultValue}
        min={min}
        max={max}
        className={cn(
          'relative flex w-full touch-none select-none items-center',
          'data-[disabled]:opacity-50',
          className,
        )}
        {...props}
      >
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative h-2 w-full grow overflow-hidden rounded-full bg-[var(--chip)]"
        >
          <SliderPrimitive.Range
            data-slot="slider-range"
            className="absolute h-full bg-[var(--primary)]"
          />
        </SliderPrimitive.Track>
        {values.map((_, index) => (
          <SliderPrimitive.Thumb
            key={index}
            data-slot="slider-thumb"
            aria-label={props['aria-label'] ? `${props['aria-label']}` : undefined}
            className={cn(
              'block size-5 shrink-0 rounded-full border-2 border-[var(--primary)] bg-[var(--bg)] shadow-sm',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
              'disabled:pointer-events-none disabled:opacity-50',
            )}
          />
        ))}
      </SliderPrimitive.Root>
      {display != null ? (
        <span className="type-mono w-12 shrink-0 text-right text-[var(--text)] tabular-nums">
          {display}
        </span>
      ) : null}
    </div>
  )
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
