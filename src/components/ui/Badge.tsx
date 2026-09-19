import { cn } from '../../lib/cn'

export type BadgeVariant = 'default' | 'primary' | 'collab' | 'tournament' | 'content' | 'internal' | 'live' | 'outline'
export type BadgeSize = 'sm' | 'md'

export interface BadgeProps {
    variant?: BadgeVariant
    size?: BadgeSize
    className?: string
    children: React.ReactNode
}

const BASE = 'inline-flex shrink-0 items-center rounded font-semibold leading-none'

const variants: Record<BadgeVariant, string> = {
    default: 'border border-border bg-card text-text-muted',
    primary: 'border border-primary/30 bg-primary/10 text-primary',
    collab: 'border border-collab/30 bg-[var(--color-warning-soft)] text-collab',
    tournament: 'border border-collab/40 bg-[var(--color-warning-soft)] text-[var(--color-warning)]',
    content: 'border border-primary/25 bg-primary/10 text-primary',
    internal: 'border border-live/30 bg-[var(--color-danger-soft)] text-[var(--color-danger)]',
    live: 'border border-live bg-live text-text',
    outline: 'border border-border bg-transparent text-text-dim',
}

const sizes: Record<BadgeSize, string> = {
    sm: 'px-2 py-1 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
}

export function Badge({ variant = 'default', size = 'md', className, children }: BadgeProps) {
    return <span className={cn(BASE, variants[variant], sizes[size], className)}>{children}</span>
}
