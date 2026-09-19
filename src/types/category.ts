export interface CategoryItem {
    id: number
    name: string
    backgroundImageUrl: string | null
    isActive: boolean
}

export interface ListCategoriesResponse {
    items: CategoryItem[]
}

export interface CreateCategoryRequest {
    name: string
    backgroundImageUrl: string | null
    isActive: boolean
}

export type UpdateCategoryRequest = CreateCategoryRequest
