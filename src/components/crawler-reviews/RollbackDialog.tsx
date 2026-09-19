import { RotateCcw } from 'lucide-react'
import { useEffect, useState, type MutableRefObject } from 'react'
import { useRollbackCrawlerPromotion } from '../../hooks/useCrawlerReviews'
import { useAdminToast } from '../../hooks/useAdminToast'
import { ApiError } from '../../lib/apiClient'
import { inputClass } from '../../constants/styles'
import type { CrawlerReviewDetail, RollbackPromotionRequest } from '../../types/crawlerReview'
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../shadcn/ui/alert-dialog'
import { Button } from '../ui/Button'
import { createUuid } from '@/lib/uuid'

interface RollbackDialogProps {
    detail: CrawlerReviewDetail
    open: boolean
    onOpenChange: (open: boolean) => void
    onConflict: (message: string) => void
    returnFocusRef: MutableRefObject<HTMLElement | null>
}

export function RollbackDialog({ detail, open, onOpenChange, onConflict, returnFocusRef }: RollbackDialogProps) {
    const mutation = useRollbackCrawlerPromotion()
    const resetMutation = mutation.reset
    const { addToast } = useAdminToast()
    const [note, setNote] = useState('')
    const [confirmedIntent, setConfirmedIntent] = useState<RollbackPromotionRequest | null>(null)

    useEffect(() => {
        if (!open) {
            setNote('')
            setConfirmedIntent(null)
            resetMutation()
        }
    }, [open, resetMutation])

    function confirm() {
        const request = confirmedIntent ?? {
            kind: 'ROLLBACK' as const,
            operationId: detail.promotion?.operationId ?? '',
            expectedVersion: detail.promotion?.version ?? 0,
            idempotencyKey: createUuid(),
            reason: `MANUAL_ROLLBACK${note.trim().length > 0 ? `: ${note.trim()}` : ''}`,
        }
        setConfirmedIntent(request)
        mutation.mutate(
            { detectionId: detail.detectionId, body: request },
            {
                onSuccess: () => {
                    addToast({ variant: 'success', message: '조건부 롤백을 요청했습니다.' })
                    onOpenChange(false)
                },
                onError: (error) => {
                    if (error instanceof ApiError && (error.code === 'CRAWLER_VERSION_CONFLICT' || error.status === 409)) {
                        onOpenChange(false)
                        onConflict('정규 일정이 반영 이후 변경되어 롤백하지 않았습니다. 현재 일정과 작업 상태를 다시 확인해 주세요.')
                    }
                },
            },
        )
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent
                className="max-w-[calc(100vw-1rem)] border-border bg-bg-secondary"
                onCloseAutoFocus={(event) => {
                    if (returnFocusRef.current === null) return
                    event.preventDefault()
                    returnFocusRef.current.focus()
                    returnFocusRef.current = null
                }}
            >
                <AlertDialogHeader>
                    <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-[var(--radius-input)] bg-live/10 text-live">
                        <RotateCcw className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <AlertDialogTitle>반영 작업을 롤백할까요?</AlertDialogTitle>
                    <AlertDialogDescription>
                        현재 정규 일정의 버전과 반영 후 내용이 모두 일치할 때만 되돌립니다. 수동 변경이 있으면 일정은 건드리지 않고 분쟁
                        상태로 전환됩니다. 생성 일정은 삭제하지 않고 숨깁니다.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <label>
                    <span className="mb-1 block text-xs font-semibold text-text-muted">
                        메모 <span className="font-normal text-text-dim">(선택)</span>
                    </span>
                    <textarea
                        value={note}
                        onChange={(event) => {
                            setNote(event.target.value)
                            setConfirmedIntent(null)
                            mutation.reset()
                        }}
                        maxLength={500}
                        rows={3}
                        className={`${inputClass} h-auto`}
                    />
                </label>
                {mutation.isError && (
                    <p role="alert" className="rounded-[var(--radius-input)] border border-live/40 bg-live/10 p-2 text-xs text-live">
                        <span className="font-semibold">롤백 실패 · </span>
                        {mutation.error instanceof ApiError
                            ? mutation.error.message
                            : '네트워크 오류가 발생했습니다. 같은 요청 키로 재시도할 수 있습니다.'}
                    </p>
                )}
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={mutation.isPending} className="border-border bg-transparent text-text-muted">
                        취소
                    </AlertDialogCancel>
                    <Button type="button" variant="destructive" loading={mutation.isPending} onClick={confirm}>
                        {confirmedIntent !== null && mutation.isError ? '같은 요청 재시도' : '조건부 롤백'}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
