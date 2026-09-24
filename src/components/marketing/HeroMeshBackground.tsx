'use client'

import { useEffect, useState } from 'react'
import { MeshGradient } from '@paper-design/shaders-react'

type Props = {
  /** Up to 10 hex colors — typically sampled from the live scale */
  colors: string[]
}

/**
 * Paper MeshGradient behind the hero. Opacity is applied on the wrapper
 * so the shader itself stays fully opaque for correct blending.
 */
export function HeroMeshBackground({ colors }: Props) {
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
      ? colors.slice(0, 4)
      : ['#0d7377', '#1aa89c', '#9fd8d2', '#1e3b3d']

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden
      style={{ opacity: 0.4 }}
    >
      <MeshGradient
        colors={palette}
        distortion={0.05}
        swirl={0.1}
        grainMixer={0}
        grainOverlay={0}
        speed={reducedMotion ? 0 : 0.24}
        scale={1}
        rotation={0}
        offsetX={0}
        offsetY={0}
        fit="cover"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}
