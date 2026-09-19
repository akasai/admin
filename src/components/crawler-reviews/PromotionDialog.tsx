import { ChevronDown, GitMerge } from 'lucide-react'
import { Popover } from 'radix-ui'
import { useEffect, useMemo, useRef, useState, type FormEvent, type InvalidEvent, type MutableRefObject } from 'react'
import { useCategories, type CategoryItem } from '../../hooks/useCategories'
import { useCrawlerBulkPreview, useQueueCrawlerPromotion } from '../../hooks/useCrawlerReviews'
import { useAdminToast } from '../../hooks/useAdminToast'
import { ApiError } from '../../lib/apiClient'
import { inputClass, selectClass } from '../../constants/styles'
import type {
    CanonicalParticipantInput,
    CanonicalSchedulePayload,
    CrawlerPromotionKind,
    CrawlerReviewDetail,
    DesiredVisibility,
    QueuePromotionRequest,
} from '../../types/crawlerReview'
import { Button } from '../ui/Button'
import {
    BroadcastParticipantPicker,
    BroadcastParticipantRow,
    BroadcastPreviousField,
    BroadcastScheduleFields,
    BroadcastTitleField,
    BroadcastTypeCategoryFields,
    BroadcastToggleField,
    BroadcastVisibilityField,
} from '../schedule/BroadcastFormFields'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../shadcn/ui/dialog'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../shadcn/ui/collapsible'
import { createUuid } from '@/lib/uuid'

interface PromotionDialogProps {
    detail: CrawlerReviewDetail
    kind: CrawlerPromotionKind | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onConflict: (message: string) => void
    returnFocusRef: MutableRefObject<HTMLElement | null>
}

interface AutofillResult {
    canonical: CanonicalSchedulePayload
    provenance: AutofillProvenance
}

interface AutofillProvenance {
    schedule: { firstObservedSlot: string; startDate: boolean; startTime: boolean } | null
    category: { name: string } | null
    host: { streamerId: string; rank: number } | null
}

interface AutofillDirectEdits {
    startDate: boolean
    startTime: boolean
    category: boolean
    host: boolean
}

const EMPTY_PROVENANCE: AutofillProvenance = { schedule: null, category: null, host: null }
const EMPTY_DIRECT_EDITS: AutofillDirectEdits = { startDate: false, startTime: false, category: false, host: false }

const EMPTY_CANONICAL: CanonicalSchedulePayload = {
    title: '',
    broadcastType: 'collab',
    categoryId: null,
    startDate: '',
    startTime: null,
    previousBroadcastId: null,
    isVisible: false,
    isDrops: false,
    isChzzkSupport: false,
    tags: [],
    participants: [],
}
const KST_SCHEDULE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
})

function scheduleParts(value: string): Pick<CanonicalSchedulePayload, 'startDate' | 'startTime'> | null {
    const date = new Date(value)
    if (!Number.isFinite(date.getTime())) return null
    const parts = Object.fromEntries(KST_SCHEDULE_FORMATTER.formatToParts(date).map((part) => [part.type, part.value]))
    if (
        parts.year === undefined ||
        parts.month === undefined ||
        parts.day === undefined ||
        parts.hour === undefined ||
        parts.minute === undefined
    ) {
        return null
    }
    return {
        startDate: `${parts.year}-${parts.month}-${parts.day}`,
        startTime: `${parts.hour}:${parts.minute}`,
    }
}

function matchingCategoryId(categoryName: string | null, categories: CategoryItem[]): string | null {
    if (categoryName === null) return null
    const normalizedName = categoryName.normalize('NFKC').trim().toLocaleLowerCase('ko-KR')
    if (normalizedName.length === 0) return null
    let match: CategoryItem | null = null
    for (const category of categories) {
        if (category.name.normalize('NFKC').trim().toLocaleLowerCase('ko-KR') !== normalizedName) continue
        if (match !== null) return null
        match = category
    }
    return match === null ? null : String(match.id)
}

