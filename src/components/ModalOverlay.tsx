import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '../lib/cn'

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '5xl'

const sizeMap: Record<ModalSize, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '5xl': 'max-w-5xl',
}

interface ModalOverlayProps {
    ariaLabel: string
    size?: ModalSize
    disabled?: boolean
    onClose: () => void
    children: React.ReactNode
}

export function ModalOverlay({ ariaLabel, size = 'lg', disabled = false, onClose, children }: ModalOverlayProps) {
    return (
        <Dialog.Root
            open
            onOpenChange={(open) => {
                if (!open && !disabled) onClose()
            }}
        >
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-bg/85 backdrop-blur-sm transition-opacity duration-[var(--dur-short)] data-[state=closed]:opacity-0 data-[state=open]:opacity-100" />
                <Dialog.Content
                    aria-describedby={undefined}
                    onEscapeKeyDown={(event) => {
                        if (disabled) event.preventDefault()
                    }}
                    onPointerDownOutside={(event) => {
                        if (disabled) event.preventDefault()
                    }}
                    className={cn(
                        'fixed left-1/2 top-1/2 z-[60] max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg border border-border bg-bg-secondary text-text shadow-modal-center outline-none transition-[opacity,transform] duration-[var(--dur-short)] data-[state=closed]:-translate-y-[48%] data-[state=closed]:opacity-0 data-[state=open]:opacity-100',
                        sizeMap[size],
                    )}
                >
                    <Dialog.Title className="sr-only">{ariaLabel}</Dialog.Title>
                    {children}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
