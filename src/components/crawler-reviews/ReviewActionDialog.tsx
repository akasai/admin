import { AlertTriangle, ShieldBan } from 'lucide-react'
import { useEffect, useState, type MutableRefObject } from 'react'
import { useCrawlerReviewAction } from '../../hooks/useCrawlerReviews'
import { useAdminToast } from '../../hooks/useAdminToast'
import { ApiError } from '../../lib/apiClient'
import { inputClass, selectClass } from '../../constants/styles'
import type { CrawlerReviewAction, CrawlerReviewDetail, ReviewActionRequest } from '../../types/crawlerReview'
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

interface ReviewActionDialogProps {
    detail: CrawlerReviewDetail
    action: CrawlerReviewAction | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onConflict: (message: string) => void
    returnFocusRef: MutableRefObject<HTMLElement | null>
}

const COPY: Record<CrawlerReviewAction, { title: string; description: string; confirm: string }> = {
    REJECT: {
        title: '거절할까요?',
        description: '합방이 아니라고 판단한 이유를 선택하세요.',
        confirm: '거절',
    },
    SUPPRESS: {
        title: '자동 검토에서 제외할까요?',
        description: '합방 여부를 확정하지 않고 이후 자동 처리 대상에서 제외합니다.',
        confirm: '제외',
    },
    HOLD: { title: '검토를 보류할까요?', description: '자동 반영을 멈추고 이후 다시 열 수 있습니다.', confirm: '보류' },
    REOPEN: { title: '검토를 다시 열까요?', description: '현재 서버 버전을 기준으로 검토 큐에 되돌립니다.', confirm: '다시 열기' },
    DISPUTE: {
        title: '분쟁 상태로 표시할까요?',
        description: '승인된 판정을 확정 상태로 보존하고 수동 확인 대상으로 표시합니다.',
        confirm: '분쟁 표시',
    },
    AUTO_AUDIT_CONFIRM: {
        title: 'AUTO 감사를 확정할까요?',
        description: '최신 AUTO 반영 결과와 보존 중인 근거를 확인한 COLLAB 정답 개정을 만듭니다. 일정 상태는 PROMOTED/CLOSED로 유지됩니다.',
        confirm: 'AUTO 감사 확정',
    },
}

function actionErrorMessage(error: Error | null): string | null {
    if (error === null) return null
    if (!(error instanceof ApiError)) return '네트워크 요청을 완료하지 못했습니다. 같은 요청 키로 다시 시도할 수 있습니다.'
    if (error.code === 'CRAWLER_INVALID_TRANSITION') return '현재 상태에서는 이 작업을 실행할 수 없습니다. 상세를 새로고침해 주세요.'
    if (error.code === 'IDEMPOTENCY_KEY_REUSED') return '동일한 요청 키가 다른 내용에 사용되었습니다. 창을 닫고 다시 확인해 주세요.'
    return error.message
}