function autofillCanonical(
    payload: CanonicalSchedulePayload,
    scheduleEstimate: { firstObservedSlot: string } | null,
    detail: CrawlerReviewDetail,
    categories: CategoryItem[],
): AutofillResult {
    const broadcastingIds = new Set<string>()
    let hostParticipantId: string | null = null
    let hostRank = Number.POSITIVE_INFINITY
    let categoryName: string | null = null
    let categoryRank = Number.POSITIVE_INFINITY

    for (const evidence of detail.evidence) {
        if (evidence.sourceType !== 'LIVE_SNAPSHOT') continue
        if (evidence.participantId !== null) {
            broadcastingIds.add(evidence.participantId)
            if (evidence.rank < hostRank) {
                hostRank = evidence.rank
                hostParticipantId = evidence.participantId
            }
        }
        if (evidence.category !== null && evidence.category.trim().length > 0 && evidence.rank < categoryRank) {
            categoryRank = evidence.rank
            categoryName = evidence.category
        }
    }

    const matchedCategoryId = payload.categoryId === null ? matchingCategoryId(categoryName, categories) : null
    const existingHost = payload.participants.some((participant) => participant.role === 'host')
    const hostAutofilled = !existingHost && hostParticipantId !== null

    return {
        canonical: {
            ...payload,
            categoryId: matchedCategoryId ?? payload.categoryId,
            participants: payload.participants.map((participant) => ({
                ...participant,
                role:
                    hostAutofilled && participant.streamerId === hostParticipantId
                        ? 'host'
                        : hostAutofilled
                          ? 'participant'
                          : participant.role,
                isBroadcasting: broadcastingIds.size === 0 ? participant.isBroadcasting : broadcastingIds.has(participant.streamerId),
            })),
        },
        provenance: {
            schedule:
                scheduleEstimate === null
                    ? null
                    : { firstObservedSlot: scheduleEstimate.firstObservedSlot, startDate: true, startTime: true },
            category: matchedCategoryId === null || categoryName === null ? null : { name: categoryName },
            host: hostAutofilled && hostParticipantId !== null ? { streamerId: hostParticipantId, rank: hostRank } : null,
        },
    }
}

function scheduleProvenanceText(firstObservedSlot: string): string {
    const parts = scheduleParts(firstObservedSlot)
    return parts === null
        ? '자동 추정 · 최초 합방 관측 배치의 15분 전'
        : `자동 추정 · 최초 합방 관측 배치 ${parts.startDate} ${parts.startTime ?? ''} KST의 15분 전`
}

function promotionErrorMessage(error: Error | null): string | null {
    if (error === null) return null
    if (!(error instanceof ApiError)) return '네트워크 요청을 완료하지 못했습니다. 같은 요청 키로 다시 시도할 수 있습니다.'
    if (error.code === 'CRAWLER_EVIDENCE_EXPIRED')
        return '근거 보존 기간이 끝났습니다. 정규 일정 필드를 직접 수정한 뒤 명시적 스냅샷으로 다시 확정해 주세요.'
    if (error.code === 'CRAWLER_INVALID_TRANSITION') return '현재 판정 상태에서는 이 반영 작업을 실행할 수 없습니다.'
    if (error.code === 'IDEMPOTENCY_KEY_REUSED')
        return '동일한 요청 키가 다른 내용에 사용되었습니다. 창을 닫고 새 작업으로 다시 확인해 주세요.'
    return error.message
}

