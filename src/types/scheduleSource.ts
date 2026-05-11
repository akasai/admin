export interface ScheduleSourceItem {
    id: number
    streamer_id: number
    source_type: string
    source_identifier: string
    is_active: boolean
    crawl_days: number[]
    crawl_hours: number[]
    created_at: string
    streamers: { name: string }
}

export interface ListScheduleSourcesResponse {
    sources: ScheduleSourceItem[]
}

export interface CreateScheduleSourceRequest {
    streamer_id: number
    source_type: string
    source_identifier: string
    crawl_days?: number[]
    crawl_hours?: number[]
}

export interface UpdateScheduleSourceRequest {
    is_active?: boolean
    source_identifier?: string
    crawl_days?: number[]
    crawl_hours?: number[]
}
