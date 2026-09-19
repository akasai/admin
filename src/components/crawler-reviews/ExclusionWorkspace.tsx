import { Fingerprint, RotateCcw, Search, ShieldBan, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useCrawlerExclusionAction, useCrawlerExclusions } from '../../hooks/useCrawlerReviews'
import { useAdminToast } from '../../hooks/useAdminToast'
import { ApiError } from '../../lib/apiClient'
import { inputClass, selectClass } from '../../constants/styles'
import type { CrawlerExclusionItem, CrawlerExclusionStatus, ExclusionActionRequest } from '../../types/crawlerReview'
import { ListEmpty, ListError, ListLoading } from '../ListState'
import { Button } from '../ui/Button'
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../shadcn/ui/alert-dialog'
import { createUuid } from '@/lib/uuid'

interface ExclusionWorkspaceProps {
    cursor?: string
    query: string
    status?: CrawlerExclusionStatus
    onFilters: (changes: Record<string, string | null>) => void
    onCursor: (cursor: string | null) => void
    onConflict: (message: string) => void
}

export function ExclusionWorkspace({ cursor, query, status, onFilters, onCursor, onConflict }: ExclusionWorkspaceProps) {
    const exclusions = useCrawlerExclusions({ cursor, query: query || undefined, status })
    const mutation = useCrawlerExclusionAction()
    const { addToast } = useAdminToast()
    const [draftQuery, setDraftQuery] = useState(query)
    const [selected, setSelected] = useState<CrawlerExclusionItem | null>(null)
    const [note, setNote] = useState('')
    const [confirmedIntent, setConfirmedIntent] = useState<ExclusionActionRequest | null>(null)

    useEffect(() => setDraftQuery(query), [query])

    function closeDialog() {
        setSelected(null)
        setNote('')
        setConfirmedIntent(null)
        mutation.reset()
    }

    function release() {
        if (selected === null) return
        const request = confirmedIntent ?? {
            action: 'RELEASE' as const,
            expectedVersion: selected.version,
            idempotencyKey: createUuid(),
            reason: `ADMIN_RELEASE${note.trim().length > 0 ? `: ${note.trim()}` : ''}`,
        }
        setConfirmedIntent(request)
        mutation.mutate(
            { exclusionId: selected.id, body: request },
            {
                onSuccess: () => {
                    addToast({ variant: 'success', message: '정확 일치 제외를 해제하고 원 탐지를 다시 열었습니다.' })
                    closeDialog()
                },
                onError: (error) => {
                    if (error instanceof ApiError && (error.code === 'CRAWLER_VERSION_CONFLICT' || error.status === 409)) {
                        void exclusions.refetch()
                        closeDialog()
                        onConflict('제외 규칙 버전이 변경되었습니다. 목록을 새로 확인하고 다시 확정해 주세요.')
                    }
                },
            },
        )
    }

    return (
        <section id="crawler-panel-exclusions" role="tabpanel" aria-labelledby="crawler-tab-exclusions" className="min-w-0 space-y-3">
            <div className="min-w-0 rounded-[var(--radius-card)] border border-border bg-bg-secondary p-3">
                <form
                    onSubmit={(event) => {
                        event.preventDefault()
                        onFilters({ query: draftQuery.trim(), exclusionStatus: status ?? '' })
                    }}
                    className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_11rem_auto]"
                >
                    <label className="relative">
                        <span className="sr-only">현재 페이지 제외 규칙 검색</span>
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim" />
                        <input
                            value={draftQuery}
                            onChange={(event) => setDraftQuery(event.target.value)}
                            className={`${inputClass} pl-9`}
                            placeholder="현재 페이지 제목·참여자·지문 검색"
                        />
                    </label>
                    <label>
                        <span className="sr-only">제외 상태</span>
                        <select
                            value={status ?? ''}
                            onChange={(event) => onFilters({ query, exclusionStatus: event.target.value })}
                            className={selectClass}
                        >
                            <option value="">모든 상태</option>
                            <option value="ACTIVE">활성</option>
                            <option value="RELEASED">해제됨</option>
                        </select>
                    </label>
                    <Button type="submit" leftIcon={<Search className="h-4 w-4" />}>
                        검색
                    </Button>
                </form>
            </div>
            <div className="min-w-0 rounded-[var(--radius-card)] border border-border bg-bg p-3 text-xs leading-relaxed text-text-muted">
                <ShieldBan className="mr-2 inline h-4 w-4 text-primary" aria-hidden="true" />
                <strong className="font-semibold text-text">정확 일치 규칙 · </strong>
                제외는 정규화 버전·제목·정렬된 참여자 ID·콘텐츠 유형의 SHA-256 지문이 정확히 같을 때만 적용됩니다. 제목은 근거 삭제 뒤 영구
                보관하지 않습니다.
            </div>
            <div className="min-w-0 overflow-hidden rounded-[var(--radius-card)] border border-border bg-bg-secondary">
                {exclusions.isLoading ? (
                    <ListLoading rows={6} />
                ) : exclusions.isError ? (
                    <ListError message="제외 규칙을 불러오지 못했습니다." onRetry={() => void exclusions.refetch()} />
                ) : exclusions.data?.items.length === 0 ? (
                    <ListEmpty message="조건에 맞는 제외 규칙이 없습니다." />
                ) : (
                    <div className="divide-y divide-border">
                        {exclusions.data?.items.map((item) => (
                            <article
                                key={item.id}
                                className="grid min-w-0 gap-3 p-3 md:grid-cols-[minmax(0,1fr)_minmax(12rem,0.8fr)_auto] md:items-center"
                            >
                                <div className="min-w-0">
                                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                                        <Fingerprint className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                                        <strong className="min-w-0 break-words text-sm text-text">
                                            {item.title ?? '제목 보존 기간 만료'}
                                        </strong>
                                        <span
                                            className={`rounded-full border px-2 py-0.5 text-[10px] ${
                                                item.status === 'ACTIVE'
                                                    ? 'border-primary/40 bg-primary/10 text-primary'
                                                    : 'border-border bg-card text-text-muted'
                                            }`}
                                        >
                                            {item.status === 'ACTIVE' ? '활성' : '해제됨'}
                                        </span>
                                    </div>
                                    <p className="mt-1 break-all font-mono text-[10px] text-text-dim" title={item.fingerprintHash}>
                                        {item.title === null ? `hash-only ${item.fingerprintHash}` : item.fingerprintHash}
                                    </p>
                                </div>
                                <div className="min-w-0">
                                    <p className="flex items-center gap-1 text-xs text-text-dim">
                                        <Users className="h-3.5 w-3.5" aria-hidden="true" />
                                        {item.participantIds.length}명 · {item.contentType}
                                    </p>
                                    <p className="mt-1 break-all font-mono text-xs text-text-muted">
                                        {item.participantIds.map((id) => `#${id}`).join(', ') || '참여자 ID 없음'}
                                    </p>
                                    <p className="mt-1 break-all font-mono text-[10px] text-text-dim">source {item.sourceDetectionId}</p>
                                </div>
                                {item.status === 'ACTIVE' ? (
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                                        onClick={() => setSelected(item)}
                                    >
                                        정확 제외 해제
                                    </Button>
                                ) : (
                                    <time className="text-xs text-text-dim" dateTime={item.updatedAt}>
                                        {new Date(item.updatedAt).toLocaleDateString('ko-KR')}
                                    </time>
                                )}
                            </article>
                        ))}
                    </div>
                )}
                <div className="flex justify-between border-t border-border p-3">
                    <Button type="button" size="sm" variant="ghost" disabled={cursor === undefined} onClick={() => onCursor(null)}>
                        처음으로
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={exclusions.data?.nextCursor === null || exclusions.data?.nextCursor === undefined}
                        onClick={() => onCursor(exclusions.data?.nextCursor ?? null)}
                    >
                        다음 페이지
                    </Button>
                </div>
            </div>

            {selected !== null && (
                <AlertDialog
                    open
                    onOpenChange={(nextOpen) => {
                        if (!nextOpen) closeDialog()
                    }}
                >
                    <AlertDialogContent className="max-w-[calc(100vw-1rem)] border-border bg-bg-secondary">
                        <AlertDialogHeader>
                            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-[var(--radius-input)] bg-live/10 text-live">
                                <RotateCcw className="h-5 w-5" />
                            </div>
                            <AlertDialogTitle>정확 일치 제외를 해제할까요?</AlertDialogTitle>
                            <AlertDialogDescription>
                                규칙을 버전 기반으로 해제하고 원 탐지를 보상 작업으로 다시 엽니다. 과거 작업 원장은 유지됩니다.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="min-w-0 rounded-[var(--radius-input)] border border-border bg-bg p-3">
                            <p className="break-words text-sm font-semibold text-text">{selected.title ?? '제목 보존 기간 만료'}</p>
                            <p className="mt-1 break-all font-mono text-[10px] text-text-dim">{selected.fingerprintHash}</p>
                        </div>
                        <label>
                            <span className="mb-1 block text-xs font-semibold text-text-muted">
                                해제 메모 <span className="font-normal text-text-dim">(선택)</span>
                            </span>
                            <textarea
                                value={note}
                                onChange={(event) => {
                                    setNote(event.target.value)
                                    setConfirmedIntent(null)
                                    mutation.reset()
                                }}
                                rows={3}
                                maxLength={500}
                                className={`${inputClass} h-auto`}
                            />
                        </label>
                        {mutation.isError && (
                            <p
                                role="alert"
                                className="rounded-[var(--radius-input)] border border-live/40 bg-live/10 p-2 text-xs text-live"
                            >
                                <span className="font-semibold">해제 실패 · </span>
                                {mutation.error instanceof ApiError
                                    ? mutation.error.message
                                    : '네트워크 오류가 발생했습니다. 같은 요청 키로 재시도할 수 있습니다.'}
                            </p>
                        )}
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={mutation.isPending} className="border-border bg-transparent text-text-muted">
                                취소
                            </AlertDialogCancel>
                            <Button type="button" variant="destructive" loading={mutation.isPending} onClick={release}>
                                {confirmedIntent !== null && mutation.isError ? '같은 요청 재시도' : '제외 해제'}
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </section>
    )
}
