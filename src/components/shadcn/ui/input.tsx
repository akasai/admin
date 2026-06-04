import * as React from "react"

import { cn } from "@/lib/cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-border bg-card-hover px-3 py-1 text-base text-text shadow-xs transition-[color,box-shadow] outline-none placeholder:text-text-muted disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
