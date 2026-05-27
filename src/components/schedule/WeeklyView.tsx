import { useMemo } from 'react'
import dayjs from 'dayjs'
import { Pin, Trash2 } from 'lucide-react'
import type { BroadcastItem, PinnedEventGroup, WeeklyScheduleResponse } from '../../types'
import { WEEKDAY_MON_TO_SUN, getWeekDatesMonday, toDateParam } from './utils'
import { cn } from '../../lib/cn'
import { panelClass } from '../../constants/styles'

interface WeeklyViewProps {
    selectedDate: dayjs.Dayjs
    data: WeeklyScheduleResponse
    pinnedGroups?: PinnedEventGroup[]
    onEdit: (item: BroadcastItem) => void
    onDelete: (item: BroadcastItem) => void
}

export function WeeklyView({ selectedDate, data, pinnedGroups, onEdit, onDelete }: WeeklyViewProps) {
    const daysByDate = useMemo(() => {
        const map = new Map<string, BroadcastItem[]>()
        for (const day of data.days) {
            map.set(day.date, day.items)
        }
        return map
    }, [data.days])

    const weekDates = useMemo(() => getWeekDatesMonday(selectedDate), [selectedDate])

    return (
        <div className={cn(panelClass, 'overflow-hidden')}>
            <div className="overflow-x-auto">
                <div className="grid min-w-[980px] grid-cols-7 divide-x divide-[#3a3a44]">
                    {weekDates.map((date, index) => {
                        const key = toDateParam(date)
                        const items = (daysByDate.get(key) ?? []).slice().sort((a, b) => dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf())
                        const pinnedGroupsForDay = (pinnedGroups ?? [])
                            .map((group) => ({
                                ...group,
                                items: group.items.filter(
                                    (item) => item.startTime !== null && dayjs(item.startTime).format('YYYY-MM-DD') === key,
                                ),
                            }))
                            .filter((group) => group.items.length > 0)

                        return (
                            <div key={key} className="min-h-[420px] bg-[#1a1a23]">
                                <div className="border-b border-[#3a3a44] bg-[#20202a] px-3 py-2.5">
                                    <p className="text-[11px] text-[#848494]">{WEEKDAY_MON_TO_SUN[index]}</p>
                                    <p className="mt-0.5 text-sm font-semibold text-[#efeff1]">{date.format('M월 D일')}</p>
                                </div>

                                <div className="space-y-2 p-2.5">
                                    {pinnedGroupsForDay.map((group) => (
                                        <div key={group.eventId}>
                                            <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-blue-400">
                                                <Pin className="h-2.5 w-2.5" />
                                                {group.eventName}
                                            </p>
                                            {group.items.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="group mb-1 flex items-start gap-1 rounded-lg border border-blue-500/30 bg-blue-500/5 px-2.5 py-2 transition hover:bg-blue-500/10"
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => onEdit(item)}
                                                        className="min-w-0 flex-1 cursor-pointer text-left"
                                                    >
                                                        <p className={cn('text-[11px] tabular-nums', item.startTime !== null ? 'text-blue-300' : 'text-amber-300')}>{item.startTime !== null ? dayjs(item.startTime).format('HH:mm') : '미정'}</p>
                                                        <p className="mt-0.5 truncate text-xs font-medium text-[#efeff1]">{item.title}</p>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => onDelete(item)}
                                                        className="shrink-0 cursor-pointer rounded p-0.5 text-[#848494] opacity-0 transition hover:text-red-400 group-hover:opacity-100"
                                                        aria-label={`${item.title} 삭제`}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ))}

                                    {items.map((item) => (
                                        <div
                                            key={item.id}
                                            className="group flex items-start gap-1 rounded-lg border border-[#3a3a44] bg-[#26262e] px-2.5 py-2 transition hover:border-blue-500/40 hover:bg-[#2c2c37]"
                                        >
                                            <button
                                                type="button"
                                                onClick={() => onEdit(item)}
                                                className="min-w-0 flex-1 cursor-pointer text-left"
                                            >
                                                <p className={cn('text-[11px] tabular-nums', item.startTime !== null ? 'text-blue-300' : 'text-amber-300')}>{item.startTime !== null ? dayjs(item.startTime).format('HH:mm') : '미정'}</p>
                                                <p className="mt-0.5 truncate text-xs font-medium text-[#efeff1]">{item.title}</p>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onDelete(item)}
                                                className="shrink-0 cursor-pointer rounded p-0.5 text-[#848494] opacity-0 transition hover:text-red-400 group-hover:opacity-100"
                                                aria-label={`${item.title} 삭제`}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                    {items.length === 0 && pinnedGroupsForDay.length === 0 && <p className="pt-2 text-center text-xs text-[#666674]">일정 없음</p>}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
