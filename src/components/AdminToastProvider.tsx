import { type ReactNode, useCallback, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { TOAST_DEFAULT_DURATION_MS } from '../constants'
import { type AddToastInput, AdminToastContext, type ToastItem, type ToastVariant } from '../hooks/useAdminToast'
import { createUuid } from '@/lib/uuid'

function getToastStyle(variant: ToastVariant) {
    if (variant === 'error') {
        return 'border-live/40 bg-[var(--color-danger-soft)] text-text'
    }
    if (variant === 'info') {
        return 'border-border bg-card text-text'
    }
    return 'border-primary/35 bg-[var(--color-success-soft)] text-text'
}

function getToastLabel(variant: ToastVariant) {
    if (variant === 'error') return '오류'
    if (variant === 'info') return '안내'
    return '완료'
}

export function AdminToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([])

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, [])

    const addToast = useCallback(
        ({ message, variant = 'success', duration = TOAST_DEFAULT_DURATION_MS }: AddToastInput) => {
            const id = createUuid()
            setToasts((prev) => [...prev, { id, message, variant }])
            if (duration > 0) {
                window.setTimeout(() => removeToast(id), duration)
            }
        },
        [removeToast],
    )

    const value = useMemo(() => ({ addToast }), [addToast])

    return (
        <AdminToastContext.Provider value={value}>
            {children}
            <div
                className="pointer-events-none fixed inset-x-4 bottom-4 z-[70] flex max-w-[calc(100vw-2rem)] flex-col gap-2 sm:left-auto sm:right-6 sm:bottom-6 sm:w-96"
                aria-label="알림"
            >
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        role={toast.variant === 'error' ? 'alert' : 'status'}
                        aria-live={toast.variant === 'error' ? 'assertive' : 'polite'}
                        aria-atomic="true"
                        className={`pointer-events-auto rounded-lg border px-4 py-3 shadow-modal-center ${getToastStyle(toast.variant)}`}
                    >
                        <div className="flex min-w-0 items-start gap-3">
                            <div className="min-w-0 flex-1">
                                <p className="mb-0.5 text-[11px] font-semibold tracking-[0.08em] text-text-dim">
                                    {getToastLabel(toast.variant)}
                                </p>
                                <p className="break-words text-sm leading-5 text-text">{toast.message}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeToast(toast.id)}
                                className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-md text-text-muted transition-colors hover:bg-card hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                aria-label="알림 닫기"
                            >
                                <X className="h-4 w-4" aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </AdminToastContext.Provider>
    )
}
