/** One-time legend for contrast chips under scale strips. */
export function ContrastLegend({ className }: { className?: string }) {
  return (
    <p
      className={
        className ??
        'type-caption flex flex-wrap items-center gap-x-4 gap-y-1 text-[var(--text-faint)]'
      }
      role="note"
    >
      <span>
        Contrast vs white / black (WCAG 2.2). Probe “Aa” is on the swatch; the mark
        (AAA / AA / AA18 / ✕) stays on chrome. On touch, open a scale for the full
        step list.
      </span>
    </p>
  )
}
