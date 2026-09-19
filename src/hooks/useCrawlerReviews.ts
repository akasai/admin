import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, adminApiGet, adminApiPost } from '../lib/apiClient'
import type {
    AliasActionRequest,
    AliasActionResponse,
    BulkActionRequest,
    BulkActionResponse,
    BulkPreviewRequest,
    BulkPreviewResponse,
    CrawlerAliasItem,
    CrawlerAliasListParams,
    CrawlerContentType,
    CrawlerExclusionItem,
    CrawlerExclusionListParams,
    CrawlerLearningListParams,
    CrawlerLearningComparison,
    CrawlerLearningRevision,
    CrawlerPromotionResult,
    CrawlerReviewDetail,
    CrawlerReviewDetailDto,
    CrawlerReviewItemDto,
    CrawlerReviewListItem,
    CrawlerReviewListParams,
    CrawlerReviewOperationDto,
    CursorPage,
    ExclusionActionRequest,
    ExclusionActionResponse,
    PublishLearningDatasetRequest,
    PublishLearningDatasetResponse,
    QueuePromotionRequest,
    QueuePromotionResponse,
    ReviewActionRequest,
    ReviewActionResponse,
    RollbackPromotionRequest,
} from '../types/crawlerReview'

const CRAWLER_QUERY_KEY = ['admin-crawler'] as const
const CONTENT_TYPES: Record<CrawlerContentType, true> = {
    COLLAB: true,
    TOURNAMENT: true,
    INTERNAL_MATCH: true,
    GAME: true,
    TALK: true,
    CONTENT: true,
    OTHER: true,
}

function stringParams(input: Record<string, string | undefined>): Record<string, string> {
    return Object.fromEntries(
        Object.entries(input).filter((entry): entry is [string, string] => entry[1] !== undefined && entry[1].length > 0),
    )
}

function retryTransportFailure(failureCount: number, error: Error): boolean {
    return !(error instanceof ApiError) && failureCount < 2
}

function useInvalidateCrawlerQueries() {
    const queryClient = useQueryClient()
    return () => queryClient.invalidateQueries({ queryKey: CRAWLER_QUERY_KEY })
}

function operationResult(operation: CrawlerReviewOperationDto | null | undefined): CrawlerPromotionResult | null {
    if (operation === null || operation === undefined) return null
    if (operation.status === 'APPLIED') return operation.canonicalPayload.isVisible ? 'PROMOTED' : 'DRAFT_APPLIED'
    return operation.status
}

function contentType(value: string | null | undefined): CrawlerContentType {
    const normalized = value?.toUpperCase()
    return normalized !== undefined && CONTENT_TYPES[normalized as CrawlerContentType] === true
        ? (normalized as CrawlerContentType)
        : 'OTHER'
}

function reviewListItem(item: CrawlerReviewItemDto): CrawlerReviewListItem {
    return {
        detectionId: item.id,
        version: item.version,
        decisionState: item.decisionState,
        lifecycleState: item.lifecycleState,
        normalizedTitle: item.latestEvidence?.normalizedTitle ?? item.latestEvidence?.title ?? null,
        category: item.latestEvidence?.category ?? null,
        contentType: contentType(item.latestEvidence?.contentType),
        assessment: item.assessment,
        participantCount: item.participants.length,
        participantNames: item.participants.map((participant) => participant.displayName ?? '이름 확인 필요'),
        evidenceCount: item.latestEvidence === null ? 0 : 1,
        evidencePurgeAfter: null,
        readiness: item.readiness,
        updatedAt: item.updatedAt,
    }
}

