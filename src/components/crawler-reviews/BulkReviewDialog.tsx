import { CheckCheck, Eye, EyeOff, FileWarning, XCircle } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useCrawlerBulkAction, useCrawlerBulkPreview } from '../../hooks/useCrawlerReviews'
import { useAdminToast } from '../../hooks/useAdminToast'
import { ApiError } from '../../lib/apiClient'
import type { BulkActionRequest, BulkPreviewRequest, CrawlerReviewListItem, DesiredVisibility } from '../../types/crawlerReview'
import { inputClass } from '../../constants/styles'
import { Button } from '../ui/Button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../shadcn/ui/dialog'
import { createUuid } from '@/lib/uuid'

interface BulkReviewDialogProps {
    items: CrawlerReviewListItem[]
    action: 'APPROVE_CREATE' | 'REJECT' | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onConflict: (message: string) => void
    onCompleted: () => void
}

const BULK_SLOT_FORMATTER = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
})

function observedSlotLabel(value: string): string {
    const date = new Date(value)
    return Number.isFinite(date.getTime()) ? BULK_SLOT_FORMATTER.format(date) : '관측 배치 확인 필요'
}

function conflictLabel(code: string | null): string {
    if (code === 'CRAWLER_START_ESTIMATE_UNAVAILABLE')
        return '최초 관측 배치를 확인할 수 없습니다. 단건 승인에서 날짜·시간을 직접 입력하세요.'
    return code ?? '불완전 payload'
}

