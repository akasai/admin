export interface StreamerAffiliation {
    id: number
    name: string
    type: 'mcn' | 'agency' | 'crew' | 'esports'
    thumbnailUrl: string | null
}

export interface StreamerItem {
    id: number
    name: string
    nickname: string | null
    channelId: string | null
    isPartner: boolean
    streamerType: 'cam' | 'vtuber' | 'hybrid'
    isProGamer: boolean
    channelImageUrl?: string
    followerCount: number | null
    youtubeUrl?: string
    fanCafeUrl?: string
    affiliations: StreamerAffiliation[]
}

export interface StreamerListResponse {
    items: StreamerItem[]
    total: number
    page?: number
    size?: number
}

export type StreamerSortType = 'name_asc' | 'name_desc' | 'follower_desc'

export interface StreamerListParams {
    name?: string
    page?: number
    size?: number
    sort?: StreamerSortType
}

export interface RegisterStreamerRequest {
    channelId: string
}

export interface RegisterStreamerResponse {
    id: number
    channelId: string
    name: string
    isPartner: boolean
}

export interface UpdateStreamerRequest {
    nickname?: string
    youtubeUrl?: string | null
    fanCafeUrl?: string | null
    affiliationIds?: number[]
    streamerType?: 'cam' | 'vtuber' | 'hybrid'
    isProGamer?: boolean
}

export interface StreamerAlias {
    id: number
    alias: string
    createdAt: string
}

export interface ListStreamerAliasesResponse {
    items: StreamerAlias[]
}

export interface CreateStreamerAliasResponse {
    item: StreamerAlias
}

export interface CreateStreamerAliasRequest {
    alias: string
}
