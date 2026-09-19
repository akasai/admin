import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from '@radix-ui/react-slot'

import { cn } from '@/lib/cn'

const buttonVariants = cva(
    "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md border border-transparent text-sm font-medium whitespace-nowrap transition-[background-color,color,border-color,opacity,transform] outline-none active:translate-y-px focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0 aria-invalid:border-live aria-invalid:ring-2 aria-invalid:ring-live/30 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    {
        variants: {
            variant: {
                default: 'border-primary bg-primary text-primary-ink hover:border-primary-dim hover:bg-primary-dim',
                destructive:
                    'border-live/35 bg-[var(--color-danger-soft)] text-[var(--color-danger)] hover:border-live/60 hover:bg-live/15',
                outline: 'border-border bg-card text-text-muted hover:border-text-dim hover:bg-card-hover hover:text-text',
                secondary: 'border-border bg-card text-text hover:bg-card-hover',
                ghost: 'text-text-muted hover:border-border hover:bg-card hover:text-text',
                link: 'text-primary underline-offset-4 hover:underline',
            },
            size: {
                default: 'h-10 px-4 has-[>svg]:px-3',
                xs: "h-10 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
                sm: 'h-10 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5',
                lg: 'h-11 rounded-md px-6 has-[>svg]:px-4',
                icon: 'size-10',
                'icon-xs': "size-10 rounded-md [&_svg:not([class*='size-'])]:size-3",
                'icon-sm': 'size-10',
                'icon-lg': 'size-11',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
)

const Button = React.forwardRef<
    HTMLButtonElement,
    React.ComponentProps<'button'> &
        VariantProps<typeof buttonVariants> & {
            asChild?: boolean
        }
>(({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'

    return (
        <Comp
            ref={ref}
            data-slot="button"
            data-variant={variant}
            data-size={size}
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
        />
    )
})
Button.displayName = 'Button'

export { Button, buttonVariants }
