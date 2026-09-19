import { AlertTriangle } from 'lucide-react'
import { ModalOverlay } from './ModalOverlay'
import { Button } from './ui/Button'

interface ConfirmModalProps {
    title: string
    message: string
    itemName: string
    confirmLabel?: string
    pendingLabel?: string
    pending: boolean
    onClose: () => void
    onConfirm: () => void
}

export function ConfirmModal({
    title,
    message,
    itemName,
    confirmLabel = '삭제',
    pendingLabel = '삭제 중...',
    pending,
    onClose,
    onConfirm,
}: ConfirmModalProps) {
    return (
        <ModalOverlay ariaLabel={title} size="sm" disabled={pending} onClose={onClose}>
            <div className="px-5 pb-5 pt-6 sm:px-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md border border-live/35 bg-[var(--color-danger-soft)] text-[var(--color-danger)]">
                    <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="text-base font-bold tracking-[-0.015em] text-text">{title}</h3>
                <p className="mt-2 break-words text-sm leading-6 text-text-muted">
                    <span className="font-semibold text-text">{itemName}</span> {message}
                </p>
            </div>
            <div className="flex gap-2 border-t border-border bg-bg px-5 py-4 sm:px-6">
                <Button type="button" variant="outline" onClick={onClose} disabled={pending} className="min-w-0 flex-1">
                    취소
                </Button>
                <Button
                    type="button"
                    variant="destructive"
                    onClick={onConfirm}
                    disabled={pending}
                    loading={pending}
                    className="min-w-0 flex-1"
                >
                    {pending ? pendingLabel : confirmLabel}
                </Button>
            </div>
        </ModalOverlay>
    )
}
