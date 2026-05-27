import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { Calendar, ChevronLeft, ChevronRight, EyeOff, Plus } from 'lucide-react'
import {
    useAdminToast,
    useAdminSchedule,
    useCategories,
    useCreateBroadcast,
    useDeleteBroadcast,
    useReviewQueue,
    useStreamers,
    useUpdateBroadcast,
} from '../hooks'
import type { BroadcastItem, ReviewBroadcastItem, ScheduleParams, ScheduleResponse } from '../types'
import { getErrorMessage } from '../utils/error'
import { cn } from '../lib/cn'
import { panelClass } from '../constants/styles'
import { ConfirmModal } from '../components/ConfirmModal'
import { ListEmpty, ListError, ListLoading } from '../components/ListState'
import { BroadcastFormModal, DailyView, ReviewView, WeeklyView, toCreatePayload, toFormValues, toUpdatePayload, getDateRangeText, toDateParam } from '../components/schedule'
import type { BroadcastFormValues } from '../components/schedule'

export default function BroadcastSchedulePage() {
    const { addToast } = useAdminToast()

    const [view, setView] = useState<'daily' | 'weekly' | 'review'>('daily')
    const [selectedDate, setSelectedDate] = useState(dayjs())
    const [hiddenOnly, setHiddenOnly] = useState(false)
    const [creating, setCreating] = useState(false)
    const [editingItem, setEditingItem] = useState<BroadcastItem | ReviewBroadcastItem | null>(null)
    const [deletingItem, setDeletingItem] = useState<BroadcastItem | ReviewBroadcastItem | null>(null)

    const scheduleView = view === 'review' ? 'daily' : view
    const scheduleParams: ScheduleParams = useMemo(
        () => ({
            view: scheduleView,
            date: toDateParam(selectedDate),
        }),
        [scheduleView, selectedDate],
    )

    const { data, isLoading, isError, refetch } = useAdminSchedule(scheduleParams)
    const { data: reviewData } = useReviewQueue()
    const reviewCount = reviewData?.totalCount ?? 0
    const { data: categories = [] } = useCategories()
    const { data: streamersData } = useStreamers({ size: 1000 })
    const createMutation = useCreateBroadcast()
    const updateMutation = useUpdateBroadcast()
    const deleteMutation = useDeleteBroadcast()
    const streamers = streamersData?.items ?? []

    const categoryOptions = useMemo(() => categories.map((category) => ({ id: category.id, name: category.name })), [categories])

    function moveDate(direction: 1 | -1): void {
        if (view === 'daily') {
            setSelectedDate((prev) => prev.add(direction, 'day'))
            return
        }
        setSelectedDate((prev) => prev.add(direction, 'week'))
    }

    async function handleCreate(values: BroadcastFormValues): Promise<void> {
        try {
            await createMutation.mutateAsync(toCreatePayload(values))
            addToast({ message: '방송 일정이 추가되었습니다.', variant: 'success' })
            setCreating(false)
        } catch (error) {
            const message = getErrorMessage(error)
            if (message !== null) addToast({ message, variant: 'error' })
        }
    }

    async function handleUpdate(values: BroadcastFormValues): Promise<void> {
        if (editingItem === null) return

        try {
            await updateMutation.mutateAsync({ id: editingItem.id, body: toUpdatePayload(values) })
            addToast({ message: '방송 일정이 수정되었습니다.', variant: 'success' })
            setEditingItem(null)
        } catch (error) {
            const message = getErrorMessage(error)
            if (message !== null) addToast({ message, variant: 'error' })
        }
    }

    async function handleDelete(): Promise<void> {
        if (deletingItem === null) return
        try {
            await deleteMutation.mutateAsync(deletingItem.id)
            addToast({ message: '방송 일정이 삭제되었습니다.', variant: 'success' })
            setDeletingItem(null)
        } catch (error) {
            const message = getErrorMessage(error)
            if (message !== null) addToast({ message, variant: 'error' })
        }
    }

    function filterHidden(items: BroadcastItem[]): BroadcastItem[] {
        if (!hiddenOnly) return items
        return items.filter((item) => !item.isVisible)
    }

    function renderContent(schedule: ScheduleResponse | undefined) {
        if (view === 'review') {
            return <ReviewView onEdit={setEditingItem} onDelete={setDeletingItem} />
        }
        if (isLoading) return <ListLoading className="py-24" />
        if (isError) return <ListError message="일정을 불러오는 중 오류가 발생했습니다." className="py-24" onRetry={() => { void refetch() }} />
        if (schedule === undefined) return <ListEmpty message="일정 데이터가 없습니다." className="py-24" />

        if (schedule.view === 'daily') {
            const filtered = { ...schedule, items: filterHidden(schedule.items) }
            const filteredPinnedGroups = schedule.pinnedGroups?.map((g) => ({ ...g, items: filterHidden(g.items) }))
            return <DailyView data={filtered} pinnedGroups={filteredPinnedGroups} onEdit={setEditingItem} onDelete={setDeletingItem} />
        }
        if (schedule.view === 'weekly') {
            const filtered = { ...schedule, days: schedule.days.map((day) => ({ ...day, items: filterHidden(day.items) })) }
            const filteredPinnedGroups = schedule.pinnedGroups?.map((g) => ({ ...g, items: filterHidden(g.items) }))
            return <WeeklyView selectedDate={selectedDate} data={filtered} pinnedGroups={filteredPinnedGroups} onEdit={setEditingItem} onDelete={setDeletingItem} />
        }
        return null
    }

    const isFormPending = createMutation.isPending || updateMutation.isPending

    return (
        <>
            <div className="mb-6 flex items-start justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-[#efeff1]">일정 관리</h1>
                    <p className="mt-1 text-sm text-[#adadb8]">방송 일정을 관리합니다</p>
                </div>
                {view !== 'review' && (
                    <button
                        type="button"
                        onClick={() => setCreating(true)}
                        className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
                    >
                        <Plus className="h-4 w-4" />
                        일정 추가
                    </button>
                )}
            </div>

            <div className={cn(panelClass, 'mb-4 flex flex-col gap-3 px-4 py-3 md:flex-row md:flex-wrap md:items-center md:justify-between')}>
                <div className="flex items-center gap-2">
                    <div className="inline-flex rounded-xl border border-[#3a3a44] bg-[#26262e] p-1">
                        <button
                            type="button"
                            onClick={() => setView('daily')}
                            className={cn(
                                'cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                                view === 'daily' ? 'bg-blue-600 text-white' : 'text-[#adadb8] hover:bg-[#32323d]',
                            )}
                        >
                            일간
                        </button>
                        <button
                            type="button"
                            onClick={() => setView('weekly')}
                            className={cn(
                                'cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                                view === 'weekly' ? 'bg-blue-600 text-white' : 'text-[#adadb8] hover:bg-[#32323d]',
                            )}
                        >
                            주간
                        </button>
                        <button
                            type="button"
                            onClick={() => setView('review')}
                            className={cn(
                                'cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                                view === 'review' ? 'bg-blue-600 text-white' : 'text-[#adadb8] hover:bg-[#32323d]',
                            )}
                        >
                            검수
                            {reviewCount > 0 && (
                                <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                                    {reviewCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {view !== 'review' && (
                        <div className="ml-1 flex items-center gap-1.5 text-[#efeff1]">
                            <Calendar className="h-4 w-4 text-[#848494]" />
                            <span className="text-sm font-semibold">{getDateRangeText(scheduleView, selectedDate)}</span>
                        </div>
                    )}
                </div>

                {view !== 'review' && (
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setHiddenOnly((prev) => !prev)}
                            className={cn(
                                'cursor-pointer inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition',
                                hiddenOnly
                                    ? 'border-red-500/50 bg-red-500/10 text-red-300'
                                    : 'border-[#3a3a44] bg-[#26262e] text-[#adadb8] hover:bg-[#2d2d36]',
                            )}
                        >
                            <EyeOff className="h-3.5 w-3.5" />
                            미노출
                        </button>
                        <button
                            type="button"
                            onClick={() => moveDate(-1)}
                            className="cursor-pointer rounded-lg border border-[#3a3a44] bg-[#26262e] p-1.5 text-[#adadb8] transition hover:bg-[#2d2d36]"
                            aria-label="이전"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => moveDate(1)}
                            className="cursor-pointer rounded-lg border border-[#3a3a44] bg-[#26262e] p-1.5 text-[#adadb8] transition hover:bg-[#2d2d36]"
                            aria-label="다음"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedDate(dayjs())}
                            className="cursor-pointer rounded-lg border border-[#3a3a44] bg-[#26262e] px-3 py-1.5 text-xs font-semibold text-[#efeff1] transition hover:bg-[#2d2d36]"
                        >
                            오늘
                        </button>
                    </div>
                )}
            </div>

            {renderContent(data)}

            {creating && (
                <BroadcastFormModal
                    title="일정 추가"
                    submitLabel="저장"
                    initialValues={toFormValues(null, selectedDate)}
                    pending={isFormPending}
                    categories={categoryOptions}
                    streamers={streamers}
                    onClose={() => setCreating(false)}
                    onSubmit={handleCreate}
                />
            )}

            {editingItem !== null && (
                <BroadcastFormModal
                    title="일정 수정"
                    submitLabel="저장"
                    initialValues={toFormValues(editingItem, selectedDate)}
                    pending={isFormPending}
                    categories={categoryOptions}
                    streamers={streamers}
                    onClose={() => setEditingItem(null)}
                    onSubmit={handleUpdate}
                />
            )}

            {deletingItem !== null && (
                <ConfirmModal
                    title="일정 삭제"
                    message="방송 일정을 삭제하시겠습니까?"
                    itemName={deletingItem.title}
                    pending={deleteMutation.isPending}
                    onClose={() => setDeletingItem(null)}
                    onConfirm={() => {
                        void handleDelete()
                    }}
                />
            )}
        </>
    )
}
