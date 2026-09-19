export interface StreamerChannel {
    id: number
    streamerId: number
    platform: string
    externalChannelId: string
    channelName: string
    description: string | null
    channelUrl: string
    profileImageUrl: string | null
    isPrimary: boolean
    isActive: boolean
    createdAt: string
    updatedAt: string
}

export interface StreamerItem {
    id: number
    name: string
    isActive: boolean
    channels: StreamerChannel[]
    createdAt: string
    updatedAt: string
}

export interface StreamerListResponse {
    items: StreamerItem[]
}

export interface StreamerListParams {
    page?: number
    size?: number
    search?: string
}

export interface CreateStreamerRequest {
    name: string
    isActive: boolean
}

export interface UpdateStreamerRequest {
    name?: string
    isActive?: boolean
}

export interface CreateStreamerChannelRequest {
    platform: string
    externalChannelId: string
    channelName: string
    description: string | null
    channelUrl: string
    profileImageUrl: string | null
    isPrimary: boolean
    isActive: boolean
}

export type UpdateStreamerChannelRequest = CreateStreamerChannelRequest
