import { cn } from '../lib/cn'
import { Button } from './ui/Button'

interface ListLoadingProps {
    className?: string
    rows?: number
}

export function ListLoading({ className = 'py-12', rows = 4 }: ListLoadingProps) {
    return (
        <div role="status" aria-live="polite" aria-busy="true" className={className}>
            <span className="sr-only">데이터를 불러오는 중입니다.</span>
            <div className="space-y-3 px-4" aria-hidden="true">
                {Array.from({ length: rows }, (_, index) => (
                    <div
                        key={index}
                        className="flex animate-pulse items-center gap-4 rounded-md border border-border/60 bg-card/35 px-3 py-3"
                    >
                        <div className="h-9 w-9 shrink-0 rounded-md bg-card-hover" />
                        <div className="min-w-0 flex-1 space-y-2">
                            <div className="h-3 w-3/5 rounded bg-card-hover" />
                            <div className="h-2.5 w-2/5 rounded bg-card-hover" />
                        </div>
                        <div className="hidden h-3 w-16 shrink-0 rounded bg-card-hover sm:block" />
                    </div>
                ))}
            </div>
        </div>
    )
}

interface ListErrorProps {
    message?: string
    className?: string
    onRetry?: () => void
}

export function ListError({ message = '데이터를 불러오는 중 오류가 발생했습니다.', className = 'py-12', onRetry }: ListErrorProps) {
    return (
        <div role="alert" className={cn('flex flex-col items-center gap-3 px-4 text-center', className)}>
            <div className="h-1 w-8 rounded-full bg-live" aria-hidden="true" />
            <p className="max-w-md text-sm text-[var(--color-danger)]">{message}</p>
            {onRetry !== undefined && (
                <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                    다시 시도
                </Button>
            )}
        </div>
    )
}

interface ListEmptyProps {
    message?: string
    className?: string
}

export function ListEmpty({ message = '등록된 항목이 없습니다.', className = 'py-12' }: ListEmptyProps) {
    return (
        <div className={cn('px-4 text-center', className)}>
            <p className="text-sm text-text-dim">{message}</p>
        </div>
    )
}
