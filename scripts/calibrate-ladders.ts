/**
 * Calibrate contrast-vs-white ladders from official reference palettes.
 *
 * MUSS (§4.3): Load reference colors (license-checked, not shipped),
 * compute median contrast-vs-white per step across hues (exclude neutrals),
 * write targets into builtins with calibratedFrom provenance.
 *
 * This stub documents the process. Run when adding a new system version:
 *   npx tsx scripts/calibrate-ladders.ts
 *
 * Current builtins use fallback values from tintfield-anforderungen-presets.md §4.3.
 */
console.log(
  [
    'calibrate-ladders: stub',
    '1. Fetch/license-check reference palettes (do not vendor colors).',
    '2. For each step, median WCAG contrast vs #fff across chromatic scales.',
    '3. Write constants into src/lib/presets/builtins.ts with calibratedFrom.',
  ].join('\n'),
)
