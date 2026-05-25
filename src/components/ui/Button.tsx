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
    'inline-flex items-center justify-center gap-2 font-medium cursor-pointer select-none transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50'

const variants: Record<ButtonVariant, string> = {
    primary: 'bg-primary text-white hover:bg-primary-dim shadow-sm rounded-md',
    outline: 'border border-border/50 bg-card text-text-muted hover:border-border hover:bg-card-hover hover:text-text rounded-md',
    ghost: 'text-text-muted hover:bg-card-hover hover:text-text rounded-md',
    destructive: 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 rounded-md',
}

const sizes: Record<ButtonSize, string> = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-9 px-4 text-sm',
    lg: 'h-11 px-6 text-base',
    icon: 'h-9 w-9',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = 'primary', size = 'md', loading = false, leftIcon, rightIcon, className, disabled, children, ...props }, ref) => {
        return (
            <button ref={ref} disabled={disabled || loading} className={cn(BASE, variants[variant], sizes[size], className)} {...props}>
                {loading ? (
                    <svg
                        className="h-4 w-4 animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                ) : (
                    leftIcon
                )}
                {children}
                {!loading && rightIcon}
            </button>
        )
    },
)

Button.displayName = 'Button'
