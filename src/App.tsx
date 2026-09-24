import { ColorGenerator } from '@/components/ColorGenerator'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

export default function App() {
  return (
    <TooltipProvider>
      <div className="flex min-h-svh flex-col bg-[var(--bg)] text-[var(--text)]">
        <ColorGenerator />
        <Toaster />
      </div>
    </TooltipProvider>
  )
}
