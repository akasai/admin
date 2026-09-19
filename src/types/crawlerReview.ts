export type CrawlerWorkspaceTab = 'review' | 'changes' | 'auto-audit' | 'completed' | 'exclusions' | 'aliases' | 'learning'
export type CrawlerReviewQueue = 'review' | 'changes' | 'auto' | 'completed'
export type CrawlerDecisionState =
    | 'AUTO_READY'
    | 'EVIDENCE_WAIT'
    | 'REVIEW'
    | 'APPROVED'
    | 'DISPUTED'
    | 'REJECTED'
    | 'SUPPRESSED'
    | 'HOLD'
    | 'PROMOTED'
    | 'DRAFT_APPLIED'
export type CrawlerLifecycleState = 'OPEN' | 'CLOSED'
export type CrawlerContentType = 'COLLAB' | 'TOURNAMENT' | 'INTERNAL_MATCH' | 'GAME' | 'TALK' | 'CONTENT' | 'OTHER'
export type CrawlerReviewAction = 'REJECT' | 'SUPPRESS' | 'HOLD' | 'REOPEN' | 'DISPUTE' | 'AUTO_AUDIT_CONFIRM'
export type CrawlerPromotionKind = 'CREATE' | 'MERGE' | 'UPDATE'
export type CrawlerPromotionResult =
    | 'PENDING'
    | 'ACTIVE'
    | 'APPLIED'
    | 'PROMOTED'
    | 'DRAFT_APPLIED'
    | 'FAILED'
    | 'CANCELLED'
    | 'ROLLED_BACK'
export type CrawlerAliasStatus = 'PROPOSED' | 'ACTIVE' | 'REJECTED' | 'RETIRED'
export type CrawlerAliasAction = 'ACTIVATE' | 'REJECT' | 'RETIRE' | 'REACTIVATE'
export type CrawlerExclusionStatus = 'ACTIVE' | 'RELEASED'
export type CrawlerLearningLabel = 'COLLAB' | 'NOT_COLLAB'
export type DesiredVisibility = 'VISIBLE' | 'HIDDEN'
export type CrawlerReadinessState = 'NOT_PREPARED' | 'INCOMPLETE' | 'READY'
export interface CrawlerReviewReadiness {
    state: CrawlerReadinessState
    failed: boolean
}
export type CrawlerReviewRisk = 'unprepared' | 'incomplete' | 'ready' | 'failed'

export type CrawlerAssessmentDecision = 'AUTO_READY' | 'EVIDENCE_WAIT' | 'REVIEW' | 'SUPPRESSED'

export interface CrawlerReviewAssessment {
    score: number
    decision: CrawlerAssessmentDecision
    deterministic: boolean
    reasonCodes: string[]
    assessedAt: string
    ruleVersion: string
    classifierVersion: string
}

export interface CrawlerAssessmentRelationFeatures {
    mutualRoster: boolean
    sharedEventKey: boolean
    officialRoster: boolean
    oneWayMention: number
    sessionContinuity: number
    titleSimilarity: number
    tagSimilarity: number
    timeOverlap: number
    categoryMatch: number
}

export interface CrawlerAssessmentRelation {
    fromParticipantId: string
    toParticipantId: string
    features: CrawlerAssessmentRelationFeatures
}

export interface CrawlerReviewDiagnosticMember {
    participantId: string
    displayName: string
    membershipStatus: string
}

export interface CrawlerReviewDiagnosticEdge {
    fromParticipantId: string
    toParticipantId: string
    strong: boolean
    medium: boolean
    score: number
    strongKinds: string[]
    oneWayMention: boolean
}

export interface CrawlerReviewDiagnosticGap {
    participantId: string
    mediumEdges: number
    requiredEdges: number
}

export interface CrawlerReviewGraphDiagnostics {
    strength: number | null
    supportedCount: number
    confirmedCount: number
    connected: boolean | null
    coherent: boolean
    edges: CrawlerReviewDiagnosticEdge[]
    gaps: CrawlerReviewDiagnosticGap[]
    groups: string[][]
}

export interface CrawlerReviewShadowDiagnostics {
    version: string
    unavailableReason: string | null
    graph: CrawlerReviewGraphDiagnostics | null
}

export interface CrawlerReviewDiagnostics {
    unavailableReason: string | null
    sourceRunStatus: string
    members: CrawlerReviewDiagnosticMember[]
    current: CrawlerReviewGraphDiagnostics | null
    shadow: CrawlerReviewShadowDiagnostics | null
}

export interface CursorPage<T> {
    items: T[]
    nextCursor: string | null
}

export interface CrawlerParticipantSummary {
    id: string
    displayName?: string
}

export interface CanonicalParticipantInput {
    streamerId: string
    role: 'host' | 'participant' | 'guest'
    isBroadcasting: boolean
}

