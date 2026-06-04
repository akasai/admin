import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ChevronDown } from 'lucide-react'

import { Badge } from '@/components/shadcn/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/shadcn/ui/collapsible'
import { SortableMenuItem } from './SortableMenuItem'
import type { Menu } from './types'

interface MenuGroupSectionProps {
    groupLabel: string
    menus: Menu[]
    isOpen: boolean
    isDropTarget: boolean
    onToggle: () => void
    onToggleVisibility: (id: number, visible: boolean) => void
    onEdit: (menu: Menu) => void
    onDelete: (menu: Menu) => void
}

export function MenuGroupSection({
    groupLabel,
    menus,
    isOpen,
    isDropTarget,
    onToggle,
    onToggleVisibility,
    onEdit,
    onDelete,
}: MenuGroupSectionProps) {
    const visibleCount = menus.filter((m) => m.is_visible).length

    return (
        <Collapsible open={isOpen} onOpenChange={onToggle}>
            <CollapsibleTrigger asChild>
                <button
                    className={`flex w-full cursor-pointer items-center justify-between rounded-lg border-2 px-3 py-2 transition-colors sm:px-4 sm:py-3 ${
                        isDropTarget
                            ? 'border-dashed border-text-muted bg-card-hover'
                            : 'border-transparent bg-card hover:bg-card-hover'
                    }`}
                >
                    <div className="flex items-center gap-2 sm:gap-3">
                        <span className="font-semibold text-text">{groupLabel}</span>
                        <Badge variant="secondary" className="bg-card-hover text-text-muted">
                            {visibleCount}/{menus.length}
                        </Badge>
                    </div>
                    <ChevronDown
                        className={`h-4 w-4 text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2 pl-2 sm:pl-4">
                <SortableContext items={menus.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                    {menus.map((menu) => (
                        <SortableMenuItem
                            key={menu.id}
                            menu={menu}
                            onToggleVisibility={onToggleVisibility}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))}
                </SortableContext>
            </CollapsibleContent>
        </Collapsible>
    )
}