export function BulkReviewDialog({ items, action, open, onOpenChange, onConflict, onCompleted }: BulkReviewDialogProps) {
    const preview = useCrawlerBulkPreview()
    const apply = useCrawlerBulkAction()
    const { mutate: mutatePreview } = preview
    const { mutate: mutateApply, reset: resetApply } = apply
    const { addToast } = useAdminToast()
    const [desiredVisibility, setDesiredVisibility] = useState<DesiredVisibility>('HIDDEN')
    const [reason, setReason] = useState('BULK_REVIEW')
    const [note, setNote] = useState('')
    const [confirmedIntent, setConfirmedIntent] = useState<BulkActionRequest | null>(null)

    const previewRequest = useCallback(
        (visibility: DesiredVisibility): BulkPreviewRequest | null => {
            if (action === null || items.length === 0) return null
            return {
                action: action === 'APPROVE_CREATE' ? 'APPROVE' : 'REJECT',
                desiredVisibility: action === 'APPROVE_CREATE' ? visibility === 'VISIBLE' : null,
                items: items.map((item) => ({
                    detectionId: item.detectionId,
                    expectedVersion: item.version,
                })),
            }
        },
        [action, items],
    )

    useEffect(() => {
        if (!open) return
        setDesiredVisibility('HIDDEN')
        setReason(action === 'APPROVE_CREATE' ? 'BULK_APPROVAL' : 'BULK_REJECT')
        setNote('')
        setConfirmedIntent(null)
        resetApply()
        const request = previewRequest('HIDDEN')
        if (request !== null) mutatePreview(request)
    }, [action, mutatePreview, open, previewRequest, resetApply])

    if (action === null) return null
    const eligibleItems =
        preview.data?.items.filter(
            (item) => item.eligible && (action === 'REJECT' || (item.canonicalPayload !== null && item.scheduleEstimate !== null)),
        ) ?? []
    const hasBlocked = preview.data !== undefined && eligibleItems.length !== preview.data.items.length
    const canApply = preview.isSuccess && eligibleItems.length > 0 && !hasBlocked

    function selectVisibility(visibility: DesiredVisibility) {
        setDesiredVisibility(visibility)
        setConfirmedIntent(null)
        resetApply()
        const request = previewRequest(visibility)
        if (request !== null) mutatePreview(request)
    }

    function confirm() {
        if (!canApply) return
        const request = confirmedIntent ?? {
            action: action === 'APPROVE_CREATE' ? ('APPROVE' as const) : ('REJECT' as const),
            desiredVisibility: action === 'APPROVE_CREATE' ? desiredVisibility === 'VISIBLE' : null,
            reason: `${reason}${note.trim().length > 0 ? `: ${note.trim()}` : ''}`,
            items: eligibleItems.map((item) => ({
                detectionId: item.detectionId,
                expectedVersion: item.expectedVersion,
                idempotencyKey: createUuid(),
                canonicalPayload: item.canonicalPayload,
                editedCanonical: false,
            })),
        }
        setConfirmedIntent(request)
        mutateApply(request, {
            onSuccess: (response) => {
                const failed = response.items.filter((item) => item.error !== null)
                if (failed.length > 0) {
                    onConflict(`${failed.length}개 항목은 버전 또는 전이 충돌로 반영하지 않았습니다. 목록을 다시 확인해 주세요.`)
                } else {
                    addToast({
                        variant: 'success',
                        message:
                            action === 'APPROVE_CREATE'
                                ? `${response.items.length}개 새 일정 반영을 요청했습니다.`
                                : `${response.items.length}개 탐지를 거절했습니다.`,
                    })
                }
                onCompleted()
                onOpenChange(false)
            },
            onError: (error) => {
                if (error instanceof ApiError && (error.code === 'CRAWLER_VERSION_CONFLICT' || error.status === 409)) {
                    onOpenChange(false)
                    onConflict('일괄 대상 중 서버 버전이 변경된 항목이 있습니다. 목록을 다시 확인하고 새로 선택해 주세요.')
                }
            },
        })
    }

    const retryPreview = () => {
        const request = previewRequest(desiredVisibility)
        if (request !== null) mutatePreview(request)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[calc(100vh-1rem)] max-w-[calc(100vw-1rem)] overflow-y-auto border-border bg-bg-secondary sm:max-w-2xl">
                <DialogHeader>
                    <div
                        className={`mb-1 flex h-10 w-10 items-center justify-center rounded-[var(--radius-input)] ${
                            action === 'APPROVE_CREATE' ? 'bg-primary/10 text-primary' : 'bg-live/10 text-live'
                        }`}
                    >
                        {action === 'APPROVE_CREATE' ? (
                            <CheckCheck className="h-5 w-5" aria-hidden="true" />
                        ) : (
                            <XCircle className="h-5 w-5" aria-hidden="true" />
                        )}
                    </div>
                    <DialogTitle>{action === 'APPROVE_CREATE' ? '새 일정 일괄 승인 미리보기' : '탐지 일괄 거절 미리보기'}</DialogTitle>
                    <DialogDescription>
                        {action === 'APPROVE_CREATE'
                            ? '서버가 현재 버전에서 충돌 없는 완전한 CREATE 정규 payload를 도출한 항목만 처리합니다. 병합·수정은 상세에서 개별 확인합니다.'
                            : '서버가 현재 버전에서 거절 가능한 항목인지 미리 확인합니다.'}
                    </DialogDescription>
                </DialogHeader>

                {preview.isPending && (
                    <div role="status" className="py-10 text-center text-sm text-text-muted">
                        <p className="font-semibold text-text">미리보기 확인 중</p>
                        <p className="mt-1 text-xs">서버에서 {items.length}개 항목의 최신 버전과 정규 payload를 확인하고 있습니다.</p>
                    </div>
                )}
                {preview.isError && (
                    <div role="alert" className="rounded-[var(--radius-card)] border border-live/40 bg-live/10 p-3 text-sm text-live">
                        <p className="font-semibold">미리보기 실패 · 일괄 미리보기를 불러오지 못했습니다.</p>
                        <Button type="button" size="sm" variant="ghost" className="mt-2" onClick={retryPreview}>
                            다시 시도
                        </Button>
                    </div>
                )}
                {preview.data !== undefined && (
                    <div className="min-w-0 overflow-hidden rounded-[var(--radius-card)] border border-border">
                        <div className="grid grid-cols-[minmax(0,1fr)_9rem] bg-bg px-3 py-2 text-[10px] font-bold uppercase tracking-[var(--tracking-label)] text-text-dim">
                            <span>탐지와 추정 일정</span>
                            <span>검증</span>
                        </div>
                        <ul className="max-h-64 divide-y divide-border overflow-y-auto">
                            {preview.data.items.map((item) => {
                                const eligible =
                                    item.eligible &&
                                    (action === 'REJECT' || (item.canonicalPayload !== null && item.scheduleEstimate !== null))
                                return (
                                    <li
                                        key={item.detectionId}
                                        className="grid min-w-0 grid-cols-[minmax(0,1fr)_9rem] items-start gap-2 px-3 py-2 text-xs"
                                    >
                                        <span className="min-w-0">
                                            <span className="block break-all font-mono text-text">{item.detectionId}</span>
                                            {action === 'APPROVE_CREATE' &&
                                                item.canonicalPayload !== null &&
                                                item.scheduleEstimate !== null && (
                                                    <>
                                                        <span className="mt-1 block break-words text-text-muted">
                                                            추정 일정 · {item.canonicalPayload.startDate}{' '}
                                                            {item.canonicalPayload.startTime ?? '시간 미정'}
                                                        </span>
                                                        <span className="mt-0.5 block break-words text-[10px] leading-4 text-text-dim">
                                                            최초 합방 관측 배치 {observedSlotLabel(item.scheduleEstimate.firstObservedSlot)}{' '}
                                                            KST의 15분 전 · 실제 시작 확정 시각 아님
                                                        </span>
                                                    </>
                                                )}
                                        </span>
                                        <span className={eligible ? 'text-primary' : 'break-words text-live'}>
                                            <span className="font-semibold">{eligible ? '가능 · ' : '차단 · '}</span>
                                            {eligible ? '처리 가능' : conflictLabel(item.conflictCode)}
                                        </span>
                                    </li>
                                )
                            })}
                        </ul>
                        <div className="flex flex-wrap justify-between gap-2 bg-bg px-3 py-2 text-xs">
                            <span className="text-text-muted">처리 가능 {eligibleItems.length}</span>
                            <span className={hasBlocked ? 'text-live' : 'text-primary'}>
                                {hasBlocked ? '차단됨 · ' : '차단 없음 · '}
                                {preview.data.items.length - eligibleItems.length}개
                            </span>
                        </div>
                    </div>
                )}

                {action === 'APPROVE_CREATE' && preview.isSuccess && (
                    <fieldset className="rounded-[var(--radius-card)] border border-border bg-bg p-3">
                        <legend className="px-1 text-xs font-bold uppercase tracking-[var(--tracking-label)] text-text-dim">
                            원하는 공개 상태
                        </legend>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <button
                                type="button"
                                aria-pressed={desiredVisibility === 'HIDDEN'}
                                onClick={() => selectVisibility('HIDDEN')}
                                className={`rounded-[var(--radius-input)] border p-3 text-left text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                                    desiredVisibility === 'HIDDEN'
                                        ? 'border-[var(--color-warning)]/40 bg-[var(--color-warning-soft)] text-text'
                                        : 'border-border text-text-dim'
                                }`}
                            >
                                <EyeOff className="mb-1 h-4 w-4 text-[var(--color-warning)]" aria-hidden="true" />
                                <strong className="block">비공개 초안</strong>
                                <span className="mt-1 block break-words text-[10px] text-text-muted">DRAFT_APPLIED · PROMOTED 아님</span>
                            </button>
                            <button
                                type="button"
                                aria-pressed={desiredVisibility === 'VISIBLE'}
                                onClick={() => selectVisibility('VISIBLE')}
                                className={`rounded-[var(--radius-input)] border p-3 text-left text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                                    desiredVisibility === 'VISIBLE'
                                        ? 'border-primary/40 bg-primary/10 text-text'
                                        : 'border-border text-text-dim'
                                }`}
                            >
                                <Eye className="mb-1 h-4 w-4 text-primary" aria-hidden="true" />
                                <strong className="block">공개 일정</strong>
                                <span className="mt-1 block break-words text-[10px] text-text-muted">APPLIED 완료 시 PROMOTED</span>
                            </button>
                        </div>
                    </fieldset>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                    <label>
                        <span className="mb-1 block text-xs font-semibold text-text-muted">사유</span>
                        <input
                            value={reason}
                            onChange={(event) => {
                                setReason(event.target.value)
                                setConfirmedIntent(null)
                                resetApply()
                            }}
                            className={inputClass}
                            maxLength={200}
                        />
                    </label>
                    <label>
                        <span className="mb-1 block text-xs font-semibold text-text-muted">
                            메모 <span className="font-normal text-text-dim">(선택)</span>
                        </span>
                        <input
                            value={note}
                            onChange={(event) => {
                                setNote(event.target.value)
                                setConfirmedIntent(null)
                                resetApply()
                            }}
                            className={inputClass}
                            maxLength={500}
                        />
                    </label>
                </div>
                {hasBlocked && (
                    <div
                        role="alert"
                        className="flex gap-2 rounded-[var(--radius-input)] border border-[var(--color-warning)]/40 bg-[var(--color-warning-soft)] p-3 text-xs text-text"
                    >
                        <FileWarning className="h-4 w-4 shrink-0 text-[var(--color-warning)]" aria-hidden="true" />
                        <span>
                            <strong>적용 차단 · </strong>차단된 항목이 포함되어 있어 적용할 수 없습니다. 창을 닫고 처리 가능한 항목만 다시
                            선택해 주세요.
                        </span>
                    </div>
                )}
                {apply.isError && (
                    <p role="alert" className="rounded-[var(--radius-input)] border border-live/40 bg-live/10 p-2 text-xs text-live">
                        <span className="font-semibold">일괄 작업 실패 · </span>
                        {apply.error instanceof ApiError
                            ? apply.error.message
                            : '네트워크 오류가 발생했습니다. 같은 항목별 요청 키로 재시도할 수 있습니다.'}
                    </p>
                )}
                <DialogFooter>
                    <Button type="button" variant="ghost" disabled={apply.isPending} onClick={() => onOpenChange(false)}>
                        취소
                    </Button>
                    <Button
                        type="button"
                        variant={action === 'REJECT' ? 'destructive' : 'primary'}
                        loading={apply.isPending}
                        disabled={!canApply || reason.trim().length === 0}
                        onClick={confirm}
                    >
                        {confirmedIntent !== null && apply.isError
                            ? '같은 요청 재시도'
                            : action === 'APPROVE_CREATE'
                              ? `${eligibleItems.length}개 승인`
                              : `${eligibleItems.length}개 거절`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
