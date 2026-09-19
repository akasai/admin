import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApiDelete, adminApiGet, adminApiPatch, adminApiPost } from '../lib/apiClient'
import type { CategoryItem, CreateCategoryRequest, ListCategoriesResponse, UpdateCategoryRequest } from '../types'

const CATEGORIES_QUERY_KEY = ['admin-categories'] as const

export function useCategories() {
    return useQuery({
        queryKey: CATEGORIES_QUERY_KEY,
        queryFn: async () => (await adminApiGet<ListCategoriesResponse>('/admin/categories')).items,
    })
}

export function useCreateCategory() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (body: CreateCategoryRequest) => adminApiPost<{ id: number }>('/admin/categories', body),
        onSuccess: () => void queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY }),
    })
}

export function useUpdateCategory() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, body }: { id: number; body: UpdateCategoryRequest }) =>
            adminApiPatch<{ id: number }>(`/admin/categories/${id}`, body),
        onSuccess: () => void queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY }),
    })
}

export function useDeleteCategory() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: number) => adminApiDelete(`/admin/categories/${id}`),
        onSuccess: () => void queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY }),
    })
}

export type { CategoryItem }
