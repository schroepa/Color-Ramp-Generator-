import { ColorGenerator } from '@/components/ColorGenerator'

export default function App() {
  return (
    <div className="flex min-h-svh flex-col bg-[var(--bg)] text-[var(--text)]">
      <ColorGenerator />
    </div>
  )
}
