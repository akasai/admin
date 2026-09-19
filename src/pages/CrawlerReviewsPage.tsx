import { AlertCircle, CheckCheck, Radio, RefreshCw, X, XCircle } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { AliasWorkspace } from '../components/crawler-reviews/AliasWorkspace'
import { BulkReviewDialog } from '../components/crawler-reviews/BulkReviewDialog'
import { CrawlerReviewTabs } from '../components/crawler-reviews/CrawlerReviewTabs'
import { ExclusionWorkspace } from '../components/crawler-reviews/ExclusionWorkspace'
import { LearningWorkspace } from '../components/crawler-reviews/LearningWorkspace'
import { PromotionDialog } from '../components/crawler-reviews/PromotionDialog'
import { ReviewActionDialog } from '../components/crawler-reviews/ReviewActionDialog'
import { ReviewDetail } from '../components/crawler-reviews/ReviewDetail'
import { ReviewFilters } from '../components/crawler-reviews/ReviewFilters'
import { ReviewList } from '../components/crawler-reviews/ReviewList'
import { RollbackDialog } from '../components/crawler-reviews/RollbackDialog'
import { Button } from '../components/ui/Button'
import { useCrawlerReview, useCrawlerReviews } from '../hooks/useCrawlerReviews'
import { useCrawlerReviewUrlState } from '../hooks/useCrawlerReviewUrlState'
import type { CrawlerReviewUrlController, CrawlerReviewUrlState } from '../hooks/useCrawlerReviewUrlState'
import type { CrawlerPromotionKind, CrawlerReviewAction, CrawlerReviewQueue, CrawlerWorkspaceTab } from '../types/crawlerReview'

