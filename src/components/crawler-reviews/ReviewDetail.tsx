/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V4 */
import {
    ArrowLeft,
    Gauge,
    Check,
    ChevronDown,
    GitMerge,
    History,
    LockKeyhole,
    MoreHorizontal,
    PencilLine,
    RotateCcw,
    Sparkles,
} from 'lucide-react'
import { useRef, useState } from 'react'
import type {
    CanonicalSchedulePayload,
    CrawlerAssessmentRelationFeatures,
    CrawlerContentType,
    CrawlerDecisionState,
    CrawlerLifecycleState,
    CrawlerPromotionKind,
    CrawlerPromotionResult,
    CrawlerReviewAction,
    CrawlerReviewDetail as ReviewDetailDto,
} from '../../types/crawlerReview'
import { Button } from '../ui/Button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../shadcn/ui/dropdown-menu'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../shadcn/ui/collapsible'
import { ListError, ListLoading } from '../ListState'
import { cn } from '../../lib/cn'
import {
    ASSESSMENT_DECISION_LABELS,
    CONTENT_TYPE_LABELS,
    DECISION_LABELS,
    READINESS_LABELS,
    assessmentMethodLabel,
    assessmentReasonLabel,
} from './reviewLabels'
import { RelationDiagnostics } from './RelationDiagnostics'

interface ReviewDetailProps {
    detail?: ReviewDetailDto
    isLoading: boolean
    isError: boolean
    onRetry: () => void
    onBack: () => void
    onAction: (action: CrawlerReviewAction) => void
    onPromotion: (kind: CrawlerPromotionKind) => void
    onRollback: () => void
}

const ACTION_LABELS: Record<CrawlerReviewAction, string> = {
    REJECT: '거절',
    SUPPRESS: '자동 검토에서 제외',
    HOLD: '보류',
    REOPEN: '검토 다시 열기',
    DISPUTE: '문제 있음',
    AUTO_AUDIT_CONFIRM: '자동 반영 확인 완료',
}
const ACTION_HISTORY_LABELS: Record<string, string> = {
    ...ACTION_LABELS,
    COMPENSATE: '반영 되돌림',
    AUTO_EXPIRE: '대기 만료로 자동 제외',
    AUTO_ESCALATE: '대기 종료로 검토 전환',
    APPROVE_CREATE: '새 일정 승인',
    APPROVE_MERGE: '기존 일정 병합 승인',
    APPROVE_UPDATE: '기존 일정 수정 승인',
}

const REVIEW_REASON_LABELS: Record<string, string> = {
    MANUAL_REVIEW: '운영자 확인',
    MANUAL_ROLLBACK: '운영자 되돌림',
    EVIDENCE_EXPIRED: '추가 근거 없이 대기 시간 종료',
    PERSISTENT_GRAY_ESCALATED: '판단이 필요한 상태가 계속되어 검토로 전환',
}

const LIFECYCLE_LABELS: Record<CrawlerLifecycleState, string> = {
    OPEN: '검토 중',
    CLOSED: '검토 완료',
}

type WeightedFeatureKey = Exclude<keyof CrawlerAssessmentRelationFeatures, 'mutualRoster' | 'sharedEventKey' | 'officialRoster'>

const STRONG_RULES: readonly [
    keyof Pick<CrawlerAssessmentRelationFeatures, 'mutualRoster' | 'sharedEventKey' | 'officialRoster'>,
    string,
][] = [
    ['mutualRoster', '상호·공동 명단 근거'],
    ['sharedEventKey', '동일 행사 근거'],
    ['officialRoster', '공식 명단 근거'],
]

const WEIGHTED_INPUTS: readonly [WeightedFeatureKey, string][] = [
    ['oneWayMention', '한쪽 제목 언급'],
    ['sessionContinuity', '현행 미사용 입력'],
    ['titleSimilarity', '제목 유사도 입력'],
    ['tagSimilarity', '태그 유사도 입력'],
    ['timeOverlap', '같은 배치에서 방송 확인'],
    ['categoryMatch', '같은 카테고리 입력'],
]

const EVIDENCE_SOURCE_LABELS: Record<string, string> = {
    LIVE_SNAPSHOT: '실시간 방송 정보',
    LIVE_TITLE: '방송 제목 정보',
}

const PROMOTION_KIND_LABELS: Record<CrawlerPromotionKind, string> = {
    CREATE: '새 일정 생성',
    MERGE: '기존 일정과 병합',
    UPDATE: '기존 일정 수정',
}

const PROMOTION_RESULT_LABELS: Record<CrawlerPromotionResult, string> = {
    PENDING: '처리 대기 중',
    ACTIVE: '처리 중',
    APPLIED: '반영 완료',
    PROMOTED: '공개 일정 반영',
    DRAFT_APPLIED: '비공개 초안 반영',
    FAILED: '처리 실패',
    CANCELLED: '취소됨',
    ROLLED_BACK: '되돌림 완료',
}