export interface CanonicalSchedulePayload {
    title: string
    broadcastType: 'collab' | 'tournament' | 'internal_match' | 'game' | 'talk' | 'content' | 'other'
    categoryId: string | null
    startDate: string
    startTime: string | null
    previousBroadcastId: string | null
    isVisible: boolean
    isDrops: boolean
    isChzzkSupport: boolean
    tags: string[]
    participants: CanonicalParticipantInput[]
}

export interface EvidenceCollabContext {
    contentType: string
    relationParticipantIds: string[]
}

export interface CrawlerEvidence {
    schemaVersion: string
    evidenceKey: string
    sourceType: string
    participantId: string | null
    rank: number
    observedAt: string
    title: string
    normalizedTitle: string
    category: string | null
    tags: string[]
    collabContext: EvidenceCollabContext
}

export interface LatestCrawlerEvidence {
    title: string | null
    normalizedTitle: string | null
    category: string | null
    contentType: string | null
}

export interface CrawlerReviewOperationDto {
    operationId: string
    version: number
    kind: CrawlerPromotionKind
    source: string
    status: CrawlerPromotionResult
    targetBroadcastId: string | null
    expectedBroadcastVersion: number | null
    canonicalPayload: CanonicalSchedulePayload
    beforeSnapshot: CanonicalSchedulePayload | null
    afterSnapshot: CanonicalSchedulePayload | null
    attemptCount: number
    errorCode: string | null
    createdAt: string
    updatedAt: string
}

export interface CrawlerReviewActionDto {
    actionId: string
    actionType: string
    reason: string
    expectedVersion: number
    resultingVersion: number
    beforeDecisionState: string
    afterDecisionState: string
    beforeLifecycleState: string
    afterLifecycleState: string
    createdAt: string
    exclusionId: string | null
    learningRevision: { revisionId: string; label: CrawlerLearningLabel } | null
}

export interface CrawlerReviewItemDto {
    id: string
    version: number
    decisionState: CrawlerDecisionState
    lifecycleState: CrawlerLifecycleState
    firstSeenAt: string
    lastSeenAt: string
    participants: CrawlerParticipantSummary[]
    latestEvidence: LatestCrawlerEvidence | null
    readiness: CrawlerReviewReadiness
    assessment: CrawlerReviewAssessment
    updatedAt: string
}

export interface CrawlerReviewDetailDto extends CrawlerReviewItemDto {
    evidence: CrawlerEvidence[]
    actions: CrawlerReviewActionDto[]
    operations: CrawlerReviewOperationDto[]
    assessmentRelations: CrawlerAssessmentRelation[]
    diagnostics: CrawlerReviewDiagnostics
}

export interface CrawlerReviewListItem {
    detectionId: string
    version: number
    decisionState: CrawlerDecisionState
    lifecycleState: CrawlerLifecycleState
    normalizedTitle: string | null
    category: string | null
    contentType: CrawlerContentType
    assessment: CrawlerReviewAssessment
    participantCount: number
    participantNames: string[]
    evidenceCount: number
    evidencePurgeAfter: string | null
    readiness: CrawlerReviewReadiness
    updatedAt: string
}

export interface CanonicalBroadcastSummary extends CanonicalSchedulePayload {
    id: string
    version: number
}

export interface CrawlerPromotionSummary {
    operationId: string
    kind: CrawlerPromotionKind
    result: CrawlerPromotionResult
    targetBroadcastId: string | null
    version: number
    attempts: number
    desiredVisibility: DesiredVisibility
    errorCode: string | null
    createdAt: string
    updatedAt: string
}

export interface CrawlerReviewDetail extends CrawlerReviewListItem {
    participants: CrawlerParticipantSummary[]
    evidence: CrawlerEvidence[]
    assessmentRelations: CrawlerAssessmentRelation[]
    proposedCanonical: CanonicalSchedulePayload | null
    targetCanonical: CanonicalBroadcastSummary | null
    promotion: CrawlerPromotionSummary | null
    reviewActions: CrawlerReviewActionDto[]
    allowedActions: CrawlerReviewAction[]
    allowedPromotionKinds: CrawlerPromotionKind[]
    diagnostics: CrawlerReviewDiagnostics
}

export interface CrawlerReviewListParams {
    queue: CrawlerReviewQueue
    cursor?: string
    limit?: string
    query?: string
    decisionState?: CrawlerDecisionState
    contentType?: CrawlerContentType
    risk?: CrawlerReviewRisk
}

export interface VersionedIntent {
    expectedVersion: number
    idempotencyKey: string
}

export interface ReviewActionRequest extends VersionedIntent {
    action: CrawlerReviewAction
    reason: string
    exclusionEvidenceKey: string | null
}

export interface ReviewActionResponse {
    actionId: string
    detectionId: string
    detectionVersion: number
    decisionState: CrawlerDecisionState
    lifecycleState: CrawlerLifecycleState
    exclusionId: string | null
}

