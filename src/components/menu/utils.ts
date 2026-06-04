import type { Menu } from './types'

export function getGroupLabel(groupKey: string): string {
    return groupKey === '__ungrouped__' ? '대 메뉴' : groupKey
}

export function groupMenus(menus: Menu[]): Record<string, Menu[]> {
    return menus.reduce(
        (acc, menu) => {
            const key = menu.group ?? '__ungrouped__'
            if (!acc[key]) acc[key] = []
            acc[key].push(menu)
            return acc
        },
        {} as Record<string, Menu[]>
    )
}

export function sortGroups(groups: string[]): string[] {
    return [...groups].sort((a, b) => {
        if (a === '__ungrouped__') return -1
        if (b === '__ungrouped__') return 1
        return a.localeCompare(b, 'ko')
    })
}
