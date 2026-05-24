import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApiDelete, adminApiGet, adminApiPatch, adminApiPost } from '../lib/apiClient'
import type { PinnedEventItem, PinnedEventDetail, CreatePinnedEventRequest, UpdatePinnedEventRequest } from '../types'

const PINNED_EVENTS_QUERY_KEY = ['admin-pinned-events'] as const

export function usePinnedEvents() {
  return useQuery({
    queryKey: PINNED_EVENTS_QUERY_KEY,
    queryFn: () => adminApiGet<PinnedEventItem[]>('/api/admin/pinned-events'),
  })
}

export function usePinnedEventDetail(id: number) {
  return useQuery({
    queryKey: [...PINNED_EVENTS_QUERY_KEY, id],
    queryFn: () => adminApiGet<PinnedEventDetail>(`/api/admin/pinned-events/${id}`),
    enabled: id > 0,
  })
}

export function useCreatePinnedEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreatePinnedEventRequest) =>
      adminApiPost<{ id: number }>('/api/admin/pinned-events', body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PINNED_EVENTS_QUERY_KEY })
    },
  })
}

export function useUpdatePinnedEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdatePinnedEventRequest }) =>
      adminApiPatch<{ id: number }>(`/api/admin/pinned-events/${id}`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PINNED_EVENTS_QUERY_KEY })
    },
  })
}

export function useDeletePinnedEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => adminApiDelete(`/api/admin/pinned-events/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PINNED_EVENTS_QUERY_KEY })
    },
  })
}
