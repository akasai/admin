import type { CSSProperties } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ExternalLink, Eye, EyeOff, GripVertical, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

import { Button } from '@/components/shadcn/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/shadcn/ui/dropdown-menu'
import type { Menu } from './types'

interface SortableMenuItemProps {
    menu: Menu
    onToggleVisibility: (id: number, visible: boolean) => void
    onEdit: (menu: Menu) => void
    onDelete: (menu: Menu) => void
}

export function SortableMenuItem({ menu, onToggleVisibility, onEdit, onDelete }: SortableMenuItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: menu.id,
    })

    const style: CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-2 rounded-lg border border-border bg-card p-2 hover:bg-card-hover sm:gap-3 sm:p-3"
        >
            <button
                {...attributes}
                {...listeners}
                className="cursor-grab text-text-muted hover:text-text active:cursor-grabbing"
            >
                <GripVertical className="h-4 w-4" />
            </button>

            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                <span className="truncate font-medium text-text">{menu.title}</span>
                <code className="hidden rounded bg-card-hover px-1.5 py-0.5 text-xs text-text-muted sm:inline">
                    {menu.path}
                </code>
                {menu.is_external && <ExternalLink className="h-3.5 w-3.5 shrink-0 text-text-muted" />}
            </div>

            <div className="flex shrink-0 items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon-xs"
                    className="cursor-pointer sm:size-8"
                    onClick={() => onToggleVisibility(menu.id, !menu.is_visible)}
                >
                    {menu.is_visible ? (
                        <Eye className="h-4 w-4 text-green-500" />
                    ) : (
                        <EyeOff className="h-4 w-4 text-text-muted" />
                    )}
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon-xs"
                            className="cursor-pointer text-text-muted hover:bg-card-hover hover:text-text sm:size-8"
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(menu)} className="cursor-pointer">
                            <Pencil className="h-4 w-4" />
                            수정
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => onDelete(menu)}
                            className="cursor-pointer text-red-500 focus:bg-red-500/10 focus:text-red-500"
                        >
                            <Trash2 className="h-4 w-4" />
                            삭제
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}

export function MenuItemOverlay({ menu }: { menu: Menu }) {
    return (
        <div className="flex items-center gap-2 rounded-lg border border-primary bg-card p-2 shadow-lg sm:gap-3 sm:p-3">
            <GripVertical className="h-4 w-4 text-text-muted" />
            <span className="font-medium text-text">{menu.title}</span>
            <code className="hidden rounded bg-card-hover px-1.5 py-0.5 text-xs text-text-muted sm:inline">
                {menu.path}
            </code>
        </div>
    )
}
