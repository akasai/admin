import dayjs from 'dayjs'
import { Eye, EyeOff, Gift, Pencil, Pin, Trash2, Zap } from 'lucide-react'
import type { BroadcastItem, DailyScheduleResponse, PinnedEventGroup } from '../../types'
import { getBroadcastTypeBadgeClass } from './utils'
import { cn } from '../../lib/cn'
import { panelClass } from '../../constants/styles'
import { ListEmpty } from '../ListState'

interface DailyViewProps {
    data: DailyScheduleResponse
    pinnedGroups?: PinnedEventGroup[]
    onEdit: (item: BroadcastItem) => void
    onDelete: (item: BroadcastItem) => void
}

function ParticipantAvatars({ item }: { item: BroadcastItem }) {
    const visibleStreamers = item.streamers.slice(0, 5)
    const hiddenCount = Math.max(0, item.streamers.length - 5)

    if (item.streamers.length === 0) {
        return <span className="text-xs text-[#848494]">-</span>
    }

    return (
        <div className="flex items-center -space-x-2">
            {visibleStreamers.map((streamer) => (
                <div key={`${item.id}-${streamer.id}`} className="relative rounded-full ring-2 ring-[#1a1a23]" title={streamer.name}>
                    {streamer.avatarUrl ? (
                        <img src={streamer.avatarUrl} alt={streamer.name} className="h-7 w-7 rounded-full object-cover" />
                    ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2a2a34] text-[10px] font-semibold text-[#b8b8c3]">
                            {streamer.name.slice(0, 1)}
                        </div>
                    )}
                </div>
            ))}
            {hiddenCount > 0 && (
                <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-[#2a2a34] text-[10px] font-bold text-[#adadb8] ring-2 ring-[#1a1a23]">
                    +{hiddenCount}
                </div>
            )}
        </div>
    )
}

function StatusIcons({ item }: { item: BroadcastItem }) {
    return (
        <div className="flex items-center gap-1">
            <span
                className={cn('rounded-full p-1', item.isVisible ? 'text-emerald-400' : 'text-red-400')}
                title={item.isVisible ? '공개' : '비공개'}
            >
                {item.isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </span>
            {item.isDrops && (
                <span className="rounded-full bg-blue-500/20 p-1 text-blue-300" title="드롭스">
                    <Gift className="h-3.5 w-3.5" />
                </span>
            )}
            {item.isChzzkSupport && (
                <span className="rounded-full bg-orange-500/20 p-1 text-orange-300" title="치지직 후원">
                    <Zap className="h-3.5 w-3.5" />
                </span>
            )}
        </div>
    )
}

export function DailyView({ data, pinnedGroups, onEdit, onDelete }: DailyViewProps) {
    const hasPinnedItems = pinnedGroups !== undefined && pinnedGroups.some((g) => g.items.length > 0)

    if (data.items.length === 0 && !hasPinnedItems) {
        return (
            <div className={panelClass}>
                <ListEmpty message="선택한 날짜에 방송 일정이 없습니다." />
            </div>
        )
    }

    const sortedItems = data.items
        .slice()
        .sort((a, b) => {
            if (a.startTime === null && b.startTime === null) return 0
            if (a.startTime === null) return 1
            if (b.startTime === null) return -1
            return dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf()
        })

    return (
        <div className={panelClass}>
            {/* 데스크탑 테이블 (md+) */}
            <div className="hidden overflow-x-auto md:block">
                <div className="grid min-w-[900px] grid-cols-[80px_minmax(160px,2fr)_72px_100px_minmax(140px,1.3fr)_120px_80px] items-center gap-3 border-b border-[#3a3a44] px-4 py-3 text-center text-xs font-semibold text-[#848494]">
                    <div>시간</div>
                    <div>제목</div>
                    <div>유형</div>
                    <div>카테고리</div>
                    <div>참여자</div>
                    <div>상태</div>
                    <div>작업</div>
                </div>

                {pinnedGroups?.filter((g) => g.items.length > 0).map((group) => (
                    <div key={group.eventId} className="border-b border-[#3a3a44]">
                        <div className="flex min-w-[900px] items-center gap-2 bg-blue-500/5 px-4 py-2">
                            <Pin className="h-3.5 w-3.5 text-blue-400" />
                            <span className="text-xs font-semibold text-blue-300">{group.eventName}</span>
                            <span className="rounded-full bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-bold text-blue-300">{group.items.length}</span>
                        </div>
                        <ul className="divide-y divide-[#3a3a44]">
                            {group.items.map((item) => (
                                <li
                                    key={item.id}
                                    className="grid min-w-[900px] grid-cols-[80px_minmax(160px,2fr)_72px_100px_minmax(140px,1.3fr)_120px_80px] items-center gap-3 bg-blue-500/5 px-4 py-3"
                                >
                                    <div className={cn('text-center text-sm tabular-nums', item.startTime !== null ? 'text-[#efeff1]' : 'text-amber-300')}>{item.startTime !== null ? dayjs(item.startTime).format('HH:mm') : '미정'}</div>

                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-[#efeff1]">{item.title}</p>
                                    </div>

                                    <div className="flex justify-center">
                                        <span
                                            className={cn(
                                                'rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                                                getBroadcastTypeBadgeClass(item.broadcastType),
                                            )}
                                        >
                                            {item.broadcastType ?? '기타'}
                                        </span>
                                    </div>

                                    <div className="truncate text-center text-xs text-[#adadb8]">{item.category?.name ?? '-'}</div>

                                    <div className="flex items-center justify-center">
                                        <ParticipantAvatars item={item} />
                                    </div>

                                    <div className="flex items-center justify-center">
                                        <StatusIcons item={item} />
                                    </div>

                                    <div className="flex items-center justify-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => onEdit(item)}
                                            className="cursor-pointer rounded-lg border border-[#3a3a44] p-2 text-[#adadb8] transition hover:bg-[#26262e]"
                                            aria-label={`${item.title} 수정`}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onDelete(item)}
                                            className="cursor-pointer rounded-lg border border-red-500/35 p-2 text-red-300 transition hover:bg-red-500/10"
                                            aria-label={`${item.title} 삭제`}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}

                <ul className="divide-y divide-[#3a3a44]">
                    {sortedItems.map((item) => (
                        <li
                            key={item.id}
                            className="grid min-w-[900px] grid-cols-[80px_minmax(160px,2fr)_72px_100px_minmax(140px,1.3fr)_120px_80px] items-center gap-3 px-4 py-3"
                        >
                            <div className={cn('text-center text-sm tabular-nums', item.startTime !== null ? 'text-[#efeff1]' : 'text-amber-300')}>{item.startTime !== null ? dayjs(item.startTime).format('HH:mm') : '미정'}</div>

                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-[#efeff1]">{item.title}</p>
                            </div>

                            <div className="flex justify-center">
                                <span
                                    className={cn(
                                        'rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                                        getBroadcastTypeBadgeClass(item.broadcastType),
                                    )}
                                >
                                    {item.broadcastType ?? '기타'}
                                </span>
                            </div>

                            <div className="truncate text-center text-xs text-[#adadb8]">{item.category?.name ?? '-'}</div>

                            <div className="flex items-center justify-center">
                                <ParticipantAvatars item={item} />
                            </div>

                            <div className="flex items-center justify-center">
                                <StatusIcons item={item} />
                            </div>

                            <div className="flex items-center justify-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => onEdit(item)}
                                    className="cursor-pointer rounded-lg border border-[#3a3a44] p-2 text-[#adadb8] transition hover:bg-[#26262e]"
                                    aria-label={`${item.title} 수정`}
                                >
                                    <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onDelete(item)}
                                    className="cursor-pointer rounded-lg border border-red-500/35 p-2 text-red-300 transition hover:bg-red-500/10"
                                    aria-label={`${item.title} 삭제`}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {/* 태블릿 카드 레이아웃 (< md) */}
            <div className="space-y-2 p-3 md:hidden">
                {pinnedGroups?.filter((g) => g.items.length > 0).map((group) => (
                    <div key={group.eventId} className="space-y-2">
                        <div className="flex items-center gap-1.5 px-1">
                            <Pin className="h-3.5 w-3.5 text-blue-400" />
                            <span className="text-xs font-semibold text-blue-300">{group.eventName}</span>
                            <span className="rounded-full bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-bold text-blue-300">{group.items.length}</span>
                        </div>
                        {group.items.map((item) => (
                            <div key={item.id} className="space-y-2 rounded-xl border border-blue-500/30 bg-blue-500/5 p-3">
                                <div className="flex items-center justify-between">
                                    <span className={cn('text-sm font-semibold tabular-nums', item.startTime !== null ? 'text-blue-300' : 'text-amber-300')}>{item.startTime !== null ? dayjs(item.startTime).format('HH:mm') : '미정'}</span>
                                    <span
                                        className={cn(
                                            'rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                                            getBroadcastTypeBadgeClass(item.broadcastType),
                                        )}
                                    >
                                        {item.broadcastType ?? '기타'}
                                    </span>
                                </div>

                                <p className="text-sm font-medium text-[#efeff1]">{item.title}</p>

                                {item.category?.name !== undefined && <p className="text-xs text-[#adadb8]">{item.category.name}</p>}

                                <div className="flex items-center justify-between pt-1">
                                    <div className="flex items-center gap-3">
                                        <ParticipantAvatars item={item} />
                                        <StatusIcons item={item} />
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => onEdit(item)}
                                            className="cursor-pointer rounded-lg border border-[#3a3a44] p-2 text-[#adadb8] transition hover:bg-[#32323d]"
                                            aria-label={`${item.title} 수정`}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onDelete(item)}
                                            className="cursor-pointer rounded-lg border border-red-500/35 p-2 text-red-300 transition hover:bg-red-500/10"
                                            aria-label={`${item.title} 삭제`}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}

                {sortedItems.map((item) => (
                    <div key={item.id} className="space-y-2 rounded-xl border border-[#3a3a44] bg-[#26262e] p-3">
                        <div className="flex items-center justify-between">
                            <span className={cn('text-sm font-semibold tabular-nums', item.startTime !== null ? 'text-blue-300' : 'text-amber-300')}>{item.startTime !== null ? dayjs(item.startTime).format('HH:mm') : '미정'}</span>
                            <span
                                className={cn(
                                    'rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                                    getBroadcastTypeBadgeClass(item.broadcastType),
                                )}
                            >
                                {item.broadcastType ?? '기타'}
                            </span>
                        </div>

                        <p className="text-sm font-medium text-[#efeff1]">{item.title}</p>

                        {item.category?.name !== undefined && <p className="text-xs text-[#adadb8]">{item.category.name}</p>}

                        <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-3">
                                <ParticipantAvatars item={item} />
                                <StatusIcons item={item} />
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => onEdit(item)}
                                    className="cursor-pointer rounded-lg border border-[#3a3a44] p-2 text-[#adadb8] transition hover:bg-[#32323d]"
                                    aria-label={`${item.title} 수정`}
                                >
                                    <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onDelete(item)}
                                    className="cursor-pointer rounded-lg border border-red-500/35 p-2 text-red-300 transition hover:bg-red-500/10"
                                    aria-label={`${item.title} 삭제`}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