function ReviewWorkspace({
    tab,
    queue,
    url,
    setFilters,
    setCursor,
    setSelectedId,
    setCheckedIds,
    toggleChecked,
}: {
    tab: CrawlerWorkspaceTab
    queue: CrawlerReviewQueue
    url: CrawlerReviewUrlState
    setFilters: CrawlerReviewUrlController['setFilters']
    setCursor: CrawlerReviewUrlController['setCursor']
    setSelectedId: CrawlerReviewUrlController['setSelectedId']
    setCheckedIds: CrawlerReviewUrlController['setCheckedIds']
    toggleChecked: CrawlerReviewUrlController['toggleChecked']
}) {
    const reviews = useCrawlerReviews({
        queue,
        cursor: url.cursor,
        query: url.query || undefined,
        decisionState: url.decisionState,
        contentType: url.contentType,
        risk: url.risk,
    })
    const detail = useCrawlerReview(url.selectedId)
    const [reviewAction, setReviewAction] = useState<CrawlerReviewAction | null>(null)
    const [promotionKind, setPromotionKind] = useState<CrawlerPromotionKind | null>(null)
    const [rollbackOpen, setRollbackOpen] = useState(false)
    const [bulkAction, setBulkAction] = useState<'APPROVE_CREATE' | 'REJECT' | null>(null)
    const [conflict, setConflict] = useState<string | null>(null)
    const dialogReturnFocusRef = useRef<HTMLElement | null>(null)
    const items = useMemo(() => reviews.data?.items ?? [], [reviews.data?.items])
    const selectedItems = useMemo(() => items.filter((item) => url.checkedIds.includes(item.detectionId)), [items, url.checkedIds])

    function reportConflict(message: string) {
        setConflict(message)
        void reviews.refetch()
        if (url.selectedId !== null) void detail.refetch()
    }

    function rememberDialogTrigger() {
        dialogReturnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    }

    return (
        <section id={`crawler-panel-${tab}`} role="tabpanel" aria-labelledby={`crawler-tab-${tab}`} className="min-w-0 space-y-3">
            <ReviewFilters
                query={url.query}
                decisionState={url.decisionState}
                contentType={url.contentType}
                risk={url.risk}
                onChange={(filters) =>
                    setFilters({
                        query: filters.query || null,
                        state: filters.decisionState || null,
                        contentType: filters.contentType || null,
                        risk: filters.risk || null,
                    })
                }
            />

            {conflict !== null && (
                <div
                    role="alert"
                    aria-live="assertive"
                    className="flex items-start justify-between gap-3 rounded-[var(--radius-card)] border border-[var(--color-warning)]/40 bg-[var(--color-warning-soft)] p-3 text-sm text-text"
                >
                    <div className="flex min-w-0 gap-2">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-warning)]" aria-hidden="true" />
                        <div className="min-w-0">
                            <p className="font-semibold">버전 충돌 · 최신 데이터로 갱신됨</p>
                            <p className="mt-1 break-words text-xs leading-relaxed text-text-muted">{conflict}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        aria-label="충돌 알림 닫기"
                        onClick={() => setConflict(null)}
                        className="min-h-10 min-w-10 shrink-0 rounded-[var(--radius-input)] text-text-muted hover:bg-card-hover hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                        <X className="mx-auto h-4 w-4" />
                    </button>
                </div>
            )}

            {url.checkedIds.length > 0 && (
                <div
                    className="sticky top-16 z-30 flex flex-col gap-3 rounded-[var(--radius-card)] border border-primary/40 bg-bg-secondary/95 p-3 shadow-[var(--shadow-card)] backdrop-blur sm:flex-row sm:items-center sm:justify-between md:top-3"
                    aria-live="polite"
                >
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-text">선택됨 · {url.checkedIds.length}개</p>
                        <p className="mt-0.5 break-words text-xs text-text-muted">
                            현재 페이지에서 최신 버전을 확인할 수 있는 {selectedItems.length}개를 미리보기합니다.
                        </p>
                    </div>
                    <div className="flex min-w-0 flex-wrap gap-2">
                        <Button
                            type="button"
                            size="sm"
                            disabled={selectedItems.length !== url.checkedIds.length || queue !== 'review'}
                            leftIcon={<CheckCheck className="h-4 w-4" />}
                            onClick={() => setBulkAction('APPROVE_CREATE')}
                        >
                            새 일정 일괄 승인
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            disabled={selectedItems.length !== url.checkedIds.length}
                            leftIcon={<XCircle className="h-4 w-4" />}
                            onClick={() => setBulkAction('REJECT')}
                        >
                            일괄 거절
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => setCheckedIds([])}>
                            선택 해제
                        </Button>
                    </div>
                </div>
            )}

            <div className="min-w-0 overflow-hidden rounded-[var(--radius-card)] border border-border bg-bg-secondary lg:grid lg:min-h-[42rem] lg:grid-cols-[minmax(20rem,0.88fr)_minmax(0,1.12fr)]">
                <div className={`${url.selectedId !== null ? 'hidden lg:block' : 'block'} min-w-0 border-border lg:border-r`}>
                    <ReviewList
                        items={items}
                        isLoading={reviews.isLoading}
                        isError={reviews.isError}
                        selectedId={url.selectedId}
                        checkedIds={url.checkedIds}
                        nextCursor={reviews.data?.nextCursor ?? null}
                        hasCursor={url.cursor !== undefined}
                        onRetry={() => void reviews.refetch()}
                        onSelect={setSelectedId}
                        onToggleChecked={toggleChecked}
                        onCheckPage={setCheckedIds}
                        onNext={() => setCursor(reviews.data?.nextCursor ?? null)}
                        onFirst={() => setCursor(null)}
                    />
                </div>
                <div className={`${url.selectedId === null ? 'hidden lg:flex' : 'block'} min-w-0 lg:items-center lg:justify-center`}>
                    {url.selectedId === null ? (
                        <div className="min-w-0 px-5 py-12 text-center">
                            <Radio className="mx-auto h-8 w-8 text-text-dim" aria-hidden="true" />
                            <p className="mt-3 text-sm font-semibold text-text-muted">
                                탐지를 선택해 정제된 근거와 정규 일정 차이를 확인하세요.
                            </p>
                            <p className="mt-1 break-words text-xs text-text-dim">
                                원본 artifact나 generic JSON은 이 화면에 노출하지 않습니다.
                            </p>
                        </div>
                    ) : (
                        <ReviewDetail
                            detail={detail.data}
                            isLoading={detail.isLoading}
                            isError={detail.isError}
                            onRetry={() => void detail.refetch()}
                            onBack={() => setSelectedId(null)}
                            onAction={(action) => {
                                rememberDialogTrigger()
                                setReviewAction(action)
                            }}
                            onPromotion={(kind) => {
                                rememberDialogTrigger()
                                setPromotionKind(kind)
                            }}
                            onRollback={() => {
                                rememberDialogTrigger()
                                setRollbackOpen(true)
                            }}
                        />
                    )}
                </div>
            </div>

            {detail.data !== undefined && (
                <>
                    <ReviewActionDialog
                        detail={detail.data}
                        action={reviewAction}
                        open={reviewAction !== null}
                        onOpenChange={(open) => {
                            if (!open) setReviewAction(null)
                        }}
                        onConflict={reportConflict}
                        returnFocusRef={dialogReturnFocusRef}
                    />
                    <PromotionDialog
                        detail={detail.data}
                        kind={promotionKind}
                        open={promotionKind !== null}
                        onOpenChange={(open) => {
                            if (!open) setPromotionKind(null)
                        }}
                        onConflict={reportConflict}
                        returnFocusRef={dialogReturnFocusRef}
                    />
                    <RollbackDialog
                        detail={detail.data}
                        open={rollbackOpen}
                        onOpenChange={setRollbackOpen}
                        onConflict={reportConflict}
                        returnFocusRef={dialogReturnFocusRef}
                    />
                </>
            )}
            <BulkReviewDialog
                items={selectedItems}
                action={bulkAction}
                open={bulkAction !== null}
                onOpenChange={(open) => {
                    if (!open) setBulkAction(null)
                }}
                onConflict={reportConflict}
                onCompleted={() => setCheckedIds([])}
            />
        </section>
    )
}

