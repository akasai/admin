import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApiDelete, adminApiGet, adminApiPatch, adminApiPost } from '../lib/apiClient'
import type { StagingItem, StagingItemRaw, StagingDetail, StagingDetailRaw, UpdateStagingRequest } from '../types'

const STAGING_QUERY_KEY = ['admin-staging'] as const

function toStagingItem(raw: StagingItemRaw): StagingItem {
    const ids = raw.participant_ids ?? []
    const names = raw.participant_names ?? []
    return {
        ...raw,
        participants: ids.map((id, i) => ({
            id,
            name: names[i] ?? `#${id}`,
            synced: names[i] != null,
        })),
    }
}

export function useStaging() {
    return useQuery({
        queryKey: STAGING_QUERY_KEY,
        queryFn: async () => {
            const rows = await adminApiGet<StagingItemRaw[]>('/api/admin/staging')
            return rows.map(toStagingItem)
        },
    })
}

export function useStagingDetail(id: number | null) {
    return useQuery({
        queryKey: [...STAGING_QUERY_KEY, 'detail', id],
        queryFn: async () => {
            const raw = await adminApiGet<StagingDetailRaw>(`/api/admin/staging/${id}`)
            return { ...toStagingItem(raw), observations: raw.observations } as StagingDetail
        },
        enabled: id !== null,
    })
}

export function useUpdateStaging() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, body }: { id: number; body: UpdateStagingRequest }) =>
            adminApiPatch<StagingItemRaw>(`/api/admin/staging/${id}`, body),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: STAGING_QUERY_KEY })
        },
    })
}

export function usePromoteStaging() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: number) => adminApiPost<{ id: number }>(`/api/admin/staging/${id}/promote`, {}),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: STAGING_QUERY_KEY })
        },
    })
}

export function useDeleteStaging() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: number) => adminApiDelete(`/api/admin/staging/${id}`),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: STAGING_QUERY_KEY })
        },
    })
}
