import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApiDelete, adminApiGet, adminApiPatch, adminApiPost } from '../lib/apiClient'
import type { BroadcastListResponse, CreateBroadcastRequest, UpdateBroadcastRequest } from '../types'

const BROADCASTS_QUERY_KEY = ['admin-broadcasts'] as const

export function useAdminSchedule() {
    return useQuery({
        queryKey: BROADCASTS_QUERY_KEY,
        queryFn: () => adminApiGet<BroadcastListResponse>('/admin/broadcasts'),
    })
}

export function useCreateBroadcast() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (body: CreateBroadcastRequest) => adminApiPost<{ id: number }>('/admin/broadcasts', body),
        onSuccess: () => void queryClient.invalidateQueries({ queryKey: BROADCASTS_QUERY_KEY }),
    })
}

export function useUpdateBroadcast() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, body }: { id: number; body: UpdateBroadcastRequest }) =>
            adminApiPatch<{ id: number }>(`/admin/broadcasts/${id}`, body),
        onSuccess: () => void queryClient.invalidateQueries({ queryKey: BROADCASTS_QUERY_KEY }),
    })
}

export function useDeleteBroadcast() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: number) => adminApiDelete(`/admin/broadcasts/${id}`),
        onSuccess: () => void queryClient.invalidateQueries({ queryKey: BROADCASTS_QUERY_KEY }),
    })
}
