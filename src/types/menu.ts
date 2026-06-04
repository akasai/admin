// menu_v2 테이블 기반
export interface MenuRow {
    id: number
    group: string | null
    title: string
    path: string
    is_external: boolean
    sort_order: number
    is_visible: boolean
}

export interface CreateMenuRequest {
    group: string | null
    title: string
    path: string
    is_external: boolean
    sort_order: number
    is_visible: boolean
}

export interface UpdateMenuRequest {
    group?: string | null
    title?: string
    path?: string
    is_external?: boolean
    sort_order?: number
    is_visible?: boolean
}

export interface ReorderMenuItem {
    id: number
    group: string | null
    sort_order: number
}

export interface ReorderMenusRequest {
    items: ReorderMenuItem[]
}
