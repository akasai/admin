import { Fragment, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { Check, Clock, Pencil, Plus, Radio, Trash2, Users, X } from 'lucide-react'
import {
    useAdminToast,
    useCreateScheduleSource,
    useDeleteScheduleSource,
    useScheduleSources,
    useStreamers,
    useToggleScheduleSourceActive,
    useUpdateScheduleSource,
} from '../hooks'
import { cn } from '../lib/cn'
import type { ScheduleSourceItem, StreamerItem } from '../types'
import { inputClass, panelClass } from '../constants/styles'
import { ListEmpty, ListError, ListLoading } from '../components/ListState'
import { getErrorMessage } from '../utils/error'

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const

function getSourceStyle(sourceType: string): string {
    if (sourceType === 'chzzk_community' || sourceType === 'chzzk') {
        return 'border-green-500/35 bg-green-500/10 text-green-300'
    }
    if (sourceType === 'fan_cafe') {
        return 'border-orange-500/35 bg-orange-500/10 text-orange-300'
    }
    return 'border-[#3a3a44] bg-[#26262e] text-[#adadb8]'
}

type TimetableMap = Map<number, Map<number, ScheduleSourceItem[]>>

function buildTimetable(sources: ScheduleSourceItem[]): { timetable: TimetableMap; hours: number[] } {
    const timetable: TimetableMap = new Map()

    for (const source of sources) {
        for (const hour of source.crawl_hours ?? []) {
            for (const day of source.crawl_days) {
                if (!timetable.has(hour)) {
                    timetable.set(hour, new Map())
                }
                const hourMap = timetable.get(hour)!
                if (!hourMap.has(day)) {
                    hourMap.set(day, [])
                }
                hourMap.get(day)!.push(source)
            }
        }
    }

    const hours = [...timetable.keys()].sort((a, b) => a - b)
    return { timetable, hours }
}

type TimeStatus = 'past' | 'current' | 'future'

function getTimeStatus(hour: number, currentHour: number): TimeStatus {
    if (hour < currentHour) return 'past'
    if (hour === currentHour) return 'current'
    return 'future'
}

function SourceManageTab() {
    const { addToast } = useAdminToast()
    const { data: sources = [], isLoading, isError, refetch } = useScheduleSources()
    const { data: streamersData } = useStreamers({ size: 1000 })
    const allStreamers: StreamerItem[] = streamersData?.items ?? []

    const createMutation = useCreateScheduleSource()
    const updateMutation = useUpdateScheduleSource()
    const deleteMutation = useDeleteScheduleSource()
    const toggleMutation = useToggleScheduleSourceActive()

    const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || toggleMutation.isPending

    const [isAdding, setIsAdding] = useState(false)
    const [streamerSearch, setStreamerSearch] = useState('')
    const [selectedStreamer, setSelectedStreamer] = useState<StreamerItem | null>(null)
    const [newIdentifier, setNewIdentifier] = useState('')
    const [newDays, setNewDays] = useState<number[]>([1])
    const [newHours, setNewHours] = useState<number[]>([6])

    const [editingId, setEditingId] = useState<number | null>(null)
    const [editingIdentifier, setEditingIdentifier] = useState('')
    const [editingDays, setEditingDays] = useState<number[]>([1])
    const [editingHours, setEditingHours] = useState<number[]>([6])

    const filteredStreamers = useMemo(
        () =>
            streamerSearch.trim().length === 0
                ? []
                : allStreamers.filter((s) => s.name.includes(streamerSearch.trim())).slice(0, 10),
        [allStreamers, streamerSearch],
    )

    function resetAddForm(): void {
        setIsAdding(false)
        setStreamerSearch('')
        setSelectedStreamer(null)
        setNewIdentifier('')
        setNewDays([1])
            setNewHours([6])
    }

    function startEdit(source: ScheduleSourceItem): void {
        setEditingId(source.id)
        setEditingIdentifier(source.source_identifier)
        setEditingDays([...source.crawl_days].sort((a, b) => a - b))
            setEditingHours([...(source.crawl_hours ?? [])].sort((a, b) => a - b))
    }

    function cancelEdit(): void {
        setEditingId(null)
        setEditingIdentifier('')
        setEditingDays([1])
            setEditingHours([6])
    }

    async function handleCreate(): Promise<void> {
        if (selectedStreamer === null) {
            addToast({ message: '스트리머를 선택해주세요.', variant: 'error' })
            return
        }
        const identifier = newIdentifier.trim()
        if (identifier.length === 0) {
            addToast({ message: '식별자를 입력해주세요.', variant: 'error' })
            return
        }
        if (newDays.length === 0) {
            addToast({ message: '요일을 하나 이상 선택해주세요.', variant: 'error' })
            return
        }
        try {
            await createMutation.mutateAsync({
                streamer_id: selectedStreamer.id,
                source_type: 'chzzk_community',
                source_identifier: identifier,
                crawl_days: [...newDays].sort((a, b) => a - b),
                crawl_hours: [...newHours].sort((a, b) => a - b),
            })
            addToast({ message: '소스를 추가했습니다.', variant: 'success' })
            resetAddForm()
        } catch (error) {
            addToast({ message: getErrorMessage(error), variant: 'error' })
        }
    }

    async function handleUpdate(): Promise<void> {
        if (editingId === null) return
        const identifier = editingIdentifier.trim()
        if (identifier.length === 0) {
            addToast({ message: '식별자를 입력해주세요.', variant: 'error' })
            return
        }
        if (editingDays.length === 0) {
            addToast({ message: '요일을 하나 이상 선택해주세요.', variant: 'error' })
            return
        }
        try {
            await updateMutation.mutateAsync({
                id: editingId,
                body: {
                    source_identifier: identifier,
                    crawl_days: [...editingDays].sort((a, b) => a - b),
                    crawl_hours: [...editingHours].sort((a, b) => a - b),
                },
            })
            addToast({ message: '소스를 수정했습니다.', variant: 'success' })
            cancelEdit()
        } catch (error) {
            addToast({ message: getErrorMessage(error), variant: 'error' })
        }
    }

    async function handleDelete(id: number): Promise<void> {
        try {
            await deleteMutation.mutateAsync(id)
            addToast({ message: '소스를 삭제했습니다.', variant: 'success' })
            if (editingId === id) cancelEdit()
        } catch (error) {
            addToast({ message: getErrorMessage(error), variant: 'error' })
        }
    }

    async function handleToggle(id: number, isActive: boolean): Promise<void> {
        try {
            await toggleMutation.mutateAsync({ id, is_active: !isActive })
            addToast({ message: isActive ? '비활성화했습니다.' : '활성화했습니다.', variant: 'success' })
        } catch (error) {
            addToast({ message: getErrorMessage(error), variant: 'error' })
        }
    }

    return (
        <div className={panelClass}>
            <div className="flex items-center justify-between border-b border-[#3a3a44] px-5 py-3.5">
                <p className="text-sm font-semibold text-[#efeff1]">수집 소스 목록</p>
                {!isAdding && (
                    <button
                        type="button"
                        onClick={() => setIsAdding(true)}
                        disabled={isPending}
                        className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
                    >
                        <Plus className="h-3.5 w-3.5" /> 소스 추가
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="border-b border-[#3a3a44] px-5 py-4 space-y-4">
                    <p className="text-xs font-semibold text-[#efeff1]">새 소스 추가</p>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[#adadb8]">스트리머</label>
                            {selectedStreamer !== null ? (
                                <div className="flex items-center gap-2 rounded-xl border border-[#3a3a44] bg-[#26262e] px-3 py-2">
                                    {selectedStreamer.channelImageUrl !== undefined && (
                                        <img
                                            src={selectedStreamer.channelImageUrl}
                                            alt={selectedStreamer.name}
                                            className="h-5 w-5 rounded-full object-cover"
                                        />
                                    )}
                                    <span className="flex-1 text-sm text-[#efeff1]">{selectedStreamer.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedStreamer(null)
                                            setNewIdentifier('')
                                        }}
                                        className="cursor-pointer text-[#848494] hover:text-[#efeff1]"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={streamerSearch}
                                        onChange={(event) => setStreamerSearch(event.target.value)}
                                        placeholder="이름으로 검색"
                                        className={inputClass}
                                    />
                                    {filteredStreamers.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 z-10 mt-1 max-h-48 overflow-y-auto rounded-xl border border-[#3a3a44] bg-[#1a1a23] shadow-lg">
                                            {filteredStreamers.map((streamer) => (
                                                <button
                                                    key={streamer.id}
                                                    type="button"
                                                    onMouseDown={() => {
                                                        setSelectedStreamer(streamer)
                                                        setNewIdentifier(streamer.channelId ?? '')
                                                        setStreamerSearch('')
                                                    }}
                                                    className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left transition hover:bg-[#26262e]"
                                                >
                                                    {streamer.channelImageUrl !== undefined && (
                                                        <img
                                                            src={streamer.channelImageUrl}
                                                            alt={streamer.name}
                                                            className="h-5 w-5 rounded-full object-cover"
                                                        />
                                                    )}
                                                    <span className="text-sm text-[#efeff1]">{streamer.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[#adadb8]">소스타입</label>
                            <div className="flex h-9 items-center">
                                <span className="rounded-full border border-blue-500/35 bg-blue-500/15 px-2.5 py-1 text-xs font-semibold text-blue-300">
                                    chzzk_community
                                </span>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[#adadb8]">식별자 (채널 ID)</label>
                            <input
                                type="text"
                                value={newIdentifier}
                                onChange={(event) => setNewIdentifier(event.target.value)}
                                placeholder="치지직 채널 ID"
                                className={inputClass}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[#adadb8]">시간</label>
                            <div className="flex flex-wrap gap-1">
                                {Array.from({ length: 24 }, (_, h) => {
                                    const selected = newHours.includes(h)
                                    return (
                                        <button
                                            key={h}
                                            type="button"
                                            onClick={() =>
                                                setNewHours((prev) =>
                                                    selected ? prev.filter((v) => v !== h) : [...prev, h].sort((a, b) => a - b),
                                                )
                                            }
                                            className={cn(
                                                'cursor-pointer rounded-md border px-1.5 py-1 text-[11px] font-semibold transition',
                                                selected
                                                    ? 'border-purple-500/40 bg-purple-500/15 text-purple-300'
                                                    : 'border-[#3a3a44] bg-[#26262e] text-[#adadb8] hover:bg-[#32323d]',
                                            )}
                                        >
                                            {String(h).padStart(2, '0')}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-[#adadb8]">요일</label>
                        <div className="flex flex-wrap gap-1.5">
                            {DAY_LABELS.map((label, day) => {
                                const selected = newDays.includes(day)
                                return (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => {
                                            setNewDays((prev) =>
                                                selected ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b),
                                            )
                                        }}
                                        className={cn(
                                            'cursor-pointer rounded-full border px-2.5 py-1 text-xs font-semibold transition',
                                            selected
                                                ? 'border-blue-500/40 bg-blue-500/15 text-blue-300'
                                                : 'border-[#3a3a44] bg-[#26262e] text-[#adadb8] hover:bg-[#32323d]',
                                        )}
                                    >
                                        {label}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={resetAddForm}
                            disabled={isPending}
                            className="cursor-pointer rounded-xl border border-[#3a3a44] px-3 py-1.5 text-xs font-medium text-[#adadb8] transition hover:bg-[#2e2e38] disabled:opacity-50"
                        >
                            취소
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                void handleCreate()
                            }}
                            disabled={isPending}
                            className="cursor-pointer inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
                        >
                            <Check className="h-3.5 w-3.5" /> 저장
                        </button>
                    </div>
                </div>
            )}

            {isLoading && <ListLoading />}
            {isError && <ListError message="소스 목록을 불러오는 중 오류가 발생했습니다." onRetry={() => void refetch()} />}
            {!isLoading && !isError && sources.length === 0 && <ListEmpty message="등록된 소스가 없습니다." />}

            {!isLoading && !isError && sources.length > 0 && (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px] border-collapse">
                        <thead>
                            <tr className="border-b border-[#3a3a44]">
                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#848494]">스트리머명</th>
                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#848494]">소스타입</th>
                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#848494]">식별자</th>
                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#848494]">요일</th>
                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#848494]">시간</th>
                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#848494]">활성여부</th>
                                <th className="px-4 py-2.5 text-right text-xs font-semibold text-[#848494]">액션</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sources.map((source) => {
                                const isEditing = editingId === source.id
                                const dayLabel = source.crawl_days.map((d) => DAY_LABELS[d]).join('·')

                                return (
                                    <Fragment key={source.id}>
                                        <tr className="border-b border-[#3a3a44] last:border-b-0">
                                            <td className="px-4 py-3 text-sm text-[#efeff1]">{source.streamers.name}</td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={cn(
                                                        'inline-block rounded-md border px-1.5 py-0.5 text-[11px] font-medium',
                                                        getSourceStyle(source.source_type),
                                                    )}
                                                >
                                                    {source.source_type}
                                                </span>
                                            </td>
                                            <td className="max-w-[180px] px-4 py-3">
                                                <span className="block truncate text-xs text-[#adadb8]" title={source.source_identifier}>
                                                    {source.source_identifier}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-[#adadb8]">{dayLabel}</td>
                                            <td className="px-4 py-3 text-xs text-[#adadb8]">{(source.crawl_hours ?? []).map((h) => `${String(h).padStart(2, '0')}시`).join(', ')}</td>
                                            <td className="px-4 py-3">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        void handleToggle(source.id, source.is_active)
                                                    }}
                                                    disabled={isPending}
                                                    className={cn(
                                                        'cursor-pointer rounded-full border px-2 py-1 text-[11px] font-semibold transition disabled:opacity-50',
                                                        source.is_active
                                                            ? 'border-emerald-500/35 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                                                            : 'border-[#3a3a44] bg-[#26262e] text-[#adadb8] hover:bg-[#32323d]',
                                                    )}
                                                >
                                                    {source.is_active ? '활성' : '비활성'}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => (isEditing ? cancelEdit() : startEdit(source))}
                                                        disabled={isPending}
                                                        className="cursor-pointer rounded-lg border border-[#3a3a44] p-1.5 text-[#adadb8] transition hover:bg-[#32323d] disabled:opacity-50"
                                                        aria-label={isEditing ? '수정 취소' : '수정'}
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            void handleDelete(source.id)
                                                        }}
                                                        disabled={isPending}
                                                        className="cursor-pointer rounded-lg border border-red-500/35 p-1.5 text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
                                                        aria-label="삭제"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {isEditing && (
                                            <tr className="border-b border-[#3a3a44]">
                                                <td colSpan={7} className="bg-[#16161e] px-5 py-4">
                                                    <div className="space-y-4">
                                                        <div className="grid gap-4 sm:grid-cols-2">
                                                            <div className="space-y-1.5">
                                                                <label className="text-xs font-medium text-[#adadb8]">식별자 (채널 ID)</label>
                                                                <input
                                                                    type="text"
                                                                    value={editingIdentifier}
                                                                    onChange={(event) => setEditingIdentifier(event.target.value)}
                                                                    className={inputClass}
                                                                    placeholder="치지직 채널 ID"
                                                                />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <label className="text-xs font-medium text-[#adadb8]">시간</label>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {Array.from({ length: 24 }, (_, h) => {
                                                                        const selected = editingHours.includes(h)
                                                                        return (
                                                                            <button
                                                                                key={h}
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    setEditingHours((prev) =>
                                                                                        selected ? prev.filter((v) => v !== h) : [...prev, h].sort((a, b) => a - b),
                                                                                    )
                                                                                }
                                                                                className={cn(
                                                                                    'cursor-pointer rounded-md border px-1.5 py-1 text-[11px] font-semibold transition',
                                                                                    selected
                                                                                        ? 'border-purple-500/40 bg-purple-500/15 text-purple-300'
                                                                                        : 'border-[#3a3a44] bg-[#26262e] text-[#adadb8] hover:bg-[#32323d]',
                                                                                )}
                                                                            >
                                                                                {String(h).padStart(2, '0')}
                                                                            </button>
                                                                        )
                                                                    })}
                                                                </div>
                                                             </div>
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-medium text-[#adadb8]">요일</label>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {DAY_LABELS.map((label, day) => {
                                                                    const selected = editingDays.includes(day)
                                                                    return (
                                                                        <button
                                                                            key={day}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setEditingDays((prev) =>
                                                                                    selected
                                                                                        ? prev.filter((d) => d !== day)
                                                                                        : [...prev, day].sort((a, b) => a - b),
                                                                                )
                                                                            }}
                                                                            className={cn(
                                                                                'cursor-pointer rounded-full border px-2.5 py-1 text-xs font-semibold transition',
                                                                                selected
                                                                                    ? 'border-blue-500/40 bg-blue-500/15 text-blue-300'
                                                                                    : 'border-[#3a3a44] bg-[#26262e] text-[#adadb8] hover:bg-[#32323d]',
                                                                            )}
                                                                        >
                                                                            {label}
                                                                        </button>
                                                                    )
                                                                })}
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={cancelEdit}
                                                                disabled={isPending}
                                                                className="cursor-pointer rounded-xl border border-[#3a3a44] px-3 py-1.5 text-xs font-medium text-[#adadb8] transition hover:bg-[#2e2e38] disabled:opacity-50"
                                                            >
                                                                취소
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    void handleUpdate()
                                                                }}
                                                                disabled={isPending}
                                                                className="cursor-pointer inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
                                                            >
                                                                <Check className="h-3.5 w-3.5" /> 저장
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

type Tab = 'timetable' | 'sources'

export default function CrawlGroupManagePage() {
    const [activeTab, setActiveTab] = useState<Tab>('timetable')

    const { data: sources = [], isLoading, isError, refetch } = useScheduleSources()

    const now = dayjs()
    const todayIndex = now.day()
    const currentHour = now.hour()

    const { timetable, hours } = useMemo(() => buildTimetable(sources), [sources])

    const stats = useMemo(() => {
        const streamerIds = new Set(sources.map((s) => s.streamer_id))
        return {
            totalSources: sources.length,
            uniqueStreamers: streamerIds.size,
            activeHours: hours.length,
        }
    }, [sources, hours])

    return (
        <>
            <div className="mb-6">
                <h1 className="text-xl font-bold text-[#efeff1]">크롤링 스케줄 현황</h1>
                <p className="mt-1 text-sm text-[#adadb8]">요일·시간대별 크롤링 스케줄 현황입니다</p>
            </div>

            <div className="mb-4 inline-flex rounded-xl border border-[#3a3a44] bg-[#1a1a23] p-1">
                <button
                    type="button"
                    onClick={() => setActiveTab('timetable')}
                    className={cn(
                        'cursor-pointer rounded-lg px-4 py-1.5 text-sm font-semibold transition',
                        activeTab === 'timetable' ? 'bg-blue-600 text-white' : 'text-[#adadb8] hover:text-[#efeff1]',
                    )}
                >
                    시간표
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('sources')}
                    className={cn(
                        'cursor-pointer rounded-lg px-4 py-1.5 text-sm font-semibold transition',
                        activeTab === 'sources' ? 'bg-blue-600 text-white' : 'text-[#adadb8] hover:text-[#efeff1]',
                    )}
                >
                    소스 관리
                </button>
            </div>

            {activeTab === 'timetable' && (
                <div className={panelClass}>
                    {isLoading && <ListLoading />}
                    {isError && <ListError message="스케줄 현황을 불러오는 중 오류가 발생했습니다." onRetry={() => void refetch()} />}
                    {!isLoading && !isError && sources.length === 0 && <ListEmpty message="등록된 크롤링 스케줄이 없습니다." />}

                    {!isLoading && !isError && sources.length > 0 && (
                        <>
                            <div className="flex items-center gap-6 border-b border-[#3a3a44] px-5 py-3.5">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10">
                                        <Users className="h-3.5 w-3.5 text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-[#848494]">스트리머</p>
                                        <p className="text-sm font-semibold text-[#efeff1]">{stats.uniqueStreamers}명</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10">
                                        <Radio className="h-3.5 w-3.5 text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-[#848494]">소스</p>
                                        <p className="text-sm font-semibold text-[#efeff1]">{stats.totalSources}개</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10">
                                        <Clock className="h-3.5 w-3.5 text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-[#848494]">시간대</p>
                                        <p className="text-sm font-semibold text-[#efeff1]">{stats.activeHours}개</p>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[640px] table-fixed border-collapse">
                                    <colgroup>
                                        <col className="w-14" />
                                        {DAY_LABELS.map((_, i) => (
                                            <col key={i} />
                                        ))}
                                    </colgroup>
                                    <thead>
                                        <tr className="border-b border-[#3a3a44]">
                                            <th className="px-2 py-2.5 text-center text-[11px] font-semibold text-[#848494]">시간</th>
                                            {DAY_LABELS.map((label, dayIndex) => {
                                                const isToday = dayIndex === todayIndex
                                                return (
                                                    <th
                                                        key={dayIndex}
                                                        className={cn(
                                                            'px-1 py-2.5 text-center text-xs font-semibold',
                                                            isToday ? 'bg-blue-500/[0.06] text-blue-400' : 'text-[#848494]',
                                                        )}
                                                    >
                                                        <span
                                                            className={cn(
                                                                'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5',
                                                                isToday && 'bg-blue-500/10',
                                                            )}
                                                        >
                                                            {label}
                                                            {isToday && <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />}
                                                        </span>
                                                    </th>
                                                )
                                            })}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {hours.map((hour) => {
                                            const hourMap = timetable.get(hour)!
                                            const todayStatus = getTimeStatus(hour, currentHour)

                                            return (
                                                <tr key={hour} className="border-b border-[#3a3a44] last:border-b-0">
                                                    <td
                                                        className={cn(
                                                            'px-3 py-2.5 text-center text-xs font-semibold',
                                                            todayStatus === 'current' ? 'text-blue-400' : 'text-[#6f6f7b]',
                                                        )}
                                                    >
                                                        {String(hour).padStart(2, '0')}시
                                                    </td>
                                                    {DAY_LABELS.map((_, dayIndex) => {
                                                        const isToday = dayIndex === todayIndex
                                                        const cellSources = hourMap.get(dayIndex) ?? []
                                                        const isEmpty = cellSources.length === 0

                                                        return (
                                                            <td
                                                                key={dayIndex}
                                                                className={cn(
                                                                    'px-1.5 py-2 align-top',
                                                                    isToday && 'bg-blue-500/[0.06]',
                                                                    isToday && todayStatus === 'past' && 'bg-blue-500/[0.03]',
                                                                    isToday && todayStatus === 'current' && 'bg-blue-500/[0.08]',
                                                                )}
                                                            >
                                                                {isToday && todayStatus === 'current' && !isEmpty && (
                                                                    <div className="mb-1.5 flex items-center justify-center">
                                                                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold text-blue-300">
                                                                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" />
                                                                            진행중
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {isEmpty ? (
                                                                    <div className="flex min-h-[28px] items-center justify-center">
                                                                        <span className="text-[10px] text-[#3a3a44]">—</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {cellSources.map((source) => (
                                                                            <span
                                                                                key={source.id}
                                                                                className={cn(
                                                                                    'inline-block rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-tight',
                                                                                    getSourceStyle(source.source_type),
                                                                                    isToday && todayStatus === 'past' && 'opacity-45',
                                                                                )}
                                                                            >
                                                                                {source.streamers.name}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </td>
                                                        )
                                                    })}
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            )}

            {activeTab === 'sources' && <SourceManageTab />}
        </>
    )
}
