import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from '@radix-ui/react-slot'

import { cn } from '@/lib/cn'

const badgeVariants = cva(
    'inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-[background-color,color,border-color,box-shadow] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg aria-invalid:border-live aria-invalid:ring-2 aria-invalid:ring-live/30 [&>svg]:pointer-events-none [&>svg]:size-3',
    {
        variants: {
            variant: {
                default: 'border-primary/35 bg-primary/10 text-primary [a&]:hover:bg-primary/15',
                secondary: 'border-border bg-card text-text-muted [a&]:hover:bg-card-hover [a&]:hover:text-text',
                destructive: 'border-live/35 bg-[var(--color-danger-soft)] text-[var(--color-danger)] [a&]:hover:bg-live/15',
                outline: 'border-border text-text-muted [a&]:hover:bg-card [a&]:hover:text-text',
                ghost: 'text-text-muted [a&]:hover:bg-card [a&]:hover:text-text',
                link: 'text-primary underline-offset-4 [a&]:hover:underline',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
)

function Badge({
    className,
    variant = 'default',
    asChild = false,
    ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
    const Comp = asChild ? Slot : 'span'

    return <Comp data-slot="badge" data-variant={variant} className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
