import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApiDelete, adminApiPost } from '../lib/apiClient'
import type { CreateStreamerAliasRequest, CreateStreamerAliasResponse } from '../types'

const STREAMER_DETAIL_QUERY_KEY = ['admin-streamers', 'detail'] as const

export function useCreateStreamerAlias() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ streamerId, alias }: { streamerId: number; alias: string }) => {
            const body: CreateStreamerAliasRequest = { alias }
            return adminApiPost<CreateStreamerAliasResponse>(
                `/admin/streamers/${streamerId}/aliases`,
                body,
            )
        },
        onSuccess: (_data, variables) => {
            void queryClient.invalidateQueries({
                queryKey: [...STREAMER_DETAIL_QUERY_KEY, variables.streamerId],
            })
        },
    })
}

export function useDeleteStreamerAlias() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ streamerId, aliasId }: { streamerId: number; aliasId: number }) =>
            adminApiDelete(`/admin/streamers/${streamerId}/aliases/${aliasId}`),
        onSuccess: (_data, variables) => {
            void queryClient.invalidateQueries({
                queryKey: [...STREAMER_DETAIL_QUERY_KEY, variables.streamerId],
            })
        },
    })
}
