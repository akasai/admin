import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApiDelete, adminApiGet, adminApiPatch, adminApiPost } from '../lib/apiClient'
import type {
    RegisterStreamerRequest,
    RegisterStreamerResponse,
    StreamerDetail,
    StreamerListParams,
    StreamerListResponse,
    UpdateStreamerRequest,
} from '../types'

const STREAMERS_QUERY_KEY = ['admin-streamers'] as const

function buildQueryParams(params: StreamerListParams): Record<string, string> {
    const result: Record<string, string> = {}
    if (params.type) result.type = params.type
    if (params.partner !== undefined) result.partner = String(params.partner)
    if (params.sort) result.sort = params.sort
    if (params.order) result.order = params.order
    if (params.page) result.page = String(params.page)
    if (params.size) result.size = String(params.size)
    if (params.search) result.search = params.search
    return result
}

export function useStreamers(params: StreamerListParams) {
    return useQuery({
        queryKey: [...STREAMERS_QUERY_KEY, params],
        queryFn: () => adminApiGet<StreamerListResponse>('/admin/streamers', buildQueryParams(params)),
    })
}

export function useStreamerDetail(id: number | null) {
    return useQuery({
        queryKey: [...STREAMERS_QUERY_KEY, 'detail', id],
        queryFn: () => adminApiGet<StreamerDetail>(`/admin/streamers/${id}`),
        enabled: id !== null,
    })
}

export function useRegisterStreamer() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (body: RegisterStreamerRequest) => adminApiPost<RegisterStreamerResponse>('/admin/streamers', body),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: STREAMERS_QUERY_KEY })
        },
    })
}

export function useRefreshStreamer() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: number) => adminApiPost<void>(`/admin/streamers/${id}/refresh`, {}),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: STREAMERS_QUERY_KEY })
        },
    })
}

export function useDeleteStreamer() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: number) => adminApiDelete(`/admin/streamers/${id}`),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: STREAMERS_QUERY_KEY })
        },
    })
}

export function useUpdateStreamer() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, body }: { id: number; body: UpdateStreamerRequest }) =>
            adminApiPatch<void>(`/admin/streamers/${id}`, body),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: STREAMERS_QUERY_KEY })
        },
    })
}

export function useAddStreamerAffiliation() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ streamerId, affiliationId }: { streamerId: number; affiliationId: number }) =>
            adminApiPost<void>(`/admin/streamers/${streamerId}/affiliations`, { affiliationId }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: STREAMERS_QUERY_KEY })
        },
    })
}

export function useRemoveStreamerAffiliation() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ streamerId, affiliationId }: { streamerId: number; affiliationId: number }) =>
            adminApiDelete(`/admin/streamers/${streamerId}/affiliations/${affiliationId}`),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: STREAMERS_QUERY_KEY })
        },
    })
}
