export type StagingItemRaw = {
    id: number
    fingerprint: string
    title: string | null
    category: string | null
    host_streamer_id: number | null
    participant_ids: number[]
    participant_names: (string | null)[]
    event_date_kst: string
    start_time: string | null
    first_source: string
    last_source: string
    confidence: number
    observation_count: number
    first_seen_at: string
    last_seen_at: string
    created_at: string
}

export type StagingParticipant = {
    id: number
    name: string
    synced: boolean
}

export type StagingItem = StagingItemRaw & {
    participants: StagingParticipant[]
}

export type StagingDetailRaw = StagingItemRaw & {
    observations: unknown
}

export type StagingDetail = StagingItem & {
    observations: unknown
}

export type UpdateStagingRequest = {
    title?: string
    category?: string
    start_time?: string | null
    participant_ids?: number[]
    host_streamer_id?: number | null
}
