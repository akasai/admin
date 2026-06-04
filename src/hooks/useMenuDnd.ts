import { useState } from 'react'
import {
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragOverEvent,
    type DragStartEvent,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import type { Menu } from '@/components/menu'

export function useMenuDnd(menus: Menu[], setMenus: React.Dispatch<React.SetStateAction<Menu[]>>) {
    const [activeId, setActiveId] = useState<number | null>(null)
    const [overGroupKey, setOverGroupKey] = useState<string | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 200, tolerance: 5 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as number)
    }

    const handleDragOver = (event: DragOverEvent) => {
        const { over } = event
        if (!over) {
            setOverGroupKey(null)
            return
        }
        const overMenu = menus.find((m) => m.id === over.id)
        if (overMenu) {
            setOverGroupKey(overMenu.group ?? '__ungrouped__')
        }
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        setActiveId(null)
        setOverGroupKey(null)

        if (!over || active.id === over.id) return

        const activeMenu = menus.find((m) => m.id === active.id)
        const overMenu = menus.find((m) => m.id === over.id)

        if (!activeMenu || !overMenu) return

        const isCrossGroup = activeMenu.group !== overMenu.group

        setMenus((prev) => {
            const oldIndex = prev.findIndex((m) => m.id === active.id)
            const newIndex = prev.findIndex((m) => m.id === over.id)

            if (isCrossGroup) {
                const updated = prev.map((m) => (m.id === active.id ? { ...m, group: overMenu.group } : m))
                return arrayMove(updated, oldIndex, newIndex)
            }

            return arrayMove(prev, oldIndex, newIndex)
        })
    }

    const activeMenu = activeId ? menus.find((m) => m.id === activeId) : null

    return {
        sensors,
        activeId,
        activeMenu,
        overGroupKey,
        handleDragStart,
        handleDragOver,
        handleDragEnd,
    }
}
