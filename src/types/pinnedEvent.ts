export interface PinnedEventItem {
  id: number
  name: string
  isActive: boolean
  createdAt: string
  broadcastCount: number
}

export interface PinnedBroadcastStreamer {
  id: number
  name: string
  streamerId?: number
  isHost: boolean
}

export interface PinnedBroadcastItem {
  id: number
  title: string
  startTime: string | null
  date: string
  streamers: PinnedBroadcastStreamer[]
}

export interface PinnedEventDetail {
  id: number
  name: string
  isActive: boolean
  createdAt: string
  broadcasts: PinnedBroadcastItem[]
}

export interface CreatePinnedEventEntry {
  date: string
  title: string
  startTime?: string | null
  participants?: Array<{
    streamerId?: number
    name: string
    isHost: boolean
  }>
}

export interface CreatePinnedEventRequest {
  name: string
  entries: CreatePinnedEventEntry[]
}

export interface UpdatePinnedEventRequest {
  name?: string
  isActive?: boolean
  entries?: CreatePinnedEventEntry[]
}