const PARTICIPANT_ROLE_LABELS: Record<CanonicalSchedulePayload['participants'][number]['role'], string> = {
    host: '진행자',
    participant: '참여자',
    guest: '게스트',
}

function decisionLabel(value: string): string {
    return DECISION_LABELS[value as CrawlerDecisionState] ?? value
}

function contentTypeLabel(value: string): string {
    return CONTENT_TYPE_LABELS[value.toUpperCase() as CrawlerContentType] ?? value
}

type CanonicalComparableField = Exclude<keyof CanonicalSchedulePayload, 'participants'>

const CANONICAL_FIELDS: CanonicalComparableField[] = [
    'title',
    'broadcastType',
    'categoryId',
    'startDate',
    'startTime',
    'previousBroadcastId',
    'isVisible',
    'isDrops',
    'isChzzkSupport',
    'tags',
]

const FIELD_LABELS: Record<CanonicalComparableField, string> = {
    title: '제목',
    broadcastType: '방송 유형',
    categoryId: '카테고리',
    startDate: '시작일',
    startTime: '시작 시간',
    previousBroadcastId: '연결할 이전 방송',
    isVisible: '일정 공개',
    isDrops: '드롭스 포함',
    isChzzkSupport: '치지직 지원',
    tags: '태그',
}

const BOOLEAN_VALUE_LABELS: Partial<Record<CanonicalComparableField, readonly [string, string]>> = {
    isVisible: ['공개', '비공개'],
    isDrops: ['있음', '없음'],
    isChzzkSupport: ['지원', '미지원'],
}

function CanonicalValue({ field, value }: { field: CanonicalComparableField; value: string | string[] | boolean | null }) {
    if (value === null || (Array.isArray(value) && value.length === 0)) {
        return <span className="text-text-dim">{field === 'startTime' ? '미정' : '없음'}</span>
    }
    if (typeof value === 'boolean') {
        const labels = BOOLEAN_VALUE_LABELS[field] ?? ['예', '아니요']
        return <span className={value ? 'text-primary' : 'text-text-muted'}>{value ? labels[0] : labels[1]}</span>
    }
    if (Array.isArray(value)) return <span>{value.join(' · ')}</span>
    if (field === 'startDate') {
        const [year, month, day] = value.split('-')
        return <span>{`${year}. ${Number(month)}. ${Number(day)}.`}</span>
    }
    if (field === 'broadcastType') return <span>{contentTypeLabel(value)}</span>
    return <span>{value}</span>
}

