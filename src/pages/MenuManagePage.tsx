import { useEffect, useState } from 'react'
import { closestCenter, DndContext, DragOverlay } from '@dnd-kit/core'
import { Plus } from 'lucide-react'

import {
    EMPTY_FORM,
    getGroupLabel,
    groupMenus,
    MenuFormDialog,
    MenuGroupSection,
    MenuItemOverlay,
    sortGroups,
    toMenu,
    type Menu,
    type MenuFormData,
} from '@/components/menu'
import { Button } from '@/components/shadcn/ui/button'
import { useAdminToast } from '@/hooks/useAdminToast'
import { useAdminMenus, useCreateMenu } from '@/hooks/useMenuManage'
import { useMenuDnd } from '@/hooks/useMenuDnd'

export default function MenuManagePage() {
    const { addToast } = useAdminToast()
    const { data: apiMenus, isLoading, isError } = useAdminMenus()
    const createMenu = useCreateMenu()
    const [menus, setMenus] = useState<Menu[]>([])
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})

    const [formOpen, setFormOpen] = useState(false)
    const [editingMenu, setEditingMenu] = useState<Menu | null>(null)
    const [formData, setFormData] = useState<MenuFormData>(EMPTY_FORM)

    const { sensors, activeMenu, overGroupKey, handleDragStart, handleDragOver, handleDragEnd } = useMenuDnd(
        menus,
        setMenus
    )

    useEffect(() => {
        if (apiMenus) {
            setMenus(apiMenus.map(toMenu))
            const groups = new Set(apiMenus.map((m) => m.group ?? '__ungrouped__'))
            setOpenGroups(Object.fromEntries([...groups].map((g) => [g, true])))
        }
    }, [apiMenus])

    const groupedMenus = groupMenus(menus)
    const sortedGroups = sortGroups(Object.keys(groupedMenus))

    const toggleGroup = (groupKey: string) => {
        setOpenGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }))
    }

    const handleToggleVisibility = (id: number, visible: boolean) => {
        setMenus((prev) => prev.map((m) => (m.id === id ? { ...m, is_visible: visible } : m)))
    }

    const openCreateModal = () => {
        setEditingMenu(null)
        setFormData(EMPTY_FORM)
        setFormOpen(true)
    }

    const openEditModal = (menu: Menu) => {
        setEditingMenu(menu)
        setFormData({
            group: menu.group ?? '',
            title: menu.title,
            path: menu.path,
            is_external: menu.is_external,
            is_visible: menu.is_visible,
        })
        setFormOpen(true)
    }

    const handleSubmit = () => {
        if (!formData.title.trim() || !formData.path.trim()) return

        if (editingMenu) {
            setMenus((prev) =>
                prev.map((m) =>
                    m.id === editingMenu.id
                        ? {
                              ...m,
                              group: formData.group.trim() || null,
                              title: formData.title.trim(),
                              path: formData.path.trim(),
                              is_external: formData.is_external,
                              is_visible: formData.is_visible,
                          }
                        : m
                )
            )
        } else {
            createMenu.mutate(
                {
                    group: formData.group.trim() || null,
                    title: formData.title.trim(),
                    path: formData.path.trim(),
                    is_external: formData.is_external,
                    is_visible: formData.is_visible,
                    sort_order: menus.length,
                },
                {
                    onSuccess: () => {
                        addToast({ message: '메뉴가 추가되었습니다.', variant: 'success' })
                    },
                    onError: () => {
                        addToast({ message: '메뉴 추가에 실패했습니다.', variant: 'error' })
                    },
                }
            )
        }
        setFormOpen(false)
    }

    const handleDelete = (menu: Menu) => {
        setMenus((prev) => prev.filter((m) => m.id !== menu.id))
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-text-muted">로딩 중...</div>
            </div>
        )
    }

    if (isError) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-red-500">메뉴 목록을 불러오는데 실패했습니다.</div>
            </div>
        )
    }

    return (
        <div className="space-y-4 p-4 sm:space-y-6 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-lg font-bold text-text sm:text-xl">메뉴 관리</h1>
                    <p className="mt-1 text-sm text-text-muted">GNB에 표시되는 메뉴를 관리합니다.</p>
                </div>
                <Button variant="outline" onClick={openCreateModal} className="w-full cursor-pointer sm:w-auto">
                    <Plus className="h-4 w-4" />
                    메뉴 추가
                </Button>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className="space-y-4">
                    {sortedGroups.map((groupKey) => (
                        <MenuGroupSection
                            key={groupKey}
                            groupLabel={getGroupLabel(groupKey)}
                            menus={groupedMenus[groupKey]}
                            isOpen={openGroups[groupKey] ?? true}
                            isDropTarget={overGroupKey === groupKey}
                            onToggle={() => toggleGroup(groupKey)}
                            onToggleVisibility={handleToggleVisibility}
                            onEdit={openEditModal}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>

                <DragOverlay>{activeMenu ? <MenuItemOverlay menu={activeMenu} /> : null}</DragOverlay>
            </DndContext>

            <MenuFormDialog
                open={formOpen}
                onOpenChange={setFormOpen}
                formData={formData}
                onFormDataChange={setFormData}
                onSubmit={handleSubmit}
                isEditing={!!editingMenu}
            />
        </div>
    )
}
