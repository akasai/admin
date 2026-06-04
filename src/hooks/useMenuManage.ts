import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApiDelete, adminApiGet, adminApiPatch, adminApiPost } from '../lib/apiClient'
import type { CreateMenuRequest, MenuRow, ReorderMenusRequest, UpdateMenuRequest } from '../types'

const ADMIN_MENUS_QUERY_KEY = ['admin-menus'] as const

export function useAdminMenus() {
    return useQuery({
        queryKey: ADMIN_MENUS_QUERY_KEY,
        queryFn: () => adminApiGet<MenuRow[]>('/admin/menus'),
    })
}

export function useCreateMenu() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (body: CreateMenuRequest) => adminApiPost<MenuRow>('/admin/menus', body),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ADMIN_MENUS_QUERY_KEY })
        },
    })
}

export function useUpdateMenu() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, body }: { id: number; body: UpdateMenuRequest }) => adminApiPatch<MenuRow>(`/admin/menus/${id}`, body),
        onMutate: async ({ id, body }) => {
            await queryClient.cancelQueries({ queryKey: ADMIN_MENUS_QUERY_KEY })
            const previous = queryClient.getQueryData<MenuRow[]>(ADMIN_MENUS_QUERY_KEY)
            queryClient.setQueryData<MenuRow[]>(ADMIN_MENUS_QUERY_KEY, (old) =>
                old?.map((menu) => (menu.id === id ? { ...menu, ...body } : menu)),
            )
            return { previous }
        },
        onError: (_err, _vars, context) => {
            if (context?.previous !== undefined) {
                queryClient.setQueryData(ADMIN_MENUS_QUERY_KEY, context.previous)
            }
        },
        onSettled: () => {
            void queryClient.invalidateQueries({ queryKey: ADMIN_MENUS_QUERY_KEY })
        },
    })
}

export function useDeleteMenu() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: number) => adminApiDelete(`/admin/menus/${id}`),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ADMIN_MENUS_QUERY_KEY })
        },
    })
}

export function useReorderMenus() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (body: ReorderMenusRequest) => adminApiPatch<void>('/admin/menus/reorder', body),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ADMIN_MENUS_QUERY_KEY })
        },
    })
}