function reviewDetail(item: CrawlerReviewDetailDto): CrawlerReviewDetail {
    const operation = item.operations[0] ?? null
    const observedTimes = item.evidence.map((evidence) => Date.parse(evidence.observedAt)).filter(Number.isFinite)
    const newestEvidenceAt = observedTimes.length === 0 ? null : Math.max(...observedTimes)
    const purgeAfter = newestEvidenceAt === null ? null : new Date(newestEvidenceAt + 30 * 24 * 60 * 60 * 1000).toISOString()
    const base = reviewListItem(item)
    const allowedActions: CrawlerReviewDetail['allowedActions'] = []
    if (item.decisionState === 'REVIEW') allowedActions.push('REJECT', 'SUPPRESS', 'HOLD')
    if (item.decisionState === 'HOLD' || item.decisionState === 'DISPUTED') allowedActions.push('REOPEN')
    if (item.decisionState === 'APPROVED' || item.decisionState === 'PROMOTED' || item.decisionState === 'DRAFT_APPLIED')
        allowedActions.push('DISPUTE')
    if (
        item.decisionState === 'PROMOTED' &&
        item.lifecycleState === 'CLOSED' &&
        operation?.source === 'AUTO' &&
        operation.status === 'APPLIED'
    ) {
        allowedActions.push('AUTO_AUDIT_CONFIRM')
    }
    const targetCanonical =
        operation?.beforeSnapshot === null || operation?.beforeSnapshot === undefined
            ? null
            : {
                  ...operation.beforeSnapshot,
                  id: operation.targetBroadcastId ?? '',
                  version: operation.expectedBroadcastVersion ?? 0,
              }
    return {
        ...base,
        evidenceCount: item.evidence.length,
        evidencePurgeAfter: purgeAfter,
        assessmentRelations: item.assessmentRelations,
        diagnostics: item.diagnostics,
        participants: item.participants,
        evidence: item.evidence,
        proposedCanonical: operation?.canonicalPayload ?? null,
        targetCanonical,
        promotion:
            operation === null
                ? null
                : {
                      operationId: operation.operationId,
                      kind: operation.kind,
                      result: operationResult(operation) ?? operation.status,
                      targetBroadcastId: operation.targetBroadcastId,
                      version: operation.version,
                      attempts: operation.attemptCount,
                      desiredVisibility: operation.canonicalPayload.isVisible ? 'VISIBLE' : 'HIDDEN',
                      errorCode: operation.errorCode,
                      createdAt: operation.createdAt,
                      updatedAt: operation.updatedAt,
                  },
        reviewActions: [...item.actions].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt)),
        allowedActions,
        allowedPromotionKinds: item.decisionState === 'REVIEW' ? ['CREATE', 'MERGE', 'UPDATE'] : [],
    }
}

export function useCrawlerReviews(params: CrawlerReviewListParams) {
    return useQuery({
        queryKey: [...CRAWLER_QUERY_KEY, 'reviews', params],
        queryFn: () =>
            adminApiGet<CursorPage<CrawlerReviewItemDto>>(
                '/admin/crawler/reviews',
                stringParams({
                    tab: params.queue,
                    cursor: params.cursor,
                    limit: params.limit,
                }),
            ),
        select: (page): CursorPage<CrawlerReviewListItem> => {
            const query = params.query?.trim().toLocaleLowerCase('ko-KR')
            const items = page.items.map(reviewListItem).filter((item) => {
                if (
                    query !== undefined &&
                    query.length > 0 &&
                    !`${item.normalizedTitle ?? ''} ${item.category ?? ''} ${item.participantNames.join(' ')}`
                        .toLocaleLowerCase('ko-KR')
                        .includes(query)
                )
                    return false
                if (params.decisionState !== undefined && item.decisionState !== params.decisionState) return false
                if (params.contentType !== undefined && item.contentType !== params.contentType) return false
                if (params.risk === 'failed' && !item.readiness.failed) return false
                if (params.risk === 'unprepared' && (item.readiness.failed || item.readiness.state !== 'NOT_PREPARED')) return false
                if (params.risk === 'incomplete' && (item.readiness.failed || item.readiness.state !== 'INCOMPLETE')) return false
                if (params.risk === 'ready' && (item.readiness.failed || item.readiness.state !== 'READY')) return false
                return true
            })
            return { items, nextCursor: page.nextCursor }
        },
    })
}

export function useCrawlerReview(detectionId: string | null) {
    return useQuery({
        queryKey: [...CRAWLER_QUERY_KEY, 'reviews', 'detail', detectionId],
        queryFn: () => adminApiGet<CrawlerReviewDetailDto>(`/admin/crawler/reviews/${encodeURIComponent(detectionId ?? '')}`),
        select: reviewDetail,
        enabled: detectionId !== null,
    })
}

export function useCrawlerReviewAction() {
    const invalidate = useInvalidateCrawlerQueries()
    return useMutation({
        mutationFn: ({ detectionId, body }: { detectionId: string; body: ReviewActionRequest }) =>
            adminApiPost<ReviewActionResponse>(`/admin/crawler/reviews/${encodeURIComponent(detectionId)}/action`, body),
        retry: retryTransportFailure,
        onSuccess: invalidate,
    })
}

export function useQueueCrawlerPromotion() {
    const invalidate = useInvalidateCrawlerQueries()
    return useMutation({
        mutationFn: ({ detectionId, body }: { detectionId: string; body: QueuePromotionRequest }) =>
            adminApiPost<QueuePromotionResponse>(`/admin/crawler/reviews/${encodeURIComponent(detectionId)}/promotion`, body),
        retry: retryTransportFailure,
        onSuccess: invalidate,
    })
}

export function useRollbackCrawlerPromotion() {
    const invalidate = useInvalidateCrawlerQueries()
    return useMutation({
        mutationFn: ({ detectionId, body }: { detectionId: string; body: RollbackPromotionRequest }) =>
            adminApiPost<QueuePromotionResponse>(`/admin/crawler/reviews/${encodeURIComponent(detectionId)}/promotion`, body),
        retry: retryTransportFailure,
        onSuccess: invalidate,
    })
}

