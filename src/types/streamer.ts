export type StreamerType = 'cam' | 'vtuber' | 'hybrid'

export interface Affiliation {
    id: number
    name: string
    type: 'mcn' | 'agency' | 'crew' | 'esports'
    thumbnailUrl: string | null
}

export interface Streamer {
    id: number
    name: string
    nickname: string | null
    channelId: string | null
    channelImageUrl: string | null
    description: string | null
    isPartner: boolean
    followerCount: number | null
    streamerType: StreamerType
    isProGamer: boolean
    youtubeUrl: string | null
    fanCafeUrl: string | null
    affiliations: Affiliation[]
    createdAt: string
}

export interface StreamerAffiliation {
    id: number
    name: string
}

export interface StreamerDetailAffiliation {
    id: number
    name: string
    type: 'mcn' | 'agency' | 'crew' | 'esports'
}

export interface StreamerDetailAlias {
    id: number
    alias: string
    createdAt: string
}

export interface StreamerDetail {
    id: number
    name: string
    nickname: string | null
    channelId: string | null
    channelImageUrl: string | null
    description: string | null
    isPartner: boolean
    followerCount: number | null
    streamerType: StreamerType
    isProGamer: boolean
    youtubeUrl: string | null
    fanCafeUrl: string | null
    createdAt: string
    affiliations: StreamerDetailAffiliation[]
    aliases: StreamerDetailAlias[]
}

export interface StreamerItem {
    id: number
    name: string
    nickname: string | null
    channelId: string | null
    channelImageUrl: string | null
    isPartner: boolean
    followerCount: number | null
    streamerType: StreamerType
    isProGamer: boolean
    createdAt: string
    affiliations: StreamerAffiliation[]
}

export interface StreamerStats {
    total: number
    partner: number
    vtuber: number
}

export interface StreamerListResponse {
    items: StreamerItem[]
    total: number
    page: number
    size: number
    stats: StreamerStats
}

export type StreamerSortType = 'name' | 'follower' | 'created_at'

export interface StreamerListParams {
    type?: StreamerType
    partner?: boolean
    sort?: StreamerSortType
    order?: 'asc' | 'desc'
    page?: number
    size?: number
    search?: string
}

export interface RegisterStreamerRequest {
    channelId: string
}

export interface RegisterStreamerResponse {
    id: number
    name: string
}

export interface UpdateStreamerRequest {
    nickname?: string
    youtubeUrl?: string
    fanCafeUrl?: string
    streamerType?: StreamerType
    isProGamer?: boolean
}

export interface StreamerAlias {
    id: number
    alias: string
    createdAt: string
}

export interface CreateStreamerAliasRequest {
    alias: string
}

export interface CreateStreamerAliasResponse {
    id: number
    alias: string
    createdAt: string
}

export interface StreamerFormData {
    nickname: string
    youtubeUrl: string
    fanCafeUrl: string
    streamerType: StreamerType
    isProGamer: boolean
    affiliationIds: number[]
}

export const EMPTY_STREAMER_FORM: StreamerFormData = {
    nickname: '',
    youtubeUrl: '',
    fanCafeUrl: '',
    streamerType: 'cam',
    isProGamer: false,
    affiliationIds: [],
}

export function toStreamerForm(streamer: Streamer): StreamerFormData {
    return {
        nickname: streamer.nickname ?? '',
        youtubeUrl: streamer.youtubeUrl ?? '',
        fanCafeUrl: streamer.fanCafeUrl ?? '',
        streamerType: streamer.streamerType,
        isProGamer: streamer.isProGamer,
        affiliationIds: streamer.affiliations.map((a) => a.id),
    }
}
