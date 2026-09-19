/* Hallmark · pre-emit critique: P5 H5 E4 S5 R5 V4 */
/* Hallmark · macrostructure: Schedule Ledger · tone: modern-minimal · anchor hue: green */
import dayjs from 'dayjs'
import { Calendar, ChevronLeft, ChevronRight, EyeOff, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ConfirmModal } from '../components/ConfirmModal'
import { ListError, ListLoading } from '../components/ListState'
import {
    BroadcastFormModal,
    DailyView,
    WeeklyView,
    getDateRangeText,
    getWeekStartMonday,
    toCreatePayload,
    toDateParam,
    toFormValues,
    toUpdatePayload,
} from '../components/schedule'
import type { BroadcastFormValues } from '../components/schedule'
import { Button } from '../components/ui/Button'
import { inputClass, panelClass } from '../constants/styles'
import {
    useAdminSchedule,
    useAdminToast,
    useCategories,
    useCreateBroadcast,
    useDeleteBroadcast,
    useStreamers,
    useUpdateBroadcast,
} from '../hooks'
import { cn } from '../lib/cn'
import type { BroadcastItem, ScheduleDay } from '../types'
import { getErrorMessage } from '../utils/error'

export default function BroadcastSchedulePage() {
    const { addToast } = useAdminToast()
    const [view, setView] = useState<'daily' | 'weekly'>('weekly')
    const [selectedDate, setSelectedDate] = useState(dayjs())
    const [hiddenOnly, setHiddenOnly] = useState(false)
    const [creating, setCreating] = useState(false)
    const [editingItem, setEditingItem] = useState<BroadcastItem | null>(null)
    const [deletingItem, setDeletingItem] = useState<BroadcastItem | null>(null)
    const { data, isLoading: isScheduleLoading, isError: isScheduleError, refetch: refetchSchedule } = useAdminSchedule()
    const {
        data: categories = [],
        isLoading: isCategoriesLoading,
        isError: isCategoriesError,
        refetch: refetchCategories,
    } = useCategories()
    const { data: streamersData, isLoading: isStreamersLoading, isError: isStreamersError, refetch: refetchStreamers } = useStreamers()
    const createMutation = useCreateBroadcast()
    const updateMutation = useUpdateBroadcast()
    const deleteMutation = useDeleteBroadcast()
    const categoryOptions = useMemo(() => categories.map(({ id, name }) => ({ id, name })), [categories])
    const categoryNames = useMemo(() => new Map(categories.map(({ id, name }) => [id, name])), [categories])
    const streamers = streamersData?.items ?? []
    const isLoading = isScheduleLoading || isCategoriesLoading || isStreamersLoading
    const isError = isScheduleError || isCategoriesError || isStreamersError
    const weekDays = useMemo(
        () => Array.from({ length: 7 }, (_, index) => toDateParam(getWeekStartMonday(selectedDate).add(index, 'day'))),
        [selectedDate],
    )
    const selectedDateParam = toDateParam(selectedDate)
    const periodSummary = useMemo(() => {
        const relevantDates = view === 'weekly' ? new Set(weekDays) : new Set([selectedDateParam])
        const items = (data?.items ?? []).filter((item) => relevantDates.has(item.startDate))
        const visible = items.filter((item) => item.isVisible).length
        return {
            total: items.length,
            visible,
            hidden: items.length - visible,
            undecided: items.filter((item) => item.startTime === null).length,
        }
    }, [data, selectedDateParam, view, weekDays])
    const displayedDays = useMemo<ScheduleDay[]>(
        () =>
            weekDays.map((date) => ({
                date,
                items: (data?.items ?? []).filter((item) => item.startDate === date && (!hiddenOnly || !item.isVisible)),
            })),
        [data, hiddenOnly, weekDays],
    )
    const selectedDay = displayedDays.find((day) => day.date === selectedDateParam) ?? {
        date: selectedDateParam,
        items: [],
    }

    async function create(values: BroadcastFormValues) {
        try {
            await createMutation.mutateAsync(toCreatePayload(values))
            addToast({ message: '방송 일정이 추가되었습니다.', variant: 'success' })
            setCreating(false)
        } catch (error) {
            const message = getErrorMessage(error)
            if (message !== null) addToast({ message, variant: 'error' })
        }
    }

    async function update(values: BroadcastFormValues) {
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

    async function remove() {
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

    return (
        <>
            <header className="mb-4 flex items-center justify-between gap-4 border-b border-border pb-4 sm:mb-6 sm:items-end sm:pb-6">
                <div className="min-w-0">
                    <p className="mb-2 hidden font-mono text-[11px] font-semibold tracking-[0.12em] text-text-dim sm:block">
                        PROGRAMMING DATA
                    </p>
                    <h1 className="min-w-0 text-xl font-[650] tracking-[-0.025em] text-text [overflow-wrap:anywhere] sm:text-2xl">
                        일정 관리
                    </h1>
                    <p className="mt-1.5 hidden text-sm text-text-muted sm:block">방송 일정과 참여자, 노출 상태를 관리합니다.</p>
                </div>
                <Button
                    type="button"
                    size="lg"
                    leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}
                    onClick={() => setCreating(true)}
                    disabled={isCategoriesLoading || isStreamersLoading || isCategoriesError || isStreamersError}
                    aria-label="일정 추가"
                    className="px-3 sm:px-5"
                >
                    <span className="sm:hidden">추가</span>
                    <span className="hidden sm:inline">일정 추가</span>
                </Button>
            </header>

            <section className={cn(panelClass, 'mb-4 sm:mb-6')} aria-label="일정 보기 도구">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-1 gap-y-3 px-2 py-3 sm:flex sm:flex-col sm:items-stretch sm:gap-4 sm:p-4 xl:flex-row xl:items-center xl:justify-between xl:p-5">
                    <div className="col-span-2 flex min-w-0 items-center justify-between gap-2 sm:justify-start sm:gap-3">
                        <div className="grid shrink-0 grid-cols-2 rounded-md border border-border bg-card p-1" aria-label="일정 보기 방식">
                            <button
                                type="button"
                                onClick={() => setView('daily')}
                                aria-pressed={view === 'daily'}
                                className={cn(
                                    'min-h-10 cursor-pointer whitespace-nowrap rounded px-3 text-xs font-semibold transition-colors active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:px-4',
                                    view === 'daily'
                                        ? 'bg-primary text-primary-ink'
                                        : 'text-text-muted hover:bg-card-hover hover:text-text',
                                )}
                            >
                                일간
                            </button>
                            <button
                                type="button"
                                onClick={() => setView('weekly')}
                                aria-pressed={view === 'weekly'}
                                className={cn(
                                    'min-h-10 cursor-pointer whitespace-nowrap rounded px-3 text-xs font-semibold transition-colors active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:px-4',
                                    view === 'weekly'
                                        ? 'bg-primary text-primary-ink'
                                        : 'text-text-muted hover:bg-card-hover hover:text-text',
                                )}
                            >
                                주간
                            </button>
                        </div>
                        <div className="flex min-w-0 items-center gap-2 text-text">
                            <Calendar className="hidden h-4 w-4 shrink-0 text-primary sm:block" aria-hidden="true" />
                            <span
                                className="min-w-0 text-xs font-semibold tabular-nums [overflow-wrap:anywhere] sm:text-sm"
                                aria-live="polite"
                            >
                                {view === 'weekly' ? getDateRangeText(selectedDate) : selectedDate.format('YYYY.M.D')}
                            </span>
                        </div>
                    </div>

                    <div className="contents sm:flex sm:min-w-0 sm:flex-wrap sm:items-center sm:justify-end sm:gap-2">
                        <div className="grid min-w-0 grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center gap-1 sm:w-auto sm:grid-cols-[2.5rem_9.75rem_2.5rem]">
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => setSelectedDate((previous) => previous.subtract(1, view === 'daily' ? 'day' : 'week'))}
                                aria-label={view === 'daily' ? '이전 날짜' : '이전 주'}
                            >
                                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                            </Button>
                            <label className="min-w-0">
                                <span className="sr-only">기준 날짜</span>
                                <input
                                    type="date"
                                    value={selectedDateParam}
                                    onChange={(event) => {
                                        const nextDate = dayjs(event.target.value)
                                        if (nextDate.isValid()) setSelectedDate(nextDate)
                                    }}
                                    className={cn(inputClass, 'min-w-0 px-2 font-mono text-[11px] tabular-nums sm:px-3 sm:text-xs')}
                                />
                            </label>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => setSelectedDate((previous) => previous.add(1, view === 'daily' ? 'day' : 'week'))}
                                aria-label={view === 'daily' ? '다음 날짜' : '다음 주'}
                            >
                                <ChevronRight className="h-4 w-4" aria-hidden="true" />
                            </Button>
                        </div>
                        <div className="contents sm:flex sm:items-center sm:gap-2">
                            <div className="col-span-2 row-start-3 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-t border-border pt-2 text-xs text-text-muted sm:contents">
                                {!isLoading && !isError && (
                                    <span className="whitespace-nowrap sm:hidden">
                                        전체 <strong className="font-semibold tabular-nums text-text">{periodSummary.total}</strong>
                                    </span>
                                )}
                                <Button
                                    type="button"
                                    variant={hiddenOnly ? 'destructive' : 'outline'}
                                    size="sm"
                                    onClick={() => setHiddenOnly((previous) => !previous)}
                                    aria-pressed={hiddenOnly}
                                    leftIcon={<EyeOff className="h-3.5 w-3.5" aria-hidden="true" />}
                                    className="px-2 sm:px-3"
                                >
                                    미노출 {periodSummary.hidden}건
                                </Button>
                                {!isLoading && !isError && (
                                    <span className="whitespace-nowrap sm:hidden">
                                        시간 미정{' '}
                                        <strong className="font-semibold tabular-nums text-text">{periodSummary.undecided}</strong>
                                    </span>
                                )}
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedDate(dayjs())}
                                className="col-start-2 row-start-2 px-2 sm:px-3"
                            >
                                오늘
                            </Button>
                        </div>
                    </div>
                </div>
                {!isLoading && !isError && (
                    <dl className="hidden divide-x divide-border border-t border-border sm:grid sm:grid-cols-4">
                        {[
                            { label: view === 'weekly' ? '주간 일정' : '일간 일정', value: periodSummary.total },
                            { label: '노출', value: periodSummary.visible },
                            { label: '미노출', value: periodSummary.hidden },
                            { label: '시간 미정', value: periodSummary.undecided },
                        ].map((item) => (
                            <div key={item.label} className="min-w-0 px-4 py-3.5 sm:px-5">
                                <dt className="text-[11px] font-semibold tracking-[0.04em] text-text-dim">{item.label}</dt>
                                <dd className="mt-1 font-mono text-lg font-semibold tracking-[-0.03em] text-text">{item.value}</dd>
                            </div>
                        ))}
                    </dl>
                )}
            </section>

            {isLoading && (
                <div className={panelClass}>
                    <ListLoading className="py-16" rows={6} />
                </div>
            )}
            {isError && (
                <div className={panelClass}>
                    <ListError
                        message="일정 관리 데이터를 불러오는 중 오류가 발생했습니다."
                        className="py-16"
                        onRetry={() => {
                            void Promise.all([refetchSchedule(), refetchCategories(), refetchStreamers()])
                        }}
                    />
                </div>
            )}
            {!isLoading &&
                !isError &&
                (view === 'daily' ? (
                    <DailyView items={selectedDay.items} categoryNames={categoryNames} onEdit={setEditingItem} onDelete={setDeletingItem} />
                ) : (
                    <WeeklyView
                        days={displayedDays}
                        selectedDate={selectedDateParam}
                        categoryNames={categoryNames}
                        onEdit={setEditingItem}
                        onDelete={setDeletingItem}
                    />
                ))}

            {creating && (
                <BroadcastFormModal
                    title="일정 추가"
                    submitLabel="저장"
                    initialValues={toFormValues(null, selectedDate)}
                    pending={createMutation.isPending}
                    categories={categoryOptions}
                    streamers={streamers}
                    onClose={() => setCreating(false)}
                    onSubmit={create}
                />
            )}
            {editingItem !== null && (
                <BroadcastFormModal
                    title="일정 수정"
                    submitLabel="저장"
                    initialValues={toFormValues(editingItem, selectedDate)}
                    pending={updateMutation.isPending}
                    categories={categoryOptions}
                    streamers={streamers}
                    onClose={() => setEditingItem(null)}
                    onSubmit={update}
                />
            )}
            {deletingItem !== null && (
                <ConfirmModal
                    title="일정 삭제"
                    message="방송 일정을 삭제하시겠습니까?"
                    itemName={deletingItem.title}
                    pending={deleteMutation.isPending}
                    onClose={() => setDeletingItem(null)}
                    onConfirm={() => void remove()}
                />
            )}
        </>
    )
}
