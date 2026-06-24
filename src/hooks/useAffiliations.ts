import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApiDelete, adminApiGet, adminApiPatch, adminApiPost } from '../lib/apiClient'
import type { AffiliationItem, CreateAffiliationRequest, UpdateAffiliationRequest } from '../types'

const AFFILIATIONS_QUERY_KEY = ['admin-affiliations'] as const

interface GoListAffiliationsResponse {
    items: AffiliationItem[]
}

export function useAffiliations() {
    return useQuery({
        queryKey: AFFILIATIONS_QUERY_KEY,
        queryFn: async () => {
            const res = await adminApiGet<GoListAffiliationsResponse>('/admin/affiliations')
            return res.items
        },
    })
}

export function useCreateAffiliation() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (body: CreateAffiliationRequest) => adminApiPost<AffiliationItem>('/admin/affiliations', body),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: AFFILIATIONS_QUERY_KEY })
        },
    })
}

export function useUpdateAffiliation() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, body }: { id: number; body: UpdateAffiliationRequest }) =>
            adminApiPatch<AffiliationItem>(`/admin/affiliations/${id}`, body),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: AFFILIATIONS_QUERY_KEY })
        },
    })
}

export function useDeleteAffiliation() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: number) => adminApiDelete(`/admin/affiliations/${id}`),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: AFFILIATIONS_QUERY_KEY })
        },
    })
}
