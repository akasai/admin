import { forwardRef } from 'react'
import { cn } from '../../lib/cn'

export type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'destructive'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant
    size?: ButtonSize
    loading?: boolean
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
}

const BASE =
    'inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap rounded-md font-semibold transition-[background-color,color,border-color,opacity,transform] duration-[var(--dur-short)] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-45 disabled:active:translate-y-0'

const variants: Record<ButtonVariant, string> = {
    primary: 'border border-primary bg-primary text-primary-ink hover:border-primary-dim hover:bg-primary-dim',
    outline: 'border border-border bg-card text-text-muted hover:border-text-dim hover:bg-card-hover hover:text-text',
    ghost: 'border border-transparent text-text-muted hover:border-border hover:bg-card hover:text-text',
    destructive: 'border border-live/35 bg-[var(--color-danger-soft)] text-[var(--color-danger)] hover:border-live/60 hover:bg-live/15',
}

const sizes: Record<ButtonSize, string> = {
    sm: 'h-10 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-11 px-5 text-sm',
    icon: 'h-10 w-10',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = 'primary', size = 'md', loading = false, leftIcon, rightIcon, className, disabled, children, ...props }, ref) => (
        <button
            ref={ref}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
            className={cn(BASE, variants[variant], sizes[size], className)}
            {...props}
        >
            {loading ? (
                <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            ) : (
                leftIcon
            )}
            {children}
            {!loading && rightIcon}
        </button>
    ),
)

Button.displayName = 'Button'