export function useCrawlerBulkPreview() {
    return useMutation({
        mutationFn: (body: BulkPreviewRequest) => adminApiPost<BulkPreviewResponse>('/admin/crawler/reviews/bulk-preview', body),
        retry: retryTransportFailure,
    })
}

export function useCrawlerBulkAction() {
    const invalidate = useInvalidateCrawlerQueries()
    return useMutation({
        mutationFn: (body: BulkActionRequest) => adminApiPost<BulkActionResponse>('/admin/crawler/reviews/bulk-action', body),
        retry: retryTransportFailure,
        onSuccess: invalidate,
    })
}

export function useCrawlerAliases(params: CrawlerAliasListParams) {
    return useQuery({
        queryKey: [...CRAWLER_QUERY_KEY, 'aliases', params],
        queryFn: () =>
            adminApiGet<CursorPage<CrawlerAliasItem>>(
                '/admin/crawler/aliases',
                stringParams({ cursor: params.cursor, status: params.status }),
            ),
        select: (page): CursorPage<CrawlerAliasItem> => {
            const query = params.query?.trim().toLocaleLowerCase('ko-KR')
            return {
                items:
                    query === undefined || query.length === 0
                        ? page.items
                        : page.items.filter((item) =>
                              `${item.alias} ${item.normalizedAlias} ${item.streamer.displayName ?? ''} ${item.streamer.id}`
                                  .toLocaleLowerCase('ko-KR')
                                  .includes(query),
                          ),
                nextCursor: page.nextCursor,
            }
        },
    })
}

export function useCrawlerAliasAction() {
    const invalidate = useInvalidateCrawlerQueries()
    return useMutation({
        mutationFn: ({ aliasId, body }: { aliasId: string; body: AliasActionRequest }) =>
            adminApiPost<AliasActionResponse>(`/admin/crawler/aliases/${encodeURIComponent(aliasId)}/action`, body),
        retry: retryTransportFailure,
        onSuccess: invalidate,
    })
}

export function useCrawlerExclusions(params: CrawlerExclusionListParams) {
    return useQuery({
        queryKey: [...CRAWLER_QUERY_KEY, 'exclusions', params],
        queryFn: () =>
            adminApiGet<CursorPage<CrawlerExclusionItem>>(
                '/admin/crawler/exclusions',
                stringParams({ cursor: params.cursor, status: params.status }),
            ),
        select: (page): CursorPage<CrawlerExclusionItem> => {
            const query = params.query?.trim().toLocaleLowerCase('ko-KR')
            return {
                items:
                    query === undefined || query.length === 0
                        ? page.items
                        : page.items.filter((item) =>
                              `${item.title ?? ''} ${item.fingerprintHash} ${item.participantIds.join(' ')}`
                                  .toLocaleLowerCase('ko-KR')
                                  .includes(query),
                          ),
                nextCursor: page.nextCursor,
            }
        },
    })
}

export function useCrawlerExclusionAction() {
    const invalidate = useInvalidateCrawlerQueries()
    return useMutation({
        mutationFn: ({ exclusionId, body }: { exclusionId: string; body: ExclusionActionRequest }) =>
            adminApiPost<ExclusionActionResponse>(`/admin/crawler/exclusions/${encodeURIComponent(exclusionId)}/action`, body),
        retry: retryTransportFailure,
        onSuccess: invalidate,
    })
}

export function useCrawlerLearningRevisions(params: CrawlerLearningListParams) {
    return useQuery({
        queryKey: [...CRAWLER_QUERY_KEY, 'learning', 'revisions', params],
        queryFn: () =>
            adminApiGet<CursorPage<CrawlerLearningRevision>>(
                '/admin/crawler/learning/revisions',
                stringParams({ cursor: params.cursor, q: params.query, label: params.label }),
            ),
    })
}

export function useCrawlerLearningComparison(revisionId: string | null) {
    return useQuery({
        queryKey: [...CRAWLER_QUERY_KEY, 'learning-comparison', revisionId],
        queryFn: () =>
            adminApiGet<CrawlerLearningComparison>(`/admin/crawler/learning/revisions/${encodeURIComponent(revisionId ?? '')}/comparison`),
        enabled: revisionId !== null,
    })
}

export function usePublishCrawlerLearningDataset() {
    const invalidate = useInvalidateCrawlerQueries()
    return useMutation({
        mutationFn: (body: PublishLearningDatasetRequest) =>
            adminApiPost<PublishLearningDatasetResponse>('/admin/crawler/learning/datasets', body),
        retry: retryTransportFailure,
        onSuccess: invalidate,
    })
}
