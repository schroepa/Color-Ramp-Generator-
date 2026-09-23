import { ColorGenerator } from '@/components/ColorGenerator'

export default function App() {
  return (
    <div className="app-shell relative min-h-svh overflow-x-hidden">
      <div aria-hidden className="atmosphere" />
      <div aria-hidden className="grain" />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 pb-4 pt-10 sm:px-8 sm:pt-14">
        <div className="animate-rise flex flex-col gap-4">
          <p className="font-display text-sm tracking-[0.28em] text-[var(--accent)] uppercase">
            OKLCH · Culori
          </p>
          <h1 className="font-display max-w-3xl text-5xl leading-[0.95] tracking-tight text-[var(--ink)] sm:text-6xl md:text-7xl">
            Tintfield
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-[var(--muted)] sm:text-lg">
            Turn one HEX into a nineteen-step, perceptually even ramp. Switch
            systems, stack scales, copy Tailwind-ready tokens.
          </p>
        </div>
      </header>

      <main className="relative z-10 px-5 pb-20 sm:px-8">
        <ColorGenerator />
      </main>

      <footer className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-10 text-xs text-[var(--muted)] sm:px-8">
        Color math in OKLCH via culori · Saturated / Fade / Pale
      </footer>
    </div>
  )
}
