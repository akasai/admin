import type { MenuRow } from '@/types'

export interface Menu {
    id: number
    group: string | null
    title: string
    path: string
    is_external: boolean
    sort_order: number
    is_visible: boolean
}

export interface MenuFormData {
    group: string
    title: string
    path: string
    is_external: boolean
    is_visible: boolean
}

export const EMPTY_FORM: MenuFormData = {
    group: '',
    title: '',
    path: '',
    is_external: false,
    is_visible: true,
}

export function toMenu(row: MenuRow): Menu {
    return {
        id: row.id,
        group: row.group,
        title: row.title,
        path: row.path,
        is_external: row.is_external,
        sort_order: row.sort_order,
        is_visible: row.is_visible,
    }
}
