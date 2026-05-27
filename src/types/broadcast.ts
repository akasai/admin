/** 스케줄 뷰 타입 */
export type ScheduleView = 'daily' | 'weekly' | 'monthly'

/** 스케줄 조회 파라미터 */
export interface ScheduleParams {
    view: ScheduleView
    date: string
    tz?: string
}

/** 방송 참여자 (broadcast_streamers 기반) */
export interface BroadcastStreamer {
    id: number
    name: string
    streamerId: number | null
    isHost: boolean
    avatarUrl: string | null
    isPartner?: boolean
}

/** 카테고리 (join) */
export interface BroadcastCategory {
    id: number
    name: string
    thumbnailUrl: string | null
}

/** 방송 아이템 (API 응답) */
export interface BroadcastItem {
    id: number
    title: string
    broadcastType: string | null
    startTime: string | null
    thumbnailUrl: string | null
    isDrops: boolean
    isVisible: boolean
    isChzzkSupport: boolean
    source: string | null
    sourceUrl: string | null
    sourceImageUrl: string | null
    category: BroadcastCategory | null
    tags: string[]
    streamers: BroadcastStreamer[]
}

/** 일별 스케줄 */
export interface DaySchedule {
    date: string
    totalCount: number
    items: BroadcastItem[]
}

/** 고정 일정 그룹 */
export interface PinnedEventGroup {
    eventId: number
    eventName: string
    items: BroadcastItem[]
}

/** Daily 응답 */
export interface DailyScheduleResponse {
    view: 'daily'
    date: string
    totalCount: number
    items: BroadcastItem[]
    pinnedGroups?: PinnedEventGroup[]
}

/** Weekly 응답 */
export interface WeeklyScheduleResponse {
    view: 'weekly'
    weekStart: string
    weekEnd: string
    days: DaySchedule[]
    pinnedGroups?: PinnedEventGroup[]
}

/** Monthly 응답 */
export interface MonthlyScheduleResponse {
    view: 'monthly'
    month: string
    gridStart: string
    gridEnd: string
    days: DaySchedule[]
    pinnedGroups?: PinnedEventGroup[]
}

export type ScheduleResponse = DailyScheduleResponse | WeeklyScheduleResponse | MonthlyScheduleResponse

/** 방송 생성 요청 */
export interface CreateBroadcastRequest {
    title: string
    startTime: string | null
    broadcastType?: string
    categoryId?: number
    thumbnailUrl?: string
    tags?: string[]
    isVisible?: boolean
    isDrops?: boolean
    isChzzkSupport?: boolean
    source?: string
    externalId?: string
    sourceVersion?: string
    participants?: BroadcastParticipantInput[]
    participantIds?: number[]
    sourceUrl?: string
    sourceImageUrl?: string
}

/** 방송 수정 요청 */
export interface UpdateBroadcastRequest {
    title?: string
    startTime?: string | null
    broadcastType?: string
    categoryId?: number
    thumbnailUrl?: string
    tags?: string[]
    isVisible?: boolean
    isDrops?: boolean
    isChzzkSupport?: boolean
    source?: string
    externalId?: string
    sourceVersion?: string
    participants?: BroadcastParticipantInput[]
    participantIds?: number[]
    sourceUrl?: string
    sourceImageUrl?: string
}

/** 참여자 입력 (생성/수정 시) */
export interface BroadcastParticipantInput {
    name: string
    streamerId?: number
    isHost?: boolean
}

/** 추출 메타데이터 (broadcast_extractions) */
export interface ExtractionMeta {
    confidence: number
    needsReview: boolean
    sourceImageUrl: string | null
    rawContent: string | null
    extractionModel: string | null
    extractedAt: string
}

/** 검수 대기 방송 아이템 */
export interface ReviewBroadcastItem extends BroadcastItem {
    extraction: ExtractionMeta | null
}

/** 검수 대기 목록 응답 */
export interface ReviewQueueResponse {
    items: ReviewBroadcastItem[]
    totalCount: number
}

/** 크롤링 실행 요청 */
export interface RunBroadcastCrawlRequest {
    month: string
}

/** 크롤링된 참여자 */
export interface CrawledParticipant {
    channelId: string | null
    name: string
    channelImageUrl: string | null
    isPartner: boolean
    isManaged: boolean
    streamerId: number | null
}

/** 크롤링된 방송 */
export interface CrawledBroadcast {
    sourceEventId: string
    title: string
    tags: string[]
    broadcastType: string
    startTime: string
    allDay: boolean
    timezone: string
    thumbnailUrl: string | null
    isCollab: boolean
    participants: CrawledParticipant[]
}

/** 크롤링 실행 응답 */
export interface RunBroadcastCrawlResponse {
    broadcasts: CrawledBroadcast[]
}

/** 크롤링 반영 요청 */
export interface InsertCrawledBroadcastsRequest {
    broadcasts: CrawledBroadcast[]
}

/** 크롤링 반영 응답 */
export interface InsertCrawledBroadcastsResponse {
    insertedCount: number
}
