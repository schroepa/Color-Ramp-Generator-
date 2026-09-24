import type { ColorSystem } from '@/lib/color-system'
import {
  type GenerationSettings,
  normalizeGenerationSettings,
} from '@/lib/generation-settings'

export type ShareScale = {
  name: string
  baseColor: string
  system: ColorSystem
}

export type SharePayload = {
  v: 1
  name: string
  generation: GenerationSettings
  scales: ShareScale[]
}

function encodeBase64Url(json: string): string {
  const bytes = new TextEncoder().encode(json)
  let binary = ''
  bytes.forEach((b) => {
    binary += String.fromCharCode(b)
  })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function decodeBase64Url(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/')
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
  const binary = atob(padded + pad)
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function encodeSharePayload(payload: SharePayload): string {
  return encodeBase64Url(JSON.stringify(payload))
}

export function decodeSharePayload(hash: string): SharePayload | null {
  try {
    const raw = hash.startsWith('#') ? hash.slice(1) : hash
    if (!raw) return null
    const parsed = JSON.parse(decodeBase64Url(raw)) as Partial<SharePayload>
    if (parsed.v !== 1 || !Array.isArray(parsed.scales)) return null
    return {
      v: 1,
      name: typeof parsed.name === 'string' ? parsed.name : 'Untitled',
      generation: normalizeGenerationSettings(parsed.generation),
      scales: parsed.scales
        .filter(
          (s): s is ShareScale =>
            Boolean(s) &&
            typeof s === 'object' &&
            typeof (s as ShareScale).baseColor === 'string' &&
            typeof (s as ShareScale).system === 'string',
        )
        .map((s) => ({
          name: typeof s.name === 'string' ? s.name : '',
          baseColor: s.baseColor,
          system: s.system,
        })),
    }
  } catch {
    return null
  }
}

export function buildShareUrl(payload: SharePayload): string {
  const url = new URL(window.location.href)
  url.hash = encodeSharePayload(payload)
  return url.toString()
}

export async function shareOrCopyUrl(url: string): Promise<'shared' | 'copied'> {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: 'Tintfield', url })
      return 'shared'
    } catch (error) {
      if ((error as Error).name === 'AbortError') throw error
    }
  }
  await navigator.clipboard.writeText(url)
  return 'copied'
}
