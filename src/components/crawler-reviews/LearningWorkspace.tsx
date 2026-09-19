import { BookOpenCheck, CheckSquare, ChevronDown, Database, GitCompareArrows, Search, SquareStack } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useCrawlerLearningComparison, useCrawlerLearningRevisions, usePublishCrawlerLearningDataset } from '../../hooks/useCrawlerReviews'
import { useAdminToast } from '../../hooks/useAdminToast'
import { ApiError } from '../../lib/apiClient'
import { inputClass, selectClass } from '../../constants/styles'
import type { CrawlerLearningLabel, PublishLearningDatasetRequest } from '../../types/crawlerReview'
import { ListEmpty, ListError, ListLoading } from '../ListState'
import { Button } from '../ui/Button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../shadcn/ui/dialog'
import { createUuid } from '@/lib/uuid'
import { RelationDiagnostics } from './RelationDiagnostics'
import { ASSESSMENT_DECISION_LABELS, assessmentReasonLabel } from './reviewLabels'

interface LearningWorkspaceProps {
    cursor?: string
    query: string
    label?: CrawlerLearningLabel
    checkedIds: string[]
    onFilters: (changes: Record<string, string | null>) => void
    onCursor: (cursor: string | null) => void
    onToggleChecked: (id: string) => void
    onSetChecked: (ids: string[]) => void
    onConflict: (message: string) => void
}

const LABEL_STATUS_TEXT = {
    CURRENT: '현재 정답',
    SUPERSEDED: '후속 정답으로 교체됨',
    NEEDS_REVIEW: '후속 운영 조치로 재확인 필요',
} as const

