const cache = new Map<string, string>()

/** Solid raster the liquid dissolve can sample. SVG sources are unreliable in canvas. */
export function solidSwatchUrl(hex: string) {
  const key = hex.toLowerCase()
  const hit = cache.get(key)
  if (hit) return hit

  const canvas = document.createElement('canvas')
  canvas.width = 4
  canvas.height = 4
  const ctx = canvas.getContext('2d')
  if (!ctx) return key
  ctx.fillStyle = key
  ctx.fillRect(0, 0, 4, 4)
  const url = canvas.toDataURL('image/png')
  cache.set(key, url)
  return url
}
