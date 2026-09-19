/* Hallmark · pre-emit critique: P5 H5 E4 S5 R5 V4 */
import { Eye, EyeOff, Pencil, Trash2, Users } from 'lucide-react'
import { panelClass } from '../../constants/styles'
import type { BroadcastItem } from '../../types'
import { ListEmpty } from '../ListState'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { BROADCAST_TYPE_LABELS } from './utils'

interface DailyViewProps {
    items: BroadcastItem[]
    categoryNames: ReadonlyMap<number, string>
    onEdit: (item: BroadcastItem) => void
    onDelete: (item: BroadcastItem) => void
}

export function DailyView({ items, categoryNames, onEdit, onDelete }: DailyViewProps) {
    if (items.length === 0) {
        return (
            <div className={panelClass}>
                <ListEmpty message="선택한 날짜에 방송 일정이 없습니다." />
            </div>
        )
    }

    const sortedItems = [...items].sort((left, right) => (left.startTime ?? '99:99:99').localeCompare(right.startTime ?? '99:99:99'))

    return (
        <div className={panelClass}>
            <div
                className="hidden grid-cols-[5rem_minmax(0,1fr)_6rem_5.5rem] gap-3 border-b border-border bg-bg px-5 py-2.5 text-[11px] font-semibold tracking-[0.04em] text-text-dim sm:grid"
                aria-hidden="true"
            >
                <span>시각</span>
                <span>방송 일정</span>
                <span>상태</span>
                <span className="text-right">관리</span>
            </div>
            <ul className="divide-y divide-border">
                {sortedItems.map((item) => {
                    const broadcastingCount = item.participants.filter((participant) => participant.isBroadcasting).length
                    const categoryName =
                        item.categoryId === null ? '미분류' : (categoryNames.get(item.categoryId) ?? `카테고리 #${item.categoryId}`)

                    return (
                        <li
                            key={item.id}
                            className="grid min-w-0 grid-cols-[4.25rem_minmax(0,1fr)] gap-x-3 gap-y-3 px-4 py-4 sm:grid-cols-[5rem_minmax(0,1fr)_6rem_5.5rem] sm:items-center sm:px-5"
                        >
                            <div>
                                <p className="font-mono text-sm font-semibold tabular-nums text-text">
                                    {item.startTime?.slice(0, 5) ?? '미정'}
                                </p>
                                <span className="mt-1 block text-[11px] text-text-dim">
                                    {item.startTime === null ? '시간 미정' : '시작'}
                                </span>
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold leading-5 text-text [overflow-wrap:anywhere] sm:truncate">
                                    {item.title}
                                </p>
                                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-dim">
                                    <span>{BROADCAST_TYPE_LABELS[item.broadcastType]}</span>
                                    <span className="min-w-0 max-w-full [overflow-wrap:anywhere]">{categoryName}</span>
                                    <span className="inline-flex items-center gap-1">
                                        <Users className="h-3.5 w-3.5" aria-hidden="true" /> 참여 {item.participants.length}명
                                    </span>
                                    {broadcastingCount > 0 && <span>송출 {broadcastingCount}명</span>}
                                    {item.previousBroadcastId !== null && (
                                        <span className="font-mono">이전 #{item.previousBroadcastId}</span>
                                    )}
                                    <span className="sm:hidden">{item.isVisible ? '노출' : '미노출'}</span>
                                </div>
                            </div>
                            <div className="hidden sm:block">
                                <Badge variant={item.isVisible ? 'primary' : 'internal'} size="sm">
                                    {item.isVisible ? (
                                        <Eye className="mr-1 h-3 w-3" aria-hidden="true" />
                                    ) : (
                                        <EyeOff className="mr-1 h-3 w-3" aria-hidden="true" />
                                    )}
                                    {item.isVisible ? '노출' : '미노출'}
                                </Badge>
                            </div>
                            <div className="col-span-2 flex items-center justify-end gap-1 border-t border-border/70 pt-3 sm:col-span-1 sm:border-0 sm:pt-0">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onEdit(item)}
                                    className="flex-1 sm:h-10 sm:w-10 sm:flex-none sm:px-0"
                                    aria-label={`${item.title} 수정`}
                                >
                                    <Pencil className="h-4 w-4" aria-hidden="true" />
                                    <span className="ml-2 sm:sr-only">수정</span>
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onDelete(item)}
                                    className="flex-1 text-[var(--color-danger)] hover:border-live/30 hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)] sm:h-10 sm:w-10 sm:flex-none sm:px-0"
                                    aria-label={`${item.title} 삭제`}
                                >
                                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                                    <span className="ml-2 sm:sr-only">삭제</span>
                                </Button>
                            </div>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}
