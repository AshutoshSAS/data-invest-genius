import * as React from "react"
import { cn } from "@/lib/utils"

interface SheetProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

interface SheetTriggerProps {
  asChild?: boolean
  children: React.ReactNode
}

interface SheetContentProps {
  side?: "left" | "right" | "top" | "bottom"
  className?: string
  children: React.ReactNode
}

interface SheetHeaderProps {
  children: React.ReactNode
}

interface SheetTitleProps {
  children: React.ReactNode
}

export function Sheet({ open, onOpenChange, children }: SheetProps) {
  return (
    <div className={cn("sheet", open && "open")}>
      {children}
    </div>
  )
}

export function SheetTrigger({ asChild, children }: SheetTriggerProps) {
  return <>{children}</>
}

export function SheetContent({ side = "left", className, children }: SheetContentProps) {
  return (
    <div className={cn(
      "fixed inset-y-0 z-50 bg-background border-r shadow-lg transition-transform duration-300",
      side === "left" && "left-0 w-80 -translate-x-full",
      side === "right" && "right-0 w-80 translate-x-full",
      className
    )}>
      {children}
    </div>
  )
}

export function SheetHeader({ children }: SheetHeaderProps) {
  return <div className="p-6 border-b">{children}</div>
}

export function SheetTitle({ children }: SheetTitleProps) {
  return <h2 className="text-lg font-semibold">{children}</h2>
}