export function ReviewDetail({ detail, isLoading, isError, onRetry, onBack, onAction, onPromotion, onRollback }: ReviewDetailProps) {
    const promotionMenuTriggerRef = useRef<HTMLButtonElement>(null)
    const otherMenuTriggerRef = useRef<HTMLButtonElement>(null)
    const pendingMenuSelectionRef = useRef<(() => void) | null>(null)
    const [calculationOpen, setCalculationOpen] = useState(false)
    const [evidenceOpen, setEvidenceOpen] = useState(false)
    if (isLoading) return <ListLoading className="py-16" rows={5} />
    if (isError || detail === undefined) return <ListError message="검토 상세를 불러오지 못했습니다." onRetry={onRetry} />

    const expiresAt = detail.evidencePurgeAfter === null ? null : Date.parse(detail.evidencePurgeAfter)
    const evidenceExpired = expiresAt !== null && Number.isFinite(expiresAt) && expiresAt <= Date.now()
    const assessmentStateDiffers = detail.assessment.decision !== detail.decisionState
    const canonicalFields = detail.proposedCanonical === null ? [] : CANONICAL_FIELDS
    const canRollback = detail.promotion !== null && (detail.promotion.result === 'PROMOTED' || detail.promotion.result === 'DRAFT_APPLIED')
    const canCreate = detail.allowedPromotionKinds.includes('CREATE')
    const participantNames: Record<string, string> = Object.fromEntries(
        detail.participants.map((participant) => [participant.id, participant.displayName ?? '이름 확인 필요']),
    )
    const latestEvidenceByParticipant = new Map<string, (typeof detail.evidence)[number]>()
    for (const evidence of detail.evidence) {
        if (evidence.participantId === null) continue
        const current = latestEvidenceByParticipant.get(evidence.participantId)
        if (current === undefined || Date.parse(evidence.observedAt) > Date.parse(current.observedAt)) {
            latestEvidenceByParticipant.set(evidence.participantId, evidence)
        }
    }
    const participantCategories = new Set<string>()
    for (const evidence of latestEvidenceByParticipant.values()) {
        const category = evidence.category?.trim()
        if (category !== undefined && category.length > 0) participantCategories.add(category)
    }
    if (participantCategories.size === 0 && detail.category !== null) participantCategories.add(detail.category)
    const existingPromotionKinds = detail.allowedPromotionKinds.filter(
        (kind): kind is 'MERGE' | 'UPDATE' => kind === 'MERGE' || kind === 'UPDATE',
    )
    const standaloneActions = detail.allowedActions.filter(
        (action): action is 'REOPEN' | 'AUTO_AUDIT_CONFIRM' => action === 'REOPEN' || action === 'AUTO_AUDIT_CONFIRM',
    )
    const primaryStandaloneAction = detail.allowedPromotionKinds.length === 0 ? standaloneActions[0] : undefined
    const directPromotionKind: CrawlerPromotionKind | undefined = canCreate
        ? 'CREATE'
        : existingPromotionKinds.length === 1
          ? existingPromotionKinds[0]
          : undefined
    const approvalPromotionKinds = directPromotionKind === undefined ? existingPromotionKinds : []
    const overflowPromotionKinds =
        directPromotionKind === undefined ? [] : detail.allowedPromotionKinds.filter((kind) => kind !== directPromotionKind)
    const rejectAvailable = detail.allowedActions.includes('REJECT')
    const overflowActions = detail.allowedActions.filter((action) => action !== 'REJECT' && action !== primaryStandaloneAction)
    const hasOverflowActions = overflowPromotionKinds.length > 0 || overflowActions.length > 0 || canRollback

    function queueMenuSelection(selection: () => void) {
        pendingMenuSelectionRef.current = selection
    }

    return (
        <section aria-labelledby="review-detail-title" className="min-w-0">
            <div className="sticky top-14 z-20 flex min-w-0 items-center justify-between gap-2 border-b border-border bg-bg-secondary/95 px-3 py-3 backdrop-blur md:top-0 lg:static">
                <div className="flex min-w-0 items-center gap-2">
                    <button
                        type="button"
                        onClick={onBack}
                        aria-label="검토 목록으로 돌아가기"
                        className="min-h-10 min-w-10 shrink-0 rounded-[var(--radius-input)] text-text-muted hover:bg-card-hover hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:hidden"
                    >
                        <ArrowLeft className="mx-auto h-4 w-4" />
                    </button>
                    <div className="min-w-0">
                        <p className="break-words text-[10px] font-semibold tracking-[var(--tracking-label)] text-primary">
                            검토 항목 #{detail.detectionId}
                        </p>
                        <h2 id="review-detail-title" className="line-clamp-2 break-words text-base font-bold text-text">
                            {detail.normalizedTitle ?? '제목 보존 기간이 지난 항목'}
                        </h2>
                    </div>
                </div>
                <span className="sr-only">현재 버전 {detail.version}</span>
            </div>

            <div className="space-y-5 p-4">
                {evidenceExpired && (
                    <div
                        role="alert"
                        className="rounded-[var(--radius-card)] border border-[var(--color-warning)]/40 bg-[var(--color-warning-soft)] p-3 text-sm text-text"
                    >
                        <div className="flex gap-2">
                            <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-warning)]" aria-hidden="true" />
                            <div className="min-w-0">
                                <p className="font-semibold">판정 근거의 보관 기간이 지났습니다.</p>
                                <p className="mt-1 break-words text-xs leading-relaxed text-text-muted">
                                    승인하려면 아래 일정 정보를 직접 확인하고 수정해 주세요.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <section
                    aria-labelledby="broadcast-judgment-heading"
                    className="rounded-[var(--radius-card)] border border-border bg-bg p-3 sm:p-4"
                >
                    <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="min-w-0">
                            <h3 id="broadcast-judgment-heading" className="text-sm font-semibold text-text">
                                방송 판단 정보
                            </h3>
                            <p className="mt-1 text-xs leading-relaxed text-text-muted">참여자별 최신 방송을 먼저 확인합니다.</p>
                        </div>
                        <span className="shrink-0 text-xs font-semibold tabular-nums text-primary">
                            참여자 {detail.participants.length}명
                        </span>
                    </div>

                    <div className="mt-3 flex min-w-0 flex-wrap items-center gap-1.5">
                        <span className="mr-1 text-[11px] font-semibold text-text-dim">카테고리</span>
                        {participantCategories.size > 0 ? (
                            Array.from(participantCategories).map((category) => (
                                <span
                                    key={category}
                                    className="max-w-full break-words rounded bg-category px-2 py-1 text-xs font-medium text-text"
                                >
                                    {category}
                                </span>
                            ))
                        ) : (
                            <span className="text-xs text-[var(--color-warning)]">확인 필요</span>
                        )}
                    </div>

                    <ul className="mt-3 grid min-w-0 gap-2 sm:grid-cols-2">
                        {detail.participants.map((participant) => {
                            const evidence = latestEvidenceByParticipant.get(participant.id)
                            return (
                                <li
                                    key={participant.id}
                                    className="min-w-0 rounded-[var(--radius-input)] border border-border bg-bg-secondary p-3"
                                >
                                    <div className="flex min-w-0 items-center justify-between gap-2">
                                        <p className="min-w-0 truncate text-sm font-bold text-text">
                                            {participant.displayName ?? '이름 확인 필요'}
                                        </p>
                                        <span className="shrink-0 text-[10px] text-text-dim">
                                            {evidence === undefined
                                                ? '방송 정보 없음'
                                                : (EVIDENCE_SOURCE_LABELS[evidence.sourceType] ?? '수집 방송')}
                                        </span>
                                    </div>
                                    {evidence === undefined ? (
                                        <p className="mt-2 text-xs text-[var(--color-warning)]">
                                            이 참여자의 방송 제목과 카테고리를 확인할 수 없습니다.
                                        </p>
                                    ) : (
                                        <>
                                            <p className="mt-2 line-clamp-2 break-words text-sm font-medium leading-5 text-text">
                                                {evidence.normalizedTitle || evidence.title}
                                            </p>
                                            <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-text-muted">
                                                <span className="max-w-full break-words">{evidence.category ?? '카테고리 확인 필요'}</span>
                                                <span className="text-border" aria-hidden="true">
                                                    ·
                                                </span>
                                                <time className="tabular-nums" dateTime={evidence.observedAt}>
                                                    {new Date(evidence.observedAt).toLocaleString('ko-KR')} 수집
                                                </time>
                                            </div>
                                        </>
                                    )}
                                </li>
                            )
                        })}
                    </ul>
                    {detail.participants.length === 0 && (
                        <p className="mt-3 text-xs text-[var(--color-warning)]">확인된 참여자 정보가 없습니다.</p>
                    )}
                </section>

                <section
                    aria-labelledby="assessment-heading"
                    className="rounded-[var(--radius-card)] border border-border bg-bg p-3 sm:p-4"
                >
                    <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                        <h3 id="assessment-heading" className="text-sm font-semibold text-text">
                            최신 자동 판정
                        </h3>
                        <time className="text-[10px] tabular-nums text-text-dim" dateTime={detail.assessment.assessedAt}>
                            {new Date(detail.assessment.assessedAt).toLocaleString('ko-KR')} 계산
                        </time>
                    </div>
                    <div className="mt-3 min-w-0">
                        <p className="break-words text-xl font-bold text-primary">
                            {ASSESSMENT_DECISION_LABELS[detail.assessment.decision]}
                        </p>
                        <p className="mt-2 break-words text-sm font-medium leading-relaxed text-text">
                            {assessmentReasonLabel(detail.assessment)}
                        </p>
                        <p className="mt-2 text-xs text-text-dim">
                            {assessmentMethodLabel(detail.assessment)} · {contentTypeLabel(detail.contentType)}
                        </p>
                    </div>
                    {assessmentStateDiffers && (
                        <p className="mt-3 rounded-[var(--radius-input)] border border-[var(--color-warning)]/30 bg-[var(--color-warning-soft)] px-3 py-2 text-xs leading-relaxed text-text-muted sm:mt-4">
                            자동 판단은 {ASSESSMENT_DECISION_LABELS[detail.assessment.decision]}, 운영 이력은{' '}
                            {decisionLabel(detail.decisionState)} 상태입니다.
                        </p>
                    )}
                    <div className="mt-4 border-t border-border pt-4">
                        <RelationDiagnostics diagnostics={detail.diagnostics} compact />
                    </div>

                    <div className="mt-4 border-t border-border pt-4">
                        <div className="grid min-w-0 grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                            {directPromotionKind !== undefined && (
                                <Button
                                    type="button"
                                    size="sm"
                                    leftIcon={<Check className="h-4 w-4" />}
                                    onClick={() => onPromotion(directPromotionKind)}
                                >
                                    승인
                                </Button>
                            )}
                            {approvalPromotionKinds.length > 0 && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            ref={promotionMenuTriggerRef}
                                            type="button"
                                            size="sm"
                                            leftIcon={<Check className="h-4 w-4" />}
                                            rightIcon={<ChevronDown className="h-3.5 w-3.5" />}
                                        >
                                            승인
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="start"
                                        onCloseAutoFocus={(event) => {
                                            event.preventDefault()
                                            promotionMenuTriggerRef.current?.focus()
                                            const selection = pendingMenuSelectionRef.current
                                            pendingMenuSelectionRef.current = null
                                            if (selection !== null) requestAnimationFrame(selection)
                                        }}
                                    >
                                        {approvalPromotionKinds.map((kind) => (
                                            <DropdownMenuItem
                                                key={kind}
                                                className="min-h-10"
                                                onSelect={() => queueMenuSelection(() => onPromotion(kind))}
                                            >
                                                {kind === 'MERGE' ? (
                                                    <GitMerge className="h-4 w-4" aria-hidden="true" />
                                                ) : (
                                                    <PencilLine className="h-4 w-4" aria-hidden="true" />
                                                )}
                                                {kind === 'MERGE' ? '기존 일정과 병합' : '기존 일정 수정'}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                            {primaryStandaloneAction !== undefined && (
                                <Button
                                    type="button"
                                    size="sm"
                                    disabled={primaryStandaloneAction === 'AUTO_AUDIT_CONFIRM' && evidenceExpired}
                                    title={
                                        primaryStandaloneAction === 'AUTO_AUDIT_CONFIRM' && evidenceExpired
                                            ? '보관 중인 근거가 없어 자동 반영 확인을 완료할 수 없습니다.'
                                            : undefined
                                    }
                                    onClick={() => onAction(primaryStandaloneAction)}
                                >
                                    {ACTION_LABELS[primaryStandaloneAction]}
                                </Button>
                            )}
                            {rejectAvailable && (
                                <Button type="button" size="sm" variant="destructive" onClick={() => onAction('REJECT')}>
                                    거절
                                </Button>
                            )}
                            {hasOverflowActions && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            ref={otherMenuTriggerRef}
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            leftIcon={<MoreHorizontal className="h-4 w-4" />}
                                            rightIcon={<ChevronDown className="h-3.5 w-3.5" />}
                                        >
                                            다른 처리
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="start"
                                        onCloseAutoFocus={(event) => {
                                            event.preventDefault()
                                            otherMenuTriggerRef.current?.focus()
                                            const selection = pendingMenuSelectionRef.current
                                            pendingMenuSelectionRef.current = null
                                            if (selection !== null) requestAnimationFrame(selection)
                                        }}
                                    >
                                        {overflowPromotionKinds.map((kind) => (
                                            <DropdownMenuItem
                                                key={kind}
                                                className="min-h-10"
                                                onSelect={() => queueMenuSelection(() => onPromotion(kind))}
                                            >
                                                {kind === 'MERGE' ? (
                                                    <GitMerge className="h-4 w-4" aria-hidden="true" />
                                                ) : (
                                                    <PencilLine className="h-4 w-4" aria-hidden="true" />
                                                )}
                                                {kind === 'MERGE' ? '기존 일정과 병합' : '기존 일정 수정'}
                                            </DropdownMenuItem>
                                        ))}
                                        {overflowActions.map((action) => (
                                            <DropdownMenuItem
                                                key={action}
                                                className={cn(
                                                    'min-h-10',
                                                    (action === 'SUPPRESS' || action === 'DISPUTE') && 'text-live focus:text-live',
                                                )}
                                                disabled={action === 'AUTO_AUDIT_CONFIRM' && evidenceExpired}
                                                onSelect={() => queueMenuSelection(() => onAction(action))}
                                            >
                                                {ACTION_LABELS[action]}
                                            </DropdownMenuItem>
                                        ))}
                                        {canRollback && (
                                            <DropdownMenuItem
                                                className="min-h-10 text-live focus:text-live"
                                                onSelect={() => queueMenuSelection(onRollback)}
                                            >
                                                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                                                반영 되돌리기
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                        <p className="mt-2 text-xs font-medium leading-relaxed text-text-muted">
                            다음 화면에서 일정 내용을 확인한 뒤 최종 승인합니다.
                        </p>
                    </div>
                </section>

                <Collapsible open={calculationOpen} onOpenChange={setCalculationOpen}>
                    <section
                        aria-labelledby="assessment-inputs-heading"
                        className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-bg"
                    >
                        <CollapsibleTrigger asChild>
                            <button
                                type="button"
                                className="flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                            >
                                <span className="flex min-w-0 items-center gap-2">
                                    <Gauge className="h-3.5 w-3.5 shrink-0 text-text-dim" aria-hidden="true" />
                                    <span id="assessment-inputs-heading" className="text-sm font-semibold text-text">
                                        {calculationOpen ? 'classifier 원본 입력 닫기' : 'classifier 원본 입력 보기'}
                                    </span>
                                    <span className="shrink-0 text-[11px] tabular-nums text-text-dim">
                                        {detail.assessmentRelations.length}개 관계
                                    </span>
                                </span>
                                <ChevronDown
                                    className={cn(
                                        'h-4 w-4 shrink-0 text-text-dim transition-transform duration-[var(--dur-micro)] motion-reduce:transition-none',
                                        calculationOpen && 'rotate-180',
                                    )}
                                    aria-hidden="true"
                                />
                            </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <div className="border-t border-border px-3 py-3">
                                <dl className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
                                    <div>
                                        <dt className="text-text-dim">계산 방식</dt>
                                        <dd className="mt-0.5 font-semibold text-text">{assessmentMethodLabel(detail.assessment)}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-text-dim">최신 계산</dt>
                                        <dd className="mt-0.5 font-semibold text-primary">
                                            {ASSESSMENT_DECISION_LABELS[detail.assessment.decision]}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-text-dim">운영 이력</dt>
                                        <dd className="mt-0.5 font-semibold text-text">{decisionLabel(detail.decisionState)}</dd>
                                    </div>
                                </dl>
                                <p className="mt-3 text-[11px] leading-relaxed text-text-dim">
                                    저장된 classifier 입력입니다. 강한 규칙은 가중 계산보다 우선합니다.
                                </p>
                                <p className="mt-1 text-[11px] leading-relaxed text-text-dim">
                                    같은 배치와 카테고리는 보조 입력이며 단독으로 합방을 확정하지 않습니다.
                                </p>
                                <p className="mt-1 break-all font-mono text-[10px] text-text-dim">
                                    rule {detail.assessment.ruleVersion} · classifier {detail.assessment.classifierVersion}
                                </p>
                            </div>
                            <div className="divide-y divide-border border-t border-border">
                                {detail.assessmentRelations.map((relation) => {
                                    const strongRules = STRONG_RULES.filter(([key]) => relation.features[key]).map(([, label]) => label)
                                    return (
                                        <article key={`${relation.fromParticipantId}-${relation.toParticipantId}`} className="min-w-0 p-3">
                                            <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                                                <p className="min-w-0 break-words text-xs font-bold text-text">
                                                    {participantNames[relation.fromParticipantId] ?? '이름 확인 필요'}
                                                    <span className="mx-1.5 text-text-dim">↔</span>
                                                    {participantNames[relation.toParticipantId] ?? '이름 확인 필요'}
                                                </p>
                                                <span
                                                    className={cn(
                                                        'shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                                                        strongRules.length > 0
                                                            ? 'border-primary/40 bg-primary/10 text-primary'
                                                            : 'border-border text-text-dim',
                                                    )}
                                                >
                                                    {strongRules.length > 0 ? `강한 규칙 · ${strongRules.join(' · ')}` : '강한 규칙 없음'}
                                                </span>
                                            </div>
                                            <div className="mt-3 grid min-w-0 grid-cols-2 gap-x-3 gap-y-2">
                                                {WEIGHTED_INPUTS.map(([key, label]) => (
                                                    <div key={key} className="flex min-w-0 items-center justify-between gap-2 text-[11px]">
                                                        <span className="break-words text-text-muted">{label}</span>
                                                        <span className="shrink-0 tabular-nums font-semibold text-text">
                                                            {relation.features[key].toFixed(2)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </article>
                                    )
                                })}
                                {detail.assessmentRelations.length === 0 && (
                                    <p className="px-3 py-4 text-center text-xs text-text-dim">계산 가능한 참여자 관계가 없습니다.</p>
                                )}
                            </div>
                        </CollapsibleContent>
                    </section>
                </Collapsible>

                <Collapsible open={evidenceOpen} onOpenChange={setEvidenceOpen}>
                    <section
                        aria-labelledby="evidence-heading"
                        className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-bg"
                    >
                        <CollapsibleTrigger asChild>
                            <button
                                type="button"
                                className="flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                            >
                                <span className="min-w-0">
                                    <span className="flex min-w-0 items-center gap-2">
                                        <Sparkles className="h-3.5 w-3.5 shrink-0 text-text-dim" aria-hidden="true" />
                                        <span id="evidence-heading" className="text-sm font-semibold text-text">
                                            수집 원문 {detail.evidence.length}건
                                        </span>
                                    </span>
                                    <span className="mt-0.5 block text-[11px] leading-relaxed text-text-dim">
                                        방송 제목과 수집 시각을 확인합니다.
                                    </span>
                                </span>
                                <ChevronDown
                                    className={cn(
                                        'h-4 w-4 shrink-0 text-text-dim transition-transform duration-[var(--dur-micro)] motion-reduce:transition-none',
                                        evidenceOpen && 'rotate-180',
                                    )}
                                    aria-hidden="true"
                                />
                            </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            {detail.evidencePurgeAfter !== null && (
                                <p className="border-t border-border px-3 py-2 text-[10px] text-text-dim">
                                    {new Date(detail.evidencePurgeAfter).toLocaleDateString('ko-KR')}까지 보관
                                </p>
                            )}
                            <div
                                tabIndex={0}
                                aria-label="참고 근거 목록"
                                className="max-h-80 divide-y divide-border overflow-y-auto overscroll-contain border-t border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:max-h-96 lg:max-h-[28rem]"
                            >
                                {detail.evidence.map((evidence) => (
                                    <article key={evidence.evidenceKey} className="min-w-0">
                                        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 bg-bg-secondary px-3 py-2">
                                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                                                <span className="break-words text-xs font-semibold text-text">
                                                    {EVIDENCE_SOURCE_LABELS[evidence.sourceType] ?? '수집된 방송 정보'}
                                                </span>
                                                <span className="text-[10px] tabular-nums text-text-dim">수집 순번 {evidence.rank}</span>
                                            </div>
                                            <time className="text-[10px] text-text-dim" dateTime={evidence.observedAt}>
                                                {new Date(evidence.observedAt).toLocaleString('ko-KR')}
                                            </time>
                                        </div>
                                        <div className="min-w-0 space-y-2 p-3 text-xs">
                                            <p className="break-words font-medium text-text">
                                                {evidence.normalizedTitle || evidence.title}
                                            </p>
                                            <div className="flex min-w-0 flex-wrap gap-1">
                                                {evidence.tags.map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className="max-w-full break-all rounded bg-category px-1.5 py-0.5 text-[11px] text-text-muted"
                                                    >
                                                        #{tag}
                                                    </span>
                                                ))}
                                                {evidence.category !== null && (
                                                    <span className="max-w-full break-words rounded bg-collab/10 px-1.5 py-0.5 text-[11px] text-collab">
                                                        {evidence.category}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="break-words leading-relaxed text-text-muted">
                                                <span className="font-semibold text-text-dim">
                                                    {contentTypeLabel(evidence.collabContext.contentType)}으로 분류
                                                </span>
                                                {evidence.collabContext.relationParticipantIds.length > 0 && (
                                                    <span>
                                                        {' '}
                                                        · 함께 언급된 참여자{' '}
                                                        {evidence.collabContext.relationParticipantIds
                                                            .map((id) => participantNames[id] ?? '이름 확인 필요')
                                                            .join(', ')}
                                                    </span>
                                                )}
                                            </p>
                                            {evidence.participantId !== null && (
                                                <p className="break-words text-[11px] text-text-dim">
                                                    방송 채널 {participantNames[evidence.participantId] ?? '이름 확인 필요'}
                                                </p>
                                            )}
                                        </div>
                                    </article>
                                ))}
                                {detail.evidence.length === 0 && (
                                    <p className="p-5 text-center text-xs text-text-dim">현재 보관 중인 근거가 없습니다.</p>
                                )}
                            </div>
                        </CollapsibleContent>
                    </section>
                </Collapsible>

                <section aria-labelledby="canonical-heading">
                    <div className="mb-2 flex min-w-0 flex-wrap items-center justify-between gap-2">
                        <h3 id="canonical-heading" className="flex items-center gap-2 text-sm font-semibold text-text-dim">
                            <GitMerge className="h-3.5 w-3.5" />
                            일정 반영 내용
                        </h3>
                        <span
                            className={cn(
                                'shrink-0 whitespace-nowrap text-xs font-medium',
                                detail.readiness.failed
                                    ? 'text-live'
                                    : detail.readiness.state === 'READY'
                                      ? 'text-primary'
                                      : detail.readiness.state === 'INCOMPLETE'
                                        ? 'text-[var(--color-warning)]'
                                        : 'text-text-dim',
                            )}
                        >
                            {detail.readiness.failed ? '반영 실패' : READINESS_LABELS[detail.readiness.state]}
                        </span>
                    </div>
                    {detail.proposedCanonical === null ? (
                        <div className="rounded-[var(--radius-card)] border border-dashed border-border p-5 text-center">
                            <p className="text-xs font-medium text-text-muted">저장된 초안이 없습니다.</p>
                            <p className="mt-1 text-xs leading-relaxed text-text-dim">
                                {canCreate ? '새 일정 승인에서 수집 근거로 초안을 구성합니다.' : '반영 기록이 생성되면 이곳에 표시됩니다.'}
                            </p>
                        </div>
                    ) : (
                        <div className="min-w-0 overflow-hidden rounded-[var(--radius-card)] border border-border">
                            <div className="grid grid-cols-2 bg-bg text-xs font-semibold text-text-dim sm:grid-cols-[7rem_minmax(0,1fr)_minmax(0,1fr)]">
                                <span className="hidden p-2 sm:block">항목</span>
                                <span className="p-2 sm:border-l sm:border-border">반영 예정</span>
                                <span className="border-l border-border p-2">현재 일정</span>
                            </div>
                            {canonicalFields.map((key) => {
                                const proposed = detail.proposedCanonical?.[key]
                                const current = detail.targetCanonical?.[key] ?? null
                                return (
                                    <div
                                        key={key}
                                        className="grid grid-cols-2 border-t border-border text-xs sm:grid-cols-[7rem_minmax(0,1fr)_minmax(0,1fr)]"
                                    >
                                        <span className="col-span-2 min-w-0 break-words bg-bg p-2 font-medium text-text-dim sm:col-span-1">
                                            {FIELD_LABELS[key]}
                                        </span>
                                        <span
                                            className={cn(
                                                'min-w-0 break-words border-t border-border p-2 text-text sm:border-l sm:border-t-0',
                                                String(proposed) !== String(current) && 'bg-primary/5',
                                            )}
                                        >
                                            <CanonicalValue field={key} value={proposed as string | string[] | boolean | null} />
                                        </span>
                                        <span className="min-w-0 break-words border-l border-t border-border p-2 text-text-muted sm:border-t-0">
                                            <CanonicalValue field={key} value={current as string | string[] | boolean | null} />
                                        </span>
                                    </div>
                                )
                            })}
                            <div className="grid grid-cols-2 border-t border-border text-xs sm:grid-cols-[7rem_minmax(0,1fr)_minmax(0,1fr)]">
                                <span className="col-span-2 min-w-0 break-words bg-bg p-2 font-medium text-text-dim sm:col-span-1">
                                    참여자
                                </span>
                                <span className="min-w-0 break-words border-t border-border p-2 text-text sm:border-l sm:border-t-0">
                                    {detail.proposedCanonical.participants.length === 0
                                        ? '없음'
                                        : detail.proposedCanonical.participants.map((participant) => (
                                              <span key={participant.streamerId} className="block [&+&]:mt-1">
                                                  <span className="block">
                                                      {participantNames[participant.streamerId] ?? '이름 확인 필요'}
                                                  </span>
                                                  <span className="block text-xs text-text-dim">
                                                      역할 · {PARTICIPANT_ROLE_LABELS[participant.role]}
                                                  </span>
                                              </span>
                                          ))}
                                </span>
                                <span className="min-w-0 break-words border-l border-t border-border p-2 text-text-muted sm:border-t-0">
                                    {(detail.targetCanonical?.participants.length ?? 0) === 0
                                        ? '없음'
                                        : detail.targetCanonical?.participants.map((participant) => (
                                              <span key={participant.streamerId} className="block [&+&]:mt-1">
                                                  <span className="block">
                                                      {participantNames[participant.streamerId] ?? '이름 확인 필요'}
                                                  </span>
                                                  <span className="block text-xs text-text-dim">
                                                      역할 · {PARTICIPANT_ROLE_LABELS[participant.role]}
                                                  </span>
                                              </span>
                                          ))}
                                </span>
                            </div>
                        </div>
                    )}
                </section>

                {detail.promotion !== null && (
                    <section aria-labelledby="operation-heading" className="rounded-[var(--radius-card)] border border-border bg-bg p-3">
                        <h3 id="operation-heading" className="mb-2 flex items-center gap-2 text-sm font-semibold text-text-dim">
                            <History className="h-3.5 w-3.5" />
                            일정 반영 기록
                        </h3>
                        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                            <span className="font-semibold text-text">{PROMOTION_KIND_LABELS[detail.promotion.kind]}</span>
                            <span className={detail.promotion.result === 'PROMOTED' ? 'text-primary' : 'text-[var(--color-warning)]'}>
                                {PROMOTION_RESULT_LABELS[detail.promotion.result]}
                            </span>
                            <span className="text-text-dim">처리 시도 {detail.promotion.attempts}회</span>
                        </div>
                    </section>
                )}
                {detail.reviewActions.length > 0 && (
                    <section
                        aria-labelledby="action-history-heading"
                        className="rounded-[var(--radius-card)] border border-border bg-bg p-3"
                    >
                        <h3 id="action-history-heading" className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-dim">
                            <History className="h-3.5 w-3.5" />
                            검토 이력
                        </h3>
                        <ol className="space-y-2">
                            {detail.reviewActions.map((action) => (
                                <li
                                    key={action.actionId}
                                    className="min-w-0 rounded-[var(--radius-input)] border border-border bg-bg-secondary p-2.5 text-xs"
                                >
                                    <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                                        <span className="break-words font-semibold text-text">
                                            {ACTION_HISTORY_LABELS[action.actionType] ?? action.actionType}
                                        </span>
                                        <time className="text-[10px] text-text-dim" dateTime={action.createdAt}>
                                            {new Date(action.createdAt).toLocaleString('ko-KR')}
                                        </time>
                                    </div>
                                    <p className="mt-1 break-words text-text-muted">
                                        {REVIEW_REASON_LABELS[action.reason] ?? action.reason}
                                    </p>
                                    {action.learningRevision !== null ? (
                                        <p className="mt-1 break-words text-xs font-semibold text-primary">
                                            {action.learningRevision.label === 'COLLAB' ? '합방 정답 저장' : '합방 아님 정답 저장'} ·
                                            revision {action.learningRevision.revisionId}
                                        </p>
                                    ) : action.actionType === 'REJECT' ? (
                                        <p className="mt-1 break-words text-xs text-text-dim">학습 정답 없음 · 보존 근거 없음</p>
                                    ) : null}
                                    <p className="mt-1 break-words text-xs text-text-dim">
                                        {decisionLabel(action.beforeDecisionState)} ·{' '}
                                        {LIFECYCLE_LABELS[action.beforeLifecycleState as CrawlerLifecycleState] ??
                                            action.beforeLifecycleState}{' '}
                                        → {decisionLabel(action.afterDecisionState)} ·{' '}
                                        {LIFECYCLE_LABELS[action.afterLifecycleState as CrawlerLifecycleState] ??
                                            action.afterLifecycleState}{' '}
                                        · 버전 {action.expectedVersion}→{action.resultingVersion}
                                    </p>
                                </li>
                            ))}
                        </ol>
                    </section>
                )}
            </div>
        </section>
    )
}