export interface QueuePromotionRequest extends VersionedIntent {
    kind: CrawlerPromotionKind
    operationId: string | null
    targetBroadcastId: string | null
    expectedBroadcastVersion: number | null
    canonicalPayload: CanonicalSchedulePayload | null
    editedCanonical: boolean
    desiredVisibility: boolean
    reason: string
}

export interface QueuePromotionResponse {
    actionId: string | null
    operationId: string
    operationVersion: number
    operationStatus: string
    detectionId: string
    detectionVersion: number
    broadcastId: string | null
    broadcastVersion: number | null
}

export interface RollbackPromotionRequest extends VersionedIntent {
    kind: 'ROLLBACK'
    operationId: string
    reason: string
}

export interface BulkPreviewItemInput {
    detectionId: string
    expectedVersion: number
}

export interface BulkReviewItemInput extends BulkPreviewItemInput {
    idempotencyKey: string
    canonicalPayload: CanonicalSchedulePayload | null
    editedCanonical: boolean
}

export interface BulkPreviewRequest {
    items: BulkPreviewItemInput[]
    action: 'APPROVE' | 'REJECT'
    desiredVisibility: boolean | null
}

export interface BulkPreviewItem {
    detectionId: string
    expectedVersion: number
    eligible: boolean
    conflictCode: string | null
    canonicalPayload: CanonicalSchedulePayload | null
    scheduleEstimate: { firstObservedSlot: string } | null
}

export interface BulkPreviewResponse {
    items: BulkPreviewItem[]
}

export interface BulkActionRequest {
    items: BulkReviewItemInput[]
    action: 'APPROVE' | 'REJECT'
    desiredVisibility: boolean | null
    reason: string
}

export interface BulkActionItemResult {
    detectionId: string
    result: QueuePromotionResponse | null
    action: ReviewActionResponse | null
    error: { code: string; message: string; currentVersion?: number } | null
}

export interface BulkActionResponse {
    items: BulkActionItemResult[]
}

export interface CrawlerAliasItem {
    id: string
    version: number
    streamer: CrawlerParticipantSummary
    alias: string
    normalizedAlias: string
    scope: string
    platform: string | null
    kind: string
    status: CrawlerAliasStatus
    updatedAt: string
}

export interface CrawlerAliasListParams {
    cursor?: string
    status?: CrawlerAliasStatus
    query?: string
}

export interface AliasActionRequest extends VersionedIntent {
    action: CrawlerAliasAction
    reason: string
}

export interface AliasActionResponse {
    actionId: string
    aliasId: string
    aliasVersion: number
    aliasStatus: CrawlerAliasStatus
}

export interface CrawlerExclusionItem {
    id: string
    version: number
    status: CrawlerExclusionStatus
    fingerprintHash: string
    participantIds: string[]
    contentType: CrawlerContentType
    sourceDetectionId: string
    title: string | null
    createdAt: string
    updatedAt: string
}

export interface CrawlerExclusionListParams {
    cursor?: string
    status?: CrawlerExclusionStatus
    query?: string
}

export interface ExclusionActionRequest extends VersionedIntent {
    action: 'RELEASE'
    reason: string
}

export interface ExclusionActionResponse {
    actionId: string
    exclusionId: string
    exclusionVersion: number
    exclusionStatus: CrawlerExclusionStatus
    detectionId: string
    detectionVersion: number
}

export interface CrawlerLearningRevision {
    id: string
    exampleId: string
    label: CrawlerLearningLabel
    reason: string
    ruleVersion: string | null
    classifierVersion: string | null
    supersedesRevisionId: string | null
    evidenceSchemaVersion: string
    evidence: CrawlerEvidence[]
    canonicalSnapshot: CanonicalSchedulePayload | null
    createdAt: string
}

export interface CrawlerLearningListParams {
    cursor?: string
    query?: string
    label?: CrawlerLearningLabel
}

export interface CrawlerLearningComparison {
    revisionId: string
    exampleId: string
    detectionId: string
    sourceActionId: string
    sourceActionType: string
    sourceDetectionVersion: number
    label: CrawlerLearningLabel
    labelStatus: 'CURRENT' | 'SUPERSEDED' | 'NEEDS_REVIEW'
    assessmentEventId: string | null
    observationDate: string | null
    unavailableReason: 'NO_PRE_ACTION_ASSESSMENT' | null
    assessment: CrawlerReviewAssessment | null
    diagnostics: CrawlerReviewDiagnostics | null
}

export interface PublishLearningDatasetRequest extends VersionedIntent {
    name: string
    revisionIds: string[]
}

export interface PublishLearningDatasetResponse {
    datasetId: string
    datasetVersion: number
    revisionCount: number
}

export interface AdminSession {
    authenticated: boolean
}
