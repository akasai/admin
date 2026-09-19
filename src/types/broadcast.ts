export type BroadcastType = 'collab' | 'tournament' | 'internal_match' | 'game' | 'talk' | 'content' | 'other'
export type ParticipantRole = 'host' | 'participant' | 'guest'

export interface BroadcastParticipant {
    streamerId: number
    role: ParticipantRole
    isBroadcasting: boolean
}

export interface BroadcastItem {
    id: number
    title: string
    broadcastType: BroadcastType
    categoryId: number | null
    startDate: string
    startTime: string | null
    previousBroadcastId: number | null
    isVisible: boolean
    participants: BroadcastParticipant[]
}

export interface BroadcastListResponse {
    items: BroadcastItem[]
}

export interface ScheduleDay {
    date: string
    items: BroadcastItem[]
}

export interface BroadcastParticipantInput {
    streamerId: number
    role: ParticipantRole
    isBroadcasting: boolean
}

export interface BroadcastRequest {
    title: string
    broadcastType: BroadcastType
    categoryId: number | null
    startDate: string
    startTime: string | null
    previousBroadcastId: number | null
    isVisible: boolean
    participants: BroadcastParticipantInput[]
}

export type CreateBroadcastRequest = BroadcastRequest
export type UpdateBroadcastRequest = BroadcastRequest
