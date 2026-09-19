import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { adminApiDelete, adminApiGet, adminApiPatch, adminApiPost } from '../lib/apiClient'
import type {
    CreateStreamerChannelRequest,
    CreateStreamerRequest,
    StreamerListResponse,
    UpdateStreamerChannelRequest,
    UpdateStreamerRequest,
} from '../types'

const STREAMERS_QUERY_KEY = ['admin-streamers'] as const

export function useStreamers() {
    return useQuery({
        queryKey: STREAMERS_QUERY_KEY,
        queryFn: () => adminApiGet<StreamerListResponse>('/admin/streamers'),
    })
}

function invalidateStreamers(queryClient: QueryClient) {
    return () => void queryClient.invalidateQueries({ queryKey: STREAMERS_QUERY_KEY })
}

export function useCreateStreamer() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (body: CreateStreamerRequest) => adminApiPost<{ id: number }>('/admin/streamers', body),
        onSuccess: invalidateStreamers(queryClient),
    })
}

export function useUpdateStreamer() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, body }: { id: number; body: UpdateStreamerRequest }) =>
            adminApiPatch<{ id: number }>(`/admin/streamers/${id}`, body),
        onSuccess: invalidateStreamers(queryClient),
    })
}

export function useDeleteStreamer() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: number) => adminApiDelete(`/admin/streamers/${id}`),
        onSuccess: invalidateStreamers(queryClient),
    })
}

export function useCreateStreamerChannel() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ streamerId, body }: { streamerId: number; body: CreateStreamerChannelRequest }) =>
            adminApiPost<{ id: number }>(`/admin/streamers/${streamerId}/channels`, body),
        onSuccess: invalidateStreamers(queryClient),
    })
}

export function useUpdateStreamerChannel() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ streamerId, channelId, body }: { streamerId: number; channelId: number; body: UpdateStreamerChannelRequest }) =>
            adminApiPatch<{ id: number }>(`/admin/streamers/${streamerId}/channels/${channelId}`, body),
        onSuccess: invalidateStreamers(queryClient),
    })
}

export function useDeleteStreamerChannel() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ streamerId, channelId }: { streamerId: number; channelId: number }) =>
            adminApiDelete(`/admin/streamers/${streamerId}/channels/${channelId}`),
        onSuccess: invalidateStreamers(queryClient),
    })
}
