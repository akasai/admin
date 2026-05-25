import { cn } from '../../lib/cn'

export type BadgeVariant = 'default' | 'primary' | 'collab' | 'tournament' | 'content' | 'internal' | 'live' | 'outline'
export type BadgeSize = 'sm' | 'md'

export interface BadgeProps {
    variant?: BadgeVariant
    size?: BadgeSize
    className?: string
    children: React.ReactNode
}

const BASE = 'inline-flex shrink-0 items-center font-semibold leading-none rounded'

const variants: Record<BadgeVariant, string> = {
    default: 'bg-gray-100 text-gray-600 border border-gray-200',
    primary: 'bg-purple-50 text-purple-700 border border-purple-200',
    collab: 'bg-violet-50 text-violet-700 border border-violet-200',
    tournament: 'bg-amber-50 text-amber-700 border border-amber-200',
    content: 'bg-blue-50 text-blue-700 border border-blue-200',
    internal: 'bg-rose-50 text-rose-700 border border-rose-200',
    live: 'bg-red-500 text-white',
    outline: 'bg-transparent text-gray-500 border border-gray-200',
}

const sizes: Record<BadgeSize, string> = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-0.5 text-[11px]',
}

export function Badge({ variant = 'default', size = 'md', className, children }: BadgeProps) {
    return <span className={cn(BASE, variants[variant], sizes[size], className)}>{children}</span>
}