export default function CrawlerReviewsPage() {
    const { state, setTab, setFilters, setCursor, setSelectedId, setCheckedIds, toggleChecked } = useCrawlerReviewUrlState()
    const reviewQueue: CrawlerReviewQueue | null =
        state.tab === 'review'
            ? 'review'
            : state.tab === 'changes'
              ? 'changes'
              : state.tab === 'auto-audit'
                ? 'auto'
                : state.tab === 'completed'
                  ? 'completed'
                  : null
    const [workspaceConflict, setWorkspaceConflict] = useState<string | null>(null)

    return (
        <div className="min-w-0 space-y-4 pb-10">
            <header className="rounded-[var(--radius-card)] border border-border bg-bg-secondary p-3 sm:px-4">
                <div className="flex min-w-0 items-center justify-between gap-3">
                    <h1 className="min-w-0 break-words text-xl font-bold tracking-[var(--tracking-display)] text-text sm:text-2xl">
                        합방 탐지 검토
                    </h1>
                    <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="sm:w-auto sm:px-3"
                        aria-label="화면 새로고침"
                        leftIcon={<RefreshCw className="h-4 w-4" />}
                        onClick={() => window.location.reload()}
                    >
                        <span className="hidden sm:inline">화면 새로고침</span>
                    </Button>
                </div>
            </header>

            <CrawlerReviewTabs
                activeTab={state.tab}
                onChange={(tab) => {
                    setWorkspaceConflict(null)
                    setTab(tab)
                }}
            />
            {workspaceConflict !== null && (
                <div
                    role="alert"
                    className="flex items-start gap-2 rounded-[var(--radius-card)] border border-[var(--color-warning)]/40 bg-[var(--color-warning-soft)] p-3 text-sm text-text"
                >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-warning)]" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                        <p className="font-semibold">작업 영역 충돌</p>
                        <p className="mt-0.5 break-words text-xs text-text-muted">{workspaceConflict}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setWorkspaceConflict(null)}
                        aria-label="충돌 안내 닫기"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-text-muted hover:bg-card hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                        <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                </div>
            )}

            {reviewQueue !== null && (
                <ReviewWorkspace
                    tab={state.tab}
                    queue={reviewQueue}
                    url={state}
                    setFilters={setFilters}
                    setCursor={setCursor}
                    setSelectedId={setSelectedId}
                    setCheckedIds={setCheckedIds}
                    toggleChecked={toggleChecked}
                />
            )}
            {state.tab === 'aliases' && (
                <AliasWorkspace
                    cursor={state.cursor}
                    query={state.query}
                    status={state.aliasStatus}
                    onFilters={setFilters}
                    onCursor={setCursor}
                    onConflict={setWorkspaceConflict}
                />
            )}
            {state.tab === 'exclusions' && (
                <ExclusionWorkspace
                    cursor={state.cursor}
                    query={state.query}
                    status={state.exclusionStatus}
                    onFilters={setFilters}
                    onCursor={setCursor}
                    onConflict={setWorkspaceConflict}
                />
            )}
            {state.tab === 'learning' && (
                <LearningWorkspace
                    cursor={state.cursor}
                    query={state.query}
                    label={state.learningLabel}
                    checkedIds={state.checkedIds}
                    onFilters={setFilters}
                    onCursor={setCursor}
                    onToggleChecked={toggleChecked}
                    onSetChecked={setCheckedIds}
                    onConflict={setWorkspaceConflict}
                />
            )}
        </div>
    )
}
