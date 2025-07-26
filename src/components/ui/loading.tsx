import { Loader2 } from "lucide-react"

export function Loading() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading Research Intelligence...</p>
      </div>
    </div>
  )
} 