export function ReviewActionDialog({ detail, action, open, onOpenChange, onConflict, returnFocusRef }: ReviewActionDialogProps) {
    const mutation = useCrawlerReviewAction()
    const resetMutation = mutation.reset
    const { addToast } = useAdminToast()
    const [reasonCode, setReasonCode] = useState('MANUAL_REVIEW')
    const [note, setNote] = useState('')
    const [addExclusion, setAddExclusion] = useState(false)
    const [evidenceId, setEvidenceId] = useState('')
    const [confirmedIntent, setConfirmedIntent] = useState<ReviewActionRequest | null>(null)

    useEffect(() => {
        setReasonCode(open && action === 'REJECT' ? 'FALSE_POSITIVE' : 'MANUAL_REVIEW')
        setNote('')
        setAddExclusion(false)
        setEvidenceId('')
        setConfirmedIntent(null)
        resetMutation()
    }, [action, open, resetMutation])

    if (action === null) return null
    const activeAction: CrawlerReviewAction = action
    const copy = COPY[activeAction]
    const exclusionInvalid = activeAction === 'SUPPRESS' && addExclusion && evidenceId.length === 0

    function confirm() {
        if (exclusionInvalid) return
        const request: ReviewActionRequest = confirmedIntent ?? {
            action: activeAction,
            expectedVersion: detail.version,
            idempotencyKey: createUuid(),
            reason: `${reasonCode}${note.trim().length > 0 ? `: ${note.trim()}` : ''}`,
            exclusionEvidenceKey: activeAction === 'SUPPRESS' && addExclusion ? evidenceId : null,
        }
        setConfirmedIntent(request)
        mutation.mutate(
            { detectionId: detail.detectionId, body: request },
            {
                onSuccess: () => {
                    addToast({ variant: 'success', message: `${copy.confirm} 작업이 반영되었습니다.` })
                    onOpenChange(false)
                },
                onError: (error) => {
                    if (error instanceof ApiError && (error.code === 'CRAWLER_VERSION_CONFLICT' || error.status === 409)) {
                        onOpenChange(false)
                        onConflict('서버 버전이 변경되었습니다. 최신 상세를 확인한 뒤 작업을 다시 확정해 주세요.')
                    }
                },
            },
        )
    }

    function resetIntent() {
        if (confirmedIntent !== null) setConfirmedIntent(null)
        if (mutation.isError) mutation.reset()
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent
                className="max-h-[calc(100vh-1rem)] max-w-[calc(100vw-1rem)] overflow-y-auto border-border bg-bg-secondary"
                onCloseAutoFocus={(event) => {
                    if (returnFocusRef.current === null) return
                    event.preventDefault()
                    returnFocusRef.current.focus()
                    returnFocusRef.current = null
                }}
            >
                <AlertDialogHeader>
                    <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-[var(--radius-input)] bg-[var(--color-warning-soft)] text-[var(--color-warning)]">
                        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <AlertDialogTitle>{copy.title}</AlertDialogTitle>
                    <AlertDialogDescription>{copy.description}</AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-3">
                    <label className="block">
                        <span className="mb-1 block text-xs font-semibold text-text-muted">
                            {activeAction === 'REJECT' ? '거절 이유' : '처리 이유'}
                        </span>
                        <select
                            value={reasonCode}
                            onChange={(event) => {
                                setReasonCode(event.target.value)
                                resetIntent()
                            }}
                            className={selectClass}
                        >
                            <option value="MANUAL_REVIEW">수동 검토</option>
                            <option value="FALSE_POSITIVE">오탐</option>
                            <option value="DUPLICATE">중복</option>
                            <option value="INSUFFICIENT_EVIDENCE">근거 부족</option>
                            <option value="POLICY_EXCLUSION">정책 제외</option>
                            <option value="CANONICAL_CONFLICT">정규 일정 충돌</option>
                        </select>
                    </label>
                    <label className="block">
                        <span className="mb-1 block text-xs font-semibold text-text-muted">
                            추가 메모 <span className="font-normal text-text-dim">(선택)</span>
                        </span>
                        <textarea
                            value={note}
                            onChange={(event) => {
                                setNote(event.target.value)
                                resetIntent()
                            }}
                            maxLength={500}
                            rows={3}
                            className={`${inputClass} h-auto resize-y`}
                        />
                    </label>
                    {activeAction === 'SUPPRESS' && (
                        <div className="min-w-0 rounded-[var(--radius-card)] border border-border bg-bg p-3">
                            <label className="flex min-w-0 cursor-pointer items-start gap-2">
                                <input
                                    type="checkbox"
                                    checked={addExclusion}
                                    onChange={(event) => {
                                        setAddExclusion(event.target.checked)
                                        resetIntent()
                                    }}
                                    className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                                />
                                <span className="min-w-0">
                                    <span className="flex items-center gap-1 text-xs font-semibold text-text">
                                        <ShieldBan className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                        정확한 제외 지문 추가
                                    </span>
                                    <span className="mt-1 block break-words text-[11px] leading-relaxed text-text-muted">
                                        제목 정규화값·정렬된 참여자·콘텐츠 유형이 모두 같은 경우에만 적용됩니다. 보존 기간 뒤에는 제목 대신
                                        해시 설명만 남습니다.
                                    </span>
                                </span>
                            </label>
                            {addExclusion && (
                                <label className="mt-3 block">
                                    <span className="mb-1 block text-xs font-semibold text-text-muted">근거 선택</span>
                                    <select
                                        value={evidenceId}
                                        onChange={(event) => {
                                            setEvidenceId(event.target.value)
                                            resetIntent()
                                        }}
                                        className={selectClass}
                                        aria-invalid={exclusionInvalid}
                                    >
                                        <option value="">제외 기준 근거를 선택하세요</option>
                                        {detail.evidence.map((evidence) => (
                                            <option key={evidence.evidenceKey} value={evidence.evidenceKey}>
                                                #{evidence.rank} {evidence.normalizedTitle || evidence.evidenceKey} · 관계 참여자{' '}
                                                {evidence.collabContext.relationParticipantIds.length}
                                            </option>
                                        ))}
                                    </select>
                                    {exclusionInvalid && (
                                        <span className="mt-1 block text-xs font-semibold text-live">
                                            입력 오류 · 정확한 지문을 만들 근거가 필요합니다.
                                        </span>
                                    )}
                                </label>
                            )}
                        </div>
                    )}
                    {mutation.isError && (
                        <p role="alert" className="rounded-[var(--radius-input)] border border-live/40 bg-live/10 p-2 text-xs text-live">
                            <span className="font-semibold">작업 실패 · </span>
                            {actionErrorMessage(mutation.error)}
                        </p>
                    )}
                    {confirmedIntent !== null && mutation.isError && !(mutation.error instanceof ApiError) && (
                        <p className="text-[11px] text-text-muted">재시도는 처음 확정한 동일한 UUID를 사용합니다.</p>
                    )}
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={mutation.isPending} className="border-border bg-transparent text-text-muted">
                        취소
                    </AlertDialogCancel>
                    <Button
                        type="button"
                        variant={activeAction === 'HOLD' || activeAction === 'REOPEN' ? 'primary' : 'destructive'}
                        loading={mutation.isPending}
                        disabled={exclusionInvalid}
                        onClick={confirm}
                    >
                        {confirmedIntent !== null && mutation.isError ? '같은 요청 재시도' : copy.confirm}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