function LearningComparisonDisclosure({ revisionId }: { revisionId: string }) {
    const [open, setOpen] = useState(false)
    const comparison = useCrawlerLearningComparison(open ? revisionId : null)
    const item = comparison.data

    return (
        <div className="min-w-0 md:col-span-2 md:col-start-2">
            <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpen((value) => !value)}
                className="flex min-h-10 items-center gap-2 rounded-[var(--radius-input)] px-2 text-xs font-semibold text-text-muted transition-colors hover:bg-bg hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
                <GitCompareArrows className="h-4 w-4 text-primary" aria-hidden="true" />
                관계 비교
                <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
            {open && (
                <div className="mt-2 min-w-0 rounded-[var(--radius-card)] border border-border bg-bg-secondary p-3">
                    {comparison.isPending ? (
                        <p role="status" className="text-xs text-text-muted">
                            source action 당시 관계 입력을 불러오는 중입니다.
                        </p>
                    ) : comparison.isError ? (
                        <div role="alert" className="flex min-w-0 flex-wrap items-center justify-between gap-2 text-xs text-live">
                            <span>당시 관계 입력을 불러오지 못했습니다.</span>
                            <Button type="button" size="sm" variant="outline" onClick={() => void comparison.refetch()}>
                                다시 시도
                            </Button>
                        </div>
                    ) : item !== undefined ? (
                        <div className="min-w-0 space-y-3">
                            <dl className="grid min-w-0 gap-2 text-xs sm:grid-cols-2 lg:grid-cols-5">
                                <div>
                                    <dt className="text-text-dim">원장 정답</dt>
                                    <dd className="mt-0.5 font-semibold text-text">{item.label}</dd>
                                </div>
                                <div>
                                    <dt className="text-text-dim">정답 상태</dt>
                                    <dd className="mt-0.5 font-semibold text-text">{LABEL_STATUS_TEXT[item.labelStatus]}</dd>
                                </div>
                                <div>
                                    <dt className="text-text-dim">source action</dt>
                                    <dd className="mt-0.5 break-all font-mono text-text">
                                        {item.sourceActionType} · v{item.sourceDetectionVersion}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-text-dim">관측 날짜</dt>
                                    <dd className="mt-0.5 font-semibold text-text">{item.observationDate ?? '연결된 관측 없음'}</dd>
                                </div>
                                <div>
                                    <dt className="text-text-dim">판정 event</dt>
                                    <dd className="mt-0.5 break-all font-mono text-text">{item.assessmentEventId ?? '없음'}</dd>
                                </div>
                            </dl>
                            {item.unavailableReason === 'NO_PRE_ACTION_ASSESSMENT' ? (
                                <p className="rounded-[var(--radius-input)] border border-[var(--color-warning)]/40 bg-[var(--color-warning-soft)] p-3 text-xs leading-relaxed text-text">
                                    source action 이전에 연결 가능한 자동 판정과 관측 근거가 없어 관계 비교를 제공하지 않습니다.
                                </p>
                            ) : item.assessment !== null && item.diagnostics !== null ? (
                                <>
                                    <div className="rounded-[var(--radius-input)] border border-border bg-bg p-3 text-xs">
                                        <p className="font-semibold text-text">
                                            당시 자동 판정 · {ASSESSMENT_DECISION_LABELS[item.assessment.decision]}
                                        </p>
                                        <p className="mt-1 text-text-muted">{assessmentReasonLabel(item.assessment)}</p>
                                    </div>
                                    <RelationDiagnostics diagnostics={item.diagnostics} />
                                </>
                            ) : (
                                <p className="text-xs text-live">관계 비교 응답이 완전하지 않습니다.</p>
                            )}
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    )
}

export function LearningWorkspace({
    cursor,
    query,
    label,
    checkedIds,
    onFilters,
    onCursor,
    onToggleChecked,
    onSetChecked,
    onConflict,
}: LearningWorkspaceProps) {
    const revisions = useCrawlerLearningRevisions({ cursor, query: query || undefined, label })
    const publish = usePublishCrawlerLearningDataset()
    const { addToast } = useAdminToast()
    const [draftQuery, setDraftQuery] = useState(query)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [datasetName, setDatasetName] = useState('')
    const [confirmedIntent, setConfirmedIntent] = useState<PublishLearningDatasetRequest | null>(null)
    const [expectedVersion, setExpectedVersion] = useState(0)
    const [versionConflict, setVersionConflict] = useState<string | null>(null)

    useEffect(() => setDraftQuery(query), [query])
    const pageIds = revisions.data?.items.map((revision) => revision.id) ?? []
    const allPageChecked = pageIds.length > 0 && pageIds.every((id) => checkedIds.includes(id))

    function closeDialog() {
        setDialogOpen(false)
        setDatasetName('')
        setConfirmedIntent(null)
        setExpectedVersion(0)
        setVersionConflict(null)
        publish.reset()
    }

    function publishDataset() {
        const name = datasetName.trim()
        if (name.length === 0 || checkedIds.length === 0) return
        const request = confirmedIntent ?? {
            name,
            revisionIds: [...checkedIds].sort(),
            expectedVersion,
            idempotencyKey: createUuid(),
        }
        setConfirmedIntent(request)
        publish.mutate(request, {
            onSuccess: (response) => {
                addToast({
                    variant: 'success',
                    message: `${datasetName.trim()} 데이터셋 v${response.datasetVersion}에 ${response.revisionCount}개 불변 개정을 게시했습니다.`,
                })
                onSetChecked([])
                closeDialog()
            },
            onError: (error) => {
                if (error instanceof ApiError && (error.code === 'CRAWLER_VERSION_CONFLICT' || error.status === 409)) {
                    const currentVersion = error.currentVersion ?? expectedVersion
                    setExpectedVersion(currentVersion)
                    setConfirmedIntent(null)
                    setVersionConflict(`서버의 최신 데이터셋 버전은 v${currentVersion}입니다. 선택한 개정을 다시 확인한 뒤 게시해 주세요.`)
                    void revisions.refetch()
                    onConflict(
                        '학습 데이터셋 버전이 변경되었습니다. 현재 선택과 이름을 유지했으니 최신 개정을 확인한 뒤 다시 확정해 주세요.',
                    )
                }
            },
        })
    }

    return (
        <section id="crawler-panel-learning" role="tabpanel" aria-labelledby="crawler-tab-learning" className="min-w-0 space-y-3">
            <div className="grid min-w-0 gap-3 rounded-[var(--radius-card)] border border-border bg-bg p-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <BookOpenCheck className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                        <h2 className="break-words text-sm font-bold text-text">확정 정답 개정 원장</h2>
                    </div>
                    <p className="mt-1 max-w-3xl break-words text-xs leading-relaxed text-text-muted">
                        승인 CREATE/MERGE/UPDATE, 거절, 명시적 AUTO 감사 확정만 정답을 만듭니다. 보류·재열기·억제·보상·분쟁·별칭 작업은 학습
                        정답이 아닙니다.
                    </p>
                </div>
                <Button
                    type="button"
                    disabled={checkedIds.length === 0}
                    leftIcon={<Database className="h-4 w-4" />}
                    onClick={() => setDialogOpen(true)}
                >
                    선택 {checkedIds.length}개 게시
                </Button>
            </div>
            <div className="min-w-0 rounded-[var(--radius-card)] border border-border bg-bg-secondary p-3">
                <form
                    onSubmit={(event) => {
                        event.preventDefault()
                        onFilters({ query: draftQuery.trim(), label: label ?? '' })
                    }}
                    className="grid min-w-0 gap-2 md:grid-cols-[minmax(0,1fr)_10rem_auto]"
                >
                    <label className="relative">
                        <span className="sr-only">현재 페이지 학습 개정 검색</span>
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim" />
                        <input
                            value={draftQuery}
                            onChange={(event) => setDraftQuery(event.target.value)}
                            className={`${inputClass} pl-9`}
                            placeholder="제목·카테고리·태그·판정 사유 검색"
                        />
                    </label>
                    <label>
                        <span className="sr-only">학습 라벨</span>
                        <select
                            value={label ?? ''}
                            onChange={(event) => onFilters({ query, label: event.target.value })}
                            className={selectClass}
                        >
                            <option value="">모든 라벨</option>
                            <option value="COLLAB">COLLAB</option>
                            <option value="NOT_COLLAB">NOT_COLLAB</option>
                        </select>
                    </label>
                    <Button type="submit" leftIcon={<Search className="h-4 w-4" />}>
                        검색
                    </Button>
                </form>
            </div>
            <div className="min-w-0 overflow-hidden rounded-[var(--radius-card)] border border-border bg-bg-secondary">
                <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
                    <label className="flex min-h-10 cursor-pointer items-center gap-2 text-xs text-text-muted">
                        <input
                            type="checkbox"
                            checked={allPageChecked}
                            onChange={() =>
                                onSetChecked(
                                    allPageChecked
                                        ? checkedIds.filter((id) => !pageIds.includes(id))
                                        : Array.from(new Set([...checkedIds, ...pageIds])),
                                )
                            }
                            className="h-4 w-4 accent-primary"
                        />
                        이 페이지 선택
                    </label>
                    {checkedIds.length > pageIds.filter((id) => checkedIds.includes(id)).length && (
                        <span className="text-[10px] text-[var(--color-warning)]">다른 페이지 선택 포함</span>
                    )}
                </div>
                {revisions.isLoading ? (
                    <ListLoading rows={6} />
                ) : revisions.isError ? (
                    <ListError message="학습 개정 원장을 불러오지 못했습니다." onRetry={() => void revisions.refetch()} />
                ) : revisions.data?.items.length === 0 ? (
                    <ListEmpty message="조건에 맞는 불변 개정이 없습니다." />
                ) : (
                    <div className="divide-y divide-border">
                        {revisions.data?.items.map((revision) => {
                            const evidence = revision.evidence[0]
                            const title =
                                revision.canonicalSnapshot?.title || evidence?.normalizedTitle || evidence?.title || '제목 보존 기간 만료'
                            const participantIds = evidence?.collabContext.relationParticipantIds ?? []
                            return (
                                <article
                                    key={revision.id}
                                    className="grid min-w-0 gap-3 p-3 md:grid-cols-[auto_minmax(0,1fr)_minmax(10rem,0.5fr)] md:items-center"
                                >
                                    <label className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md focus-within:ring-2 focus-within:ring-primary">
                                        <input
                                            type="checkbox"
                                            checked={checkedIds.includes(revision.id)}
                                            onChange={() => onToggleChecked(revision.id)}
                                            className="h-4 w-4 accent-primary"
                                        />
                                        <span className="sr-only">{title} 개정 선택</span>
                                    </label>
                                    <div className="min-w-0">
                                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                                            <span
                                                className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                                                    revision.label === 'COLLAB'
                                                        ? 'border-primary/40 bg-primary/10 text-primary'
                                                        : 'border-live/40 bg-live/10 text-live'
                                                }`}
                                            >
                                                {revision.label}
                                            </span>
                                            <strong className="min-w-0 break-words text-sm text-text">{title}</strong>
                                        </div>
                                        <p className="mt-1 break-all font-mono text-xs text-text-muted">
                                            {participantIds.map((id) => `#${id}`).join(', ') || '관계 참여자 없음'} ·{' '}
                                            {evidence?.collabContext.contentType ?? '유형 없음'}
                                        </p>
                                        <p className="mt-1 break-all font-mono text-[10px] text-text-dim">
                                            revision {revision.id} · example {revision.exampleId} · schema {revision.evidenceSchemaVersion}
                                        </p>
                                    </div>
                                    <div className="min-w-0 md:text-right">
                                        <p className="break-words text-xs font-medium text-text-muted">{revision.reason}</p>
                                        <p className="mt-1 break-all font-mono text-[10px] text-text-dim">
                                            rule {revision.ruleVersion ?? '—'} · classifier {revision.classifierVersion ?? '—'}
                                        </p>
                                        <time className="mt-1 block text-[10px] text-text-dim" dateTime={revision.createdAt}>
                                            {new Date(revision.createdAt).toLocaleString('ko-KR')}
                                        </time>
                                    </div>
                                    <LearningComparisonDisclosure revisionId={revision.id} />
                                </article>
                            )
                        })}
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
                        disabled={revisions.data?.nextCursor === null || revisions.data?.nextCursor === undefined}
                        onClick={() => onCursor(revisions.data?.nextCursor ?? null)}
                    >
                        다음 페이지
                    </Button>
                </div>
            </div>

            <Dialog
                open={dialogOpen}
                onOpenChange={(nextOpen) => {
                    if (!nextOpen) closeDialog()
                }}
            >
                <DialogContent className="max-w-[calc(100vw-1rem)] border-border bg-bg-secondary">
                    <DialogHeader>
                        <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-[var(--radius-input)] bg-primary/10 text-primary">
                            <SquareStack className="h-5 w-5" />
                        </div>
                        <DialogTitle>불변 학습 데이터셋 게시</DialogTitle>
                        <DialogDescription>
                            선택한 개정 ID를 정렬해 불변 manifest로 게시합니다. 게시 후 개정이나 manifest는 수정·삭제할 수 없습니다.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="rounded-[var(--radius-input)] border border-border bg-bg p-3">
                        <p className="flex items-center gap-2 text-sm text-text">
                            <CheckSquare className="h-4 w-4 text-primary" aria-hidden="true" />
                            선택한 개정 {checkedIds.length}개
                        </p>
                    </div>
                    <label>
                        <span className="mb-1 block text-xs font-semibold text-text-muted">데이터셋 이름</span>
                        <input
                            value={datasetName}
                            onChange={(event) => {
                                setDatasetName(event.target.value)
                                setConfirmedIntent(null)
                                publish.reset()
                            }}
                            className={inputClass}
                            maxLength={120}
                            placeholder="예: collab-review-2026-08"
                            autoFocus
                        />
                    </label>
                    {versionConflict !== null && (
                        <p
                            role="alert"
                            className="rounded-[var(--radius-input)] border border-[var(--color-warning)]/40 bg-[var(--color-warning-soft)] p-2 text-xs text-text"
                        >
                            <span className="font-semibold">버전 재확인 · </span>
                            {versionConflict}
                        </p>
                    )}
                    {publish.isError && (
                        <p role="alert" className="rounded-[var(--radius-input)] border border-live/40 bg-live/10 p-2 text-xs text-live">
                            <span className="font-semibold">게시 실패 · </span>
                            {publish.error instanceof ApiError
                                ? publish.error.message
                                : '네트워크 오류가 발생했습니다. 같은 요청 키로 재시도할 수 있습니다.'}
                        </p>
                    )}
                    <DialogFooter>
                        <Button type="button" variant="ghost" disabled={publish.isPending} onClick={closeDialog}>
                            취소
                        </Button>
                        <Button
                            type="button"
                            loading={publish.isPending}
                            disabled={datasetName.trim().length === 0 || checkedIds.length === 0}
                            onClick={publishDataset}
                        >
                            {confirmedIntent !== null && publish.isError ? '같은 요청 재시도' : '불변 데이터셋 게시'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </section>
    )
}