export function PromotionDialog({ detail, kind, open, onOpenChange, onConflict, returnFocusRef }: PromotionDialogProps) {
    const mutation = useQueueCrawlerPromotion()
    const preview = useCrawlerBulkPreview()
    const categories = useCategories()
    const resetMutation = mutation.reset
    const resetPreview = preview.reset
    const mutatePreview = preview.mutate
    const { addToast } = useAdminToast()
    const previewItem = preview.data?.items.find(
        (item) => item.detectionId === detail.detectionId && item.expectedVersion === detail.version,
    )
    const previewCanonical = previewItem?.eligible === true ? previewItem.canonicalPayload : null
    const autoFilledCanonical = useMemo(
        () =>
            previewCanonical === null || categories.isPending
                ? null
                : autofillCanonical(previewCanonical, previewItem?.scheduleEstimate ?? null, detail, categories.data ?? []),
        [categories.data, categories.isPending, detail, previewCanonical, previewItem?.scheduleEstimate],
    )
    const initialCanonical = detail.proposedCanonical ?? EMPTY_CANONICAL
    const participantNames = useMemo(
        () => new Map(detail.participants.map((participant) => [participant.id, participant.displayName?.trim() || '이름 확인 필요'])),
        [detail.participants],
    )
    const participantOptions = useMemo(
        () =>
            detail.participants.map((participant) => ({
                id: participant.id,
                name: participantNames.get(participant.id) ?? '이름 확인 필요',
                keywords: [participant.id],
            })),
        [detail.participants, participantNames],
    )
    const sessionKey = `${detail.detectionId}:${detail.version}:${kind ?? 'none'}`
    const initializedSessionRef = useRef<string | null>(null)
    const autofilledSessionRef = useRef<string | null>(null)
    const [canonical, setCanonical] = useState<CanonicalSchedulePayload>(initialCanonical)
    const selectedParticipantIds = useMemo(
        () => new Set(canonical.participants.map((participant) => participant.streamerId)),
        [canonical.participants],
    )
    const [provenance, setProvenance] = useState<AutofillProvenance>(EMPTY_PROVENANCE)
    const [directEdits, setDirectEdits] = useState<AutofillDirectEdits>(EMPTY_DIRECT_EDITS)
    const [desiredVisibility, setDesiredVisibility] = useState<DesiredVisibility>(initialCanonical.isVisible ? 'VISIBLE' : 'HIDDEN')
    const [targetBroadcastId, setTargetBroadcastId] = useState(detail.targetCanonical?.id ?? '')
    const [targetVersion, setTargetVersion] = useState(detail.targetCanonical?.version.toString() ?? '')
    const [reasonCode, setReasonCode] = useState('MANUAL_APPROVAL')
    const [note, setNote] = useState('')
    const [tagInput, setTagInput] = useState(initialCanonical.tags.join(', '))
    const [confirmedIntent, setConfirmedIntent] = useState<QueuePromotionRequest | null>(null)
    const [additionalSettingsOpen, setAdditionalSettingsOpen] = useState(false)
    const [replacingParticipantIndex, setReplacingParticipantIndex] = useState<number | null>(null)

    useEffect(() => {
        if (!open || kind === null) {
            initializedSessionRef.current = null
            autofilledSessionRef.current = null
            return
        }
        if (initializedSessionRef.current === sessionKey) return
        initializedSessionRef.current = sessionKey
        autofilledSessionRef.current = null
        const next = detail.proposedCanonical ?? EMPTY_CANONICAL
        setCanonical(next)
        setReplacingParticipantIndex(null)
        setProvenance(EMPTY_PROVENANCE)
        setDirectEdits(EMPTY_DIRECT_EDITS)
        setDesiredVisibility(next.isVisible ? 'VISIBLE' : 'HIDDEN')
        setTargetBroadcastId(detail.targetCanonical?.id ?? '')
        setTargetVersion(detail.targetCanonical?.version.toString() ?? '')
        setReasonCode('MANUAL_APPROVAL')
        setNote('')
        setTagInput(next.tags.join(', '))
        setAdditionalSettingsOpen(false)
        setConfirmedIntent(null)
        resetMutation()
        resetPreview()
        if (kind === 'CREATE' && detail.proposedCanonical === null) {
            mutatePreview({
                action: 'APPROVE',
                desiredVisibility: false,
                items: [{ detectionId: detail.detectionId, expectedVersion: detail.version }],
            })
        }
    }, [detail, kind, mutatePreview, open, resetMutation, resetPreview, sessionKey])

    useEffect(() => {
        if (
            !open ||
            kind !== 'CREATE' ||
            detail.proposedCanonical !== null ||
            autoFilledCanonical === null ||
            initializedSessionRef.current !== sessionKey ||
            autofilledSessionRef.current === sessionKey
        ) {
            return
        }
        autofilledSessionRef.current = sessionKey
        setCanonical(autoFilledCanonical.canonical)
        setProvenance(autoFilledCanonical.provenance)
        setDirectEdits(EMPTY_DIRECT_EDITS)
        setDesiredVisibility(autoFilledCanonical.canonical.isVisible ? 'VISIBLE' : 'HIDDEN')
        setTagInput(autoFilledCanonical.canonical.tags.join(', '))
        setConfirmedIntent(null)
        resetMutation()
    }, [autoFilledCanonical, detail.proposedCanonical, kind, open, resetMutation, sessionKey])

    if (kind === null) return null
    const activeKind: CrawlerPromotionKind = kind
    const createPreviewRequired = activeKind === 'CREATE' && detail.proposedCanonical === null
    const createAutofillPending = createPreviewRequired && (preview.isPending || (previewCanonical !== null && categories.isPending))
    const createPreviewUnavailable = createPreviewRequired && preview.isSuccess && previewCanonical === null
    const createPreviewUnavailableMessage =
        previewItem?.conflictCode === 'CRAWLER_START_ESTIMATE_UNAVAILABLE'
            ? '최초 관측 배치를 확인할 수 없습니다. 날짜·시간을 직접 입력하세요.'
            : '탐지 근거에서 새 일정 초깃값을 만들지 못했습니다. 아래 필드를 직접 입력해 주세요.'
    const targetRequired = activeKind !== 'CREATE'
    const evidencePurgeAt = detail.evidencePurgeAfter === null ? null : Date.parse(detail.evidencePurgeAfter)
    const evidenceExpired = evidencePurgeAt !== null && Number.isFinite(evidencePurgeAt) && evidencePurgeAt <= Date.now()
    const canonicalBaseline = detail.proposedCanonical ?? previewCanonical ?? EMPTY_CANONICAL
    const canonicalDirty = JSON.stringify(canonical) !== JSON.stringify(canonicalBaseline)
    const participantIds = canonical.participants.map((participant) => participant.streamerId.trim()).filter((id) => id.length > 0)
    const participantsComplete =
        canonical.participants.length >= 2 &&
        canonical.participants.length <= 32 &&
        participantIds.length === canonical.participants.length &&
        new Set(participantIds).size === canonical.participants.length &&
        canonical.participants.filter((participant) => participant.role === 'host').length === 1
    const canonicalComplete = canonical.title.trim().length > 0 && canonical.startDate.length > 0 && participantsComplete
    const targetComplete =
        !targetRequired || (targetBroadcastId.trim().length > 0 && /^\d+$/.test(targetVersion) && Number(targetVersion) > 0)
    const expiredSnapshotBlocked = evidenceExpired && !canonicalDirty

    function resetIntent() {
        if (confirmedIntent !== null) setConfirmedIntent(null)
        if (mutation.isError) mutation.reset()
    }

    function markDirect(field: keyof AutofillDirectEdits) {
        setDirectEdits((current) => (current[field] ? current : { ...current, [field]: true }))
    }

    function setField<K extends keyof CanonicalSchedulePayload>(field: K, value: CanonicalSchedulePayload[K]) {
        if (field === 'startDate' && provenance.schedule?.startDate) markDirect('startDate')
        if (field === 'startTime' && provenance.schedule?.startTime) markDirect('startTime')
        if (field === 'categoryId' && provenance.category !== null) markDirect('category')
        if (field === 'participants' && provenance.host !== null) {
            const participants = value as CanonicalParticipantInput[]
            const inferredHostRemains = participants.some(
                (participant) => participant.streamerId === provenance.host?.streamerId && participant.role === 'host',
            )
            if (!inferredHostRemains) markDirect('host')
        }
        setCanonical((current) => ({ ...current, [field]: value }))
        resetIntent()
    }

    function addParticipant(streamerId: string) {
        if (selectedParticipantIds.has(streamerId)) return
        setField('participants', [...canonical.participants, { streamerId, role: 'participant', isBroadcasting: false }])
    }

    function updateParticipant(index: number, changes: Partial<CanonicalParticipantInput>) {
        const participant = canonical.participants[index]
        if (
            provenance.host !== null &&
            (changes.role !== undefined ||
                (changes.streamerId !== undefined &&
                    (participant?.streamerId === provenance.host.streamerId || changes.streamerId === provenance.host.streamerId)))
        ) {
            markDirect('host')
        }
        setCanonical((current) => ({
            ...current,
            participants: current.participants.map((currentParticipant, participantIndex) =>
                participantIndex === index ? { ...currentParticipant, ...changes } : currentParticipant,
            ),
        }))
        resetIntent()
    }

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (!canonicalComplete || !targetComplete || expiredSnapshotBlocked) return
        const normalizedCanonical: CanonicalSchedulePayload = {
            ...canonical,
            title: canonical.title.trim(),
            tags: Array.from(
                new Set(
                    tagInput
                        .split(',')
                        .map((tag) => tag.trim())
                        .filter((tag) => tag.length > 0),
                ),
            ).sort(),
            participants: [...canonical.participants]
                .map((participant) => ({ ...participant, streamerId: participant.streamerId.trim() }))
                .sort((left, right) => left.streamerId.localeCompare(right.streamerId)),
            isVisible: desiredVisibility === 'VISIBLE',
        }
        const request: QueuePromotionRequest = confirmedIntent ?? {
            kind: activeKind,
            operationId: null,
            canonicalPayload: normalizedCanonical,
            editedCanonical: canonicalDirty,
            desiredVisibility: desiredVisibility === 'VISIBLE',
            targetBroadcastId: targetRequired ? targetBroadcastId.trim() : null,
            expectedBroadcastVersion: targetRequired ? Number(targetVersion) : null,
            expectedVersion: detail.version,
            idempotencyKey: createUuid(),
            reason: `${reasonCode}${note.trim().length > 0 ? `: ${note.trim()}` : ''}`,
        }
        setConfirmedIntent(request)
        mutation.mutate(
            { detectionId: detail.detectionId, body: request },
            {
                onSuccess: () => {
                    const resultText =
                        desiredVisibility === 'VISIBLE'
                            ? '공개 일정 반영 작업을 대기열에 추가했습니다.'
                            : '비공개 초안 반영 작업을 대기열에 추가했습니다.'
                    addToast({ variant: 'success', message: resultText })
                    onOpenChange(false)
                },
                onError: (error) => {
                    if (error instanceof ApiError && (error.code === 'CRAWLER_VERSION_CONFLICT' || error.status === 409)) {
                        onOpenChange(false)
                        onConflict('탐지 또는 정규 일정 버전이 변경되었습니다. 비교 내용을 다시 확인하고 새 요청으로 확정해 주세요.')
                    }
                },
            },
        )
    }

    function revealAdditionalSettings(event: InvalidEvent<HTMLFormElement>) {
        if (!(event.target instanceof HTMLElement) || event.target.closest('[data-additional-settings]') === null) return
        event.preventDefault()
        const target = event.target
        setAdditionalSettingsOpen(true)
        requestAnimationFrame(() => target.focus())
    }

    const approvalBlockedReason = expiredSnapshotBlocked
        ? '만료된 근거 대신 저장할 정규 스냅샷을 직접 수정해야 합니다.'
        : !canonicalComplete
          ? '제목, 시작일, 참여자 구성과 호스트를 모두 입력해 주세요.'
          : !targetComplete
            ? '반영할 방송 ID와 양의 예상 버전을 입력해 주세요.'
            : null

    const dialogTitle = activeKind === 'CREATE' ? '새 정규 일정 승인' : activeKind === 'MERGE' ? '기존 일정에 병합' : '기존 정규 일정 수정'

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="!flex max-h-[calc(100dvh-1rem)] max-w-[calc(100vw-1rem)] flex-col gap-0 overflow-hidden border-border bg-bg-secondary p-0 sm:max-w-3xl"
                onCloseAutoFocus={(event) => {
                    if (returnFocusRef.current === null) return
                    event.preventDefault()
                    returnFocusRef.current.focus()
                    returnFocusRef.current = null
                }}
            >
                <DialogHeader className="shrink-0 border-b border-border px-4 py-4 pr-14">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-input)] bg-primary/10 text-primary">
                            <GitMerge className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div className="min-w-0 text-left">
                            <DialogTitle className="break-words">{dialogTitle}</DialogTitle>
                            <DialogDescription className="mt-1 break-words">
                                수집 근거로 채운 값을 확인하고 일정 반영을 승인하세요.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                <form onSubmit={submit} onInvalidCapture={revealAdditionalSettings} className="flex min-h-0 flex-1 flex-col">
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
                        <div className="space-y-5">
                            {createAutofillPending && (
                                <div
                                    role="status"
                                    className="rounded-[var(--radius-input)] border border-primary/30 bg-primary/10 p-3 text-xs text-text"
                                >
                                    탐지 근거에서 새 일정 초깃값을 불러오는 중입니다.
                                </div>
                            )}
                            {createPreviewRequired && (preview.isError || createPreviewUnavailable) && (
                                <div
                                    role="alert"
                                    className="rounded-[var(--radius-input)] border border-[var(--color-warning)]/40 bg-[var(--color-warning-soft)] p-3 text-xs leading-relaxed text-text"
                                >
                                    {createPreviewUnavailableMessage}
                                </div>
                            )}
                            {evidenceExpired && (
                                <div
                                    role="alert"
                                    className="rounded-[var(--radius-input)] border border-[var(--color-warning)]/40 bg-[var(--color-warning-soft)] p-3 text-xs leading-relaxed text-text"
                                >
                                    <strong>근거 만료 · 명시적 편집 필요 · </strong>제목, 일정, 태그, 참여자 중 적어도 하나를 직접 수정해야
                                    명시적 편집 스냅샷으로 승인할 수 있습니다.
                                </div>
                            )}

                            <section aria-labelledby="promotion-schedule-heading">
                                <h3 id="promotion-schedule-heading" className="border-b border-border pb-2 text-sm font-semibold text-text">
                                    일정 정보
                                </h3>
                                <fieldset disabled={createAutofillPending} className="space-y-4 pt-3 disabled:opacity-60">
                                    <legend className="sr-only">일정 정보</legend>
                                    <BroadcastTitleField
                                        value={canonical.title}
                                        onChange={(title) => setField('title', title)}
                                        disabled={createAutofillPending}
                                    />
                                    <BroadcastTypeCategoryFields
                                        broadcastType={canonical.broadcastType}
                                        onBroadcastTypeChange={(broadcastType) => setField('broadcastType', broadcastType)}
                                        categories={categories.data ?? []}
                                        categoryId={canonical.categoryId ?? ''}
                                        onCategoryChange={(categoryId) => setField('categoryId', categoryId.length > 0 ? categoryId : null)}
                                        disabled={createAutofillPending}
                                        categoryDisabled={categories.isPending || categories.isError}
                                        categoryPlaceholder={categories.isPending ? '카테고리 불러오는 중' : '검색하여 선택'}
                                        categoryMeta={
                                            <>
                                                {categories.isError && (
                                                    <div className="mt-1 flex min-w-0 items-center justify-between gap-2 text-[11px] text-live">
                                                        <span>카테고리를 불러오지 못했습니다.</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => void categories.refetch()}
                                                            className="min-h-10 shrink-0 rounded-[var(--radius-input)] px-2 font-semibold text-text-muted hover:bg-card-hover hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                                        >
                                                            다시 시도
                                                        </button>
                                                    </div>
                                                )}
                                                {provenance.category !== null && (
                                                    <span className="mt-1 block text-[11px] leading-4 text-text-dim">
                                                        {directEdits.category
                                                            ? '직접 수정'
                                                            : `자동 선택 · 수집 카테고리 “${provenance.category.name}” 일치`}
                                                    </span>
                                                )}
                                            </>
                                        }
                                    />
                                    <BroadcastScheduleFields
                                        startDate={canonical.startDate}
                                        startTime={canonical.startTime}
                                        onStartDateChange={(startDate) => setField('startDate', startDate)}
                                        onStartTimeChange={(startTime) => setField('startTime', startTime)}
                                        disabled={createAutofillPending}
                                        dateMeta={
                                            provenance.schedule?.startDate ? (
                                                <span className="mt-1 block text-[11px] leading-4 text-text-dim">
                                                    {directEdits.startDate
                                                        ? '직접 수정'
                                                        : scheduleProvenanceText(provenance.schedule.firstObservedSlot)}
                                                </span>
                                            ) : undefined
                                        }
                                        timeMeta={
                                            provenance.schedule?.startTime ? (
                                                <span className="mt-1 block text-[11px] leading-4 text-text-dim">
                                                    {directEdits.startTime
                                                        ? '직접 수정'
                                                        : `${scheduleProvenanceText(provenance.schedule.firstObservedSlot)} · 관측 구간 기준 추정이며 실제 합방 시작 확정 시각은 아닙니다.`}
                                                </span>
                                            ) : undefined
                                        }
                                        note={provenance.schedule !== null ? '최초 관측 시각은 실제 방송 시작 시각이 아닙니다.' : undefined}
                                    />
                                </fieldset>
                            </section>

                            <section aria-labelledby="promotion-participants-heading">
                                <div className="border-b border-border pb-2">
                                    <h3 id="promotion-participants-heading" className="text-sm font-semibold text-text">
                                        참여자 <span className="ml-1 text-text-muted">{canonical.participants.length}명</span>
                                    </h3>
                                    <p className="mt-1 text-xs text-text-muted">
                                        검색으로 추가하고, 이름을 눌러 교체합니다. 역할과 송출은 바로 변경할 수 있습니다.
                                    </p>
                                </div>
                                <fieldset disabled={createAutofillPending} className="pt-3 disabled:opacity-60">
                                    <legend className="sr-only">참여자 구성</legend>
                                    <div className="mb-4">
                                        <BroadcastParticipantPicker
                                            options={participantOptions}
                                            selectedIds={selectedParticipantIds}
                                            onChange={addParticipant}
                                            disabled={createAutofillPending}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        {canonical.participants.length === 0 && (
                                            <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-xs text-text-dim">
                                                위에서 참여자를 검색해 추가하세요.
                                            </p>
                                        )}
                                        {canonical.participants.map((participant, index) => {
                                            const selectedName = participantNames.get(participant.streamerId) ?? '이름 확인 필요'
                                            return (
                                                <BroadcastParticipantRow
                                                    key={`${participant.streamerId}-${index}`}
                                                    name={selectedName}
                                                    role={participant.role}
                                                    isBroadcasting={participant.isBroadcasting}
                                                    selector={
                                                        <Popover.Root
                                                            open={replacingParticipantIndex === index}
                                                            onOpenChange={(isOpen) => setReplacingParticipantIndex(isOpen ? index : null)}
                                                        >
                                                            <Popover.Trigger asChild>
                                                                <button
                                                                    type="button"
                                                                    aria-label={`${selectedName} 교체`}
                                                                    className="flex min-h-10 min-w-0 cursor-pointer items-center gap-2 rounded-md px-2 text-left text-sm font-semibold text-text hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                                                >
                                                                    <span className="min-w-0 flex-1 truncate">{selectedName}</span>
                                                                    <ChevronDown
                                                                        className="h-4 w-4 shrink-0 text-text-dim"
                                                                        aria-hidden="true"
                                                                    />
                                                                </button>
                                                            </Popover.Trigger>
                                                            <Popover.Portal>
                                                                <Popover.Content
                                                                    aria-label={`${selectedName} 교체 검색`}
                                                                    align="start"
                                                                    sideOffset={8}
                                                                    collisionPadding={16}
                                                                    className="z-[70] max-h-[var(--radix-popover-content-available-height)] w-80 max-w-[calc(100vw-2rem)] overflow-y-auto overscroll-contain rounded-lg border border-border bg-bg-secondary p-3 text-text shadow-modal-center outline-none"
                                                                >
                                                                    <BroadcastParticipantPicker
                                                                        options={participantOptions}
                                                                        selectedIds={selectedParticipantIds}
                                                                        label="교체할 참여자 검색"
                                                                        onChange={(streamerId) => {
                                                                            updateParticipant(index, { streamerId })
                                                                            setReplacingParticipantIndex(null)
                                                                        }}
                                                                    />
                                                                </Popover.Content>
                                                            </Popover.Portal>
                                                        </Popover.Root>
                                                    }
                                                    onRoleChange={(role) => updateParticipant(index, { role })}
                                                    onBroadcastingChange={(isBroadcasting) => updateParticipant(index, { isBroadcasting })}
                                                    onRemove={() =>
                                                        setField(
                                                            'participants',
                                                            canonical.participants.filter(
                                                                (_, participantIndex) => participantIndex !== index,
                                                            ),
                                                        )
                                                    }
                                                    disabled={createAutofillPending}
                                                />
                                            )
                                        })}
                                    </div>
                                    {provenance.host !== null && (
                                        <div className="mt-2 text-[11px] leading-4 text-text-dim">
                                            <p>{directEdits.host ? '직접 수정' : `자동 추정 · 수집 순번 ${provenance.host.rank} 기준`}</p>
                                            <p>수집 순번은 실제 주최자를 뜻하지 않습니다.</p>
                                        </div>
                                    )}
                                    {!participantsComplete && (
                                        <p role="status" className="py-3 text-xs text-[var(--color-warning)]">
                                            참여자 입력 미완료 · 승인에는 참여자 2명 이상과 정확히 한 명의 진행자가 필요합니다.
                                        </p>
                                    )}
                                </fieldset>
                            </section>

                            {targetRequired && (
                                <section aria-labelledby="promotion-target-heading">
                                    <h3
                                        id="promotion-target-heading"
                                        className="border-b border-border pb-2 text-sm font-semibold text-text"
                                    >
                                        반영할 기존 일정
                                    </h3>
                                    <fieldset className="grid min-w-0 gap-3 pt-3 sm:grid-cols-2">
                                        <legend className="sr-only">반영할 기존 일정</legend>
                                        <label>
                                            <span className="mb-1 block text-xs font-semibold text-text-muted">방송 ID</span>
                                            <input
                                                value={targetBroadcastId}
                                                onChange={(event) => {
                                                    setTargetBroadcastId(event.target.value)
                                                    resetIntent()
                                                }}
                                                className={inputClass}
                                                required
                                            />
                                        </label>
                                        <label>
                                            <span className="mb-1 block text-xs font-semibold text-text-muted">예상 버전</span>
                                            <input
                                                value={targetVersion}
                                                onChange={(event) => {
                                                    setTargetVersion(event.target.value)
                                                    resetIntent()
                                                }}
                                                className={inputClass}
                                                inputMode="numeric"
                                                required
                                            />
                                        </label>
                                    </fieldset>
                                </section>
                            )}

                            <section aria-labelledby="promotion-visibility-heading">
                                <h3
                                    id="promotion-visibility-heading"
                                    className="border-b border-border pb-2 text-sm font-semibold text-text"
                                >
                                    공개 상태
                                </h3>
                                <div className="pt-3">
                                    <BroadcastVisibilityField
                                        visible={desiredVisibility === 'VISIBLE'}
                                        onChange={(isVisible) => {
                                            setDesiredVisibility(isVisible ? 'VISIBLE' : 'HIDDEN')
                                            setField('isVisible', isVisible)
                                        }}
                                        disabled={createAutofillPending}
                                    />
                                </div>
                            </section>

                            <Collapsible open={additionalSettingsOpen} onOpenChange={setAdditionalSettingsOpen}>
                                <CollapsibleTrigger asChild>
                                    <button
                                        type="button"
                                        className="flex min-h-10 w-full items-center justify-between gap-2 border-b border-border py-2 text-left text-sm font-semibold text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                    >
                                        <span>추가 설정</span>
                                        <ChevronDown
                                            className={`h-4 w-4 shrink-0 text-text-dim transition-transform duration-[var(--dur-micro)] motion-reduce:transition-none ${additionalSettingsOpen ? 'rotate-180' : ''}`}
                                            aria-hidden="true"
                                        />
                                    </button>
                                </CollapsibleTrigger>
                                <CollapsibleContent forceMount data-additional-settings className="data-[state=closed]:hidden">
                                    <fieldset className="grid gap-3 pt-3 sm:grid-cols-2">
                                        <legend className="sr-only">추가 설정</legend>
                                        <BroadcastPreviousField
                                            value={canonical.previousBroadcastId ?? ''}
                                            onChange={(previousBroadcastId) =>
                                                setField(
                                                    'previousBroadcastId',
                                                    previousBroadcastId.trim().length > 0 ? previousBroadcastId : null,
                                                )
                                            }
                                        />
                                        <label>
                                            <span className="mb-1 block text-xs font-semibold text-text-muted">
                                                태그 <span className="font-normal text-text-dim">쉼표 구분</span>
                                            </span>
                                            <input
                                                value={tagInput}
                                                onChange={(event) => {
                                                    setTagInput(event.target.value)
                                                    setField(
                                                        'tags',
                                                        event.target.value
                                                            .split(',')
                                                            .map((tag) => tag.trim())
                                                            .filter(Boolean),
                                                    )
                                                }}
                                                className={inputClass}
                                                maxLength={300}
                                            />
                                        </label>
                                        <BroadcastToggleField
                                            label="드롭스"
                                            checked={canonical.isDrops}
                                            onChange={(isDrops) => setField('isDrops', isDrops)}
                                        />
                                        <BroadcastToggleField
                                            label="치지직 지원"
                                            checked={canonical.isChzzkSupport}
                                            onChange={(isChzzkSupport) => setField('isChzzkSupport', isChzzkSupport)}
                                        />
                                        <label>
                                            <span className="mb-1 block text-xs font-semibold text-text-muted">처리 사유</span>
                                            <select
                                                value={reasonCode}
                                                onChange={(event) => {
                                                    setReasonCode(event.target.value)
                                                    resetIntent()
                                                }}
                                                className={selectClass}
                                                required
                                            >
                                                <option value="MANUAL_APPROVAL">수동 승인</option>
                                                <option value="CANONICAL_MATCH">정규 일정 일치</option>
                                                <option value="CANONICAL_CORRECTION">정규 일정 교정</option>
                                            </select>
                                        </label>
                                        <label>
                                            <span className="mb-1 block text-xs font-semibold text-text-muted">
                                                메모 <span className="font-normal text-text-dim">(선택)</span>
                                            </span>
                                            <input
                                                value={note}
                                                onChange={(event) => {
                                                    setNote(event.target.value)
                                                    resetIntent()
                                                }}
                                                className={inputClass}
                                                maxLength={500}
                                            />
                                        </label>
                                    </fieldset>
                                </CollapsibleContent>
                            </Collapsible>

                            {mutation.isError && (
                                <p
                                    role="alert"
                                    className="rounded-[var(--radius-input)] border border-live/40 bg-live/10 p-2 text-xs text-live"
                                >
                                    <span className="font-semibold">승인 요청 실패 · </span>
                                    {promotionErrorMessage(mutation.error)}
                                </p>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="!flex-row !justify-between shrink-0 items-center border-t border-border bg-bg-secondary px-3 py-3">
                        <div className="min-w-0 text-left">
                            <p className="whitespace-nowrap text-xs font-semibold text-text">
                                {desiredVisibility === 'VISIBLE' ? '공개 반영' : '비공개 저장'}
                            </p>
                            <p className={`line-clamp-1 text-[11px] ${approvalBlockedReason === null ? 'text-primary' : 'text-text-dim'}`}>
                                {approvalBlockedReason ?? '승인할 수 있습니다.'}
                            </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                            <Button type="button" variant="ghost" disabled={mutation.isPending} onClick={() => onOpenChange(false)}>
                                취소
                            </Button>
                            <Button type="submit" loading={mutation.isPending} disabled={approvalBlockedReason !== null}>
                                {confirmedIntent !== null && mutation.isError
                                    ? '같은 요청 재시도'
                                    : desiredVisibility === 'VISIBLE'
                                      ? '공개 반영 승인'
                                      : '비공개 초안 승인'}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
