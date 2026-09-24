'use client'

import { useEffect, useRef, useState } from 'react'
import {
  HalftoneDots,
  MeshGradient,
  isPaperShaderElement,
} from '@paper-design/shaders-react'

type Props = {
  /** Up to 10 hex colors — typically sampled from the live scale */
  colors: string[]
}

/**
 * MeshGradient drives the color motion; HalftoneDots samples those frames
 * so the palette reads as moving dots. Wrapper opacity stays at 40%.
 */
export function HeroMeshBackground({ colors }: Props) {
  const meshHostRef = useRef<HTMLDivElement>(null)
  const halfHostRef = useRef<HTMLDivElement>(null)
  const bridgeRef = useRef<HTMLCanvasElement | null>(null)
  const blobUrlRef = useRef<string | null>(null)
  const seededRef = useRef(false)
  const [seedImage, setSeedImage] = useState<string | undefined>(undefined)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReducedMotion(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const palette =
    colors.length >= 2
      ? colors.slice(0, 6)
      : ['#0d7377', '#1aa89c', '#9fd8d2', '#1e3b3d']

  // Pipe MeshGradient canvas → HalftoneDots texture
  useEffect(() => {
    let raf = 0
    let last = 0
    let cancelled = false
    let pending = false

    const pushFrame = (source: HTMLCanvasElement) => {
      if (pending) return
      const halfRoot = halfHostRef.current?.firstElementChild
      if (!halfRoot || !isPaperShaderElement(halfRoot)) return
      const mount = halfRoot.paperShaderMount
      if (!mount) return

      let bridge = bridgeRef.current
      if (!bridge) {
        bridge = document.createElement('canvas')
        bridgeRef.current = bridge
      }

      const maxW = 420
      const aspect = source.height / Math.max(1, source.width)
      const w = Math.min(maxW, Math.max(2, source.width))
      const h = Math.max(2, Math.round(w * aspect))
      if (bridge.width !== w || bridge.height !== h) {
        bridge.width = w
        bridge.height = h
      }
      const ctx = bridge.getContext('2d', { alpha: false })
      if (!ctx) return
      ctx.drawImage(source, 0, 0, w, h)

      pending = true
      bridge.toBlob(
        (blob) => {
          pending = false
          if (!blob || cancelled) return
          const url = URL.createObjectURL(blob)
          const img = new Image()
          img.onload = () => {
            if (cancelled) {
              URL.revokeObjectURL(url)
              return
            }
            try {
              mount.setUniforms({ u_image: img })
            } catch {
              /* texture not ready yet */
            }
            if (!seededRef.current) {
              seededRef.current = true
              setSeedImage(url)
            } else {
              if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
              blobUrlRef.current = url
            }
          }
          img.onerror = () => {
            pending = false
            URL.revokeObjectURL(url)
          }
          img.src = url
        },
        'image/jpeg',
        0.7,
      )
    }

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const interval = reducedMotion ? 2000 : 90
      if (now - last < interval) return
      last = now
      const source = meshHostRef.current?.querySelector('canvas')
      if (source && source.width > 1) pushFrame(source)
    }

    raf = requestAnimationFrame(tick)
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
    }
  }, [reducedMotion])

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden
      style={{ opacity: 0.4 }}
    >
      {/* Animated color source (not visible — sampled into dots) */}
      <div ref={meshHostRef} className="absolute inset-0 opacity-0">
        <MeshGradient
          colors={palette}
          distortion={0.8}
          swirl={0.1}
          grainMixer={0}
          grainOverlay={0}
          speed={reducedMotion ? 0 : 0.35}
          fit="cover"
          webGlContextAttributes={{ preserveDrawingBuffer: true }}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Visible halfone readout of the mesh */}
      <div ref={halfHostRef} className="absolute inset-0">
        <HalftoneDots
          image={seedImage}
          originalColors
          colorBack="#121212"
          colorFront={palette[2] ?? palette[0]}
          type="gooey"
          grid="hex"
          size={0.48}
          radius={1.2}
          contrast={0.38}
          grainMixer={0}
          grainOverlay={0}
          grainSize={0.5}
          inverted={false}
          fit="cover"
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  )
}
