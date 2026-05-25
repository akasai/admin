import { useEffect, useMemo, useState } from 'react'
import { CalendarPlus, ChevronDown, ChevronRight, Clock, Gift, Plus, Tag, Type, X, Zap } from 'lucide-react'
import { useAdminToast, useCategories, useCreatePinnedEvent, useUpdatePinnedEvent, usePinnedEventDetail, useStreamers } from '../../hooks'
import type { CreatePinnedEventEntry } from '../../types'
import type { ParticipantDraft } from '../schedule/types'
import { parseTags } from '../schedule/utils'
import { getErrorMessage } from '../../utils/error'
import { cn } from '../../lib/cn'
import { inputClass } from '../../constants/styles'
import { ModalOverlay } from '../ModalOverlay'
import { CategorySelector } from '../schedule/CategorySelector'
import { ParticipantManager } from '../schedule/ParticipantManager'

interface PinnedEventFormModalProps {
    eventId?: number
    onClose: () => void
}

interface EntryDraft {
    date: string
    title: string
    startTime: string
    categoryId: string
    tagsInput: string
    isDrops: boolean
    isChzzkSupport: boolean
    participants: ParticipantDraft[]
    expanded: boolean
}

export function PinnedEventFormModal({ eventId, onClose }: PinnedEventFormModalProps) {
    const isEditMode = eventId !== undefined
    const { addToast } = useAdminToast()
    const createMutation = useCreatePinnedEvent()
    const updateMutation = useUpdatePinnedEvent()
    const { data: detail } = usePinnedEventDetail(eventId ?? 0)
    const { data: categories = [] } = useCategories()
    const { data: streamersData } = useStreamers({ size: 1000 })
    const streamers = streamersData?.items ?? []

    const [step, setStep] = useState(1)
    const [name, setName] = useState('')
    const [editName, setEditName] = useState('')

    const [dates, setDates] = useState<string[]>([])
    const [dateInput, setDateInput] = useState('')
    const [defaultTitle, setDefaultTitle] = useState('')
    const [defaultStartTime, setDefaultStartTime] = useState('')
    const [defaultCategoryId, setDefaultCategoryId] = useState('')
    const [defaultTagsInput, setDefaultTagsInput] = useState('')
    const [defaultIsDrops, setDefaultIsDrops] = useState(false)
    const [defaultIsChzzkSupport, setDefaultIsChzzkSupport] = useState(false)
    const [defaultParticipants, setDefaultParticipants] = useState<ParticipantDraft[]>([])
    const [entries, setEntries] = useState<EntryDraft[]>([])
    const [error, setError] = useState<string | null>(null)

    const pending = createMutation.isPending || updateMutation.isPending

    const sortedDates = useMemo(() => [...dates].sort(), [dates])

    useEffect(() => {
        if (!isEditMode || detail === undefined) return

        const normalizedEntries = [...detail.broadcasts]
            .sort((a, b) => {
                const left = `${a.date}|${a.startTime ?? ''}`
                const right = `${b.date}|${b.startTime ?? ''}`
                return left.localeCompare(right)
            })
            .map((broadcast) => ({
                date: broadcast.date,
                title: broadcast.title,
                startTime: broadcast.startTime ?? '',
                categoryId: broadcast.categoryId !== null ? String(broadcast.categoryId) : '',
                tagsInput: broadcast.tags.join(', '),
                isDrops: broadcast.isDrops,
                isChzzkSupport: broadcast.isChzzkSupport,
                participants: (broadcast.streamers ?? []).map((streamer) => ({
                    name: streamer.name,
                    streamerId: streamer.streamerId,
                    isHost: streamer.isHost,
                })),
                expanded: true,
            }))

        setEditName(detail.name)
        setDates(normalizedEntries.map((entry) => entry.date))
        setEntries(normalizedEntries)
        setError(null)
    }, [detail, isEditMode])

    function addDate(): void {
        if (dateInput.length === 0) return
        if (dates.includes(dateInput)) {
            setError('이미 추가된 날짜입니다.')
            return
        }
        setDates((prev) => [...prev, dateInput])
        setDateInput('')
        setError(null)
    }

    function removeDate(date: string): void {
        setDates((prev) => prev.filter((d) => d !== date))
    }

    function addEditDate(): void {
        if (dateInput.length === 0) return
        if (entries.some((entry) => entry.date === dateInput)) {
            setError('이미 추가된 날짜입니다.')
            return
        }

        setEntries((prev) => [
            ...prev,
            {
                date: dateInput,
                title: editName.trim(),
                startTime: '',
                categoryId: '',
                tagsInput: '',
                isDrops: false,
                isChzzkSupport: false,
                participants: [],
                expanded: true,
            },
        ])
        setDates((prev) => [...prev, dateInput])
        setDateInput('')
        setError(null)
    }

    function removeEntry(date: string): void {
        setEntries((prev) => prev.filter((entry) => entry.date !== date))
        setDates((prev) => prev.filter((d) => d !== date))
    }

    function goToStep(nextStep: number): void {
        setError(null)

        if (nextStep === 2 && name.trim().length === 0) {
            setError('이벤트 이름은 필수입니다.')
            return
        }

        if (nextStep === 3 && dates.length === 0) {
            setError('날짜를 최소 1개 이상 추가해야 합니다.')
            return
        }

        if (nextStep === 4) {
            const sorted = [...dates].sort()
            setEntries(sorted.map((date) => ({
                date,
                title: defaultTitle,
                startTime: defaultStartTime,
                categoryId: defaultCategoryId,
                tagsInput: defaultTagsInput,
                isDrops: defaultIsDrops,
                isChzzkSupport: defaultIsChzzkSupport,
                participants: defaultParticipants.map((p) => ({ ...p })),
                expanded: true,
            })))
        }

        setStep(nextStep)
    }

    function updateEntry(index: number, patch: Partial<EntryDraft>): void {
        setEntries((prev) => prev.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)))
    }

    function toggleEntryExpanded(index: number): void {
        setEntries((prev) => prev.map((entry, i) => (i === index ? { ...entry, expanded: !entry.expanded } : entry)))
    }

    async function handleCreate(): Promise<void> {
        if (name.trim().length === 0) {
            setError('이벤트 이름은 필수입니다.')
            return
        }
        if (entries.length === 0) {
            setError('날짜가 없습니다.')
            return
        }

        const builtEntries: CreatePinnedEventEntry[] = entries.map((entry) => ({
            date: entry.date,
            title: entry.title.trim().length > 0 ? entry.title.trim() : name.trim(),
            startTime: entry.startTime.length > 0 ? entry.startTime : null,
            categoryId: entry.categoryId.length > 0 ? Number(entry.categoryId) : undefined,
            tags: parseTags(entry.tagsInput),
            isDrops: entry.isDrops,
            isChzzkSupport: entry.isChzzkSupport,
            participants: entry.participants.map((p) => ({
                    streamerId: p.streamerId,
                    name: p.name,
                    isHost: p.isHost,
                })),
        }))

        try {
            await createMutation.mutateAsync({ name: name.trim(), entries: builtEntries })
            addToast({ message: '고정 일정이 생성되었습니다.', variant: 'success' })
            onClose()
        } catch (err) {
            const message = getErrorMessage(err)
            if (message !== null) addToast({ message, variant: 'error' })
        }
    }

    async function handleUpdate(): Promise<void> {
        if (eventId === undefined) return
        if (editName.trim().length === 0) {
            setError('이벤트 이름은 필수입니다.')
            return
        }
        if (entries.length === 0) {
            setError('날짜가 없습니다.')
            return
        }

        const builtEntries: CreatePinnedEventEntry[] = entries.map((entry) => ({
            date: entry.date,
            title: entry.title.trim().length > 0 ? entry.title.trim() : editName.trim(),
            startTime: entry.startTime.length > 0 ? entry.startTime : null,
            categoryId: entry.categoryId.length > 0 ? Number(entry.categoryId) : undefined,
            tags: parseTags(entry.tagsInput),
            isDrops: entry.isDrops,
            isChzzkSupport: entry.isChzzkSupport,
            participants: entry.participants.map((p) => ({
                streamerId: p.streamerId,
                name: p.name,
                isHost: p.isHost,
            })),
        }))

        try {
            await updateMutation.mutateAsync({ id: eventId, body: { name: editName.trim(), entries: builtEntries } })
            addToast({ message: '고정 일정이 수정되었습니다.', variant: 'success' })
            onClose()
        } catch (err) {
            const message = getErrorMessage(err)
            if (message !== null) addToast({ message, variant: 'error' })
        }
    }

    function renderEntriesEditor(): JSX.Element {
        return (
            <div className="space-y-3">
                <p className="text-xs text-[#adadb8]">날짜별로 제목, 시간, 참석자를 개별 설정할 수 있습니다.</p>

                {entries.map((entry, index) => (
                    <div key={index} className="rounded-xl border border-[#3a3a44] bg-[#20202a]">
                        <button
                            type="button"
                            onClick={() => toggleEntryExpanded(index)}
                            className="flex w-full cursor-pointer items-center justify-between px-4 py-3"
                        >
                            <span className="flex items-center gap-2 text-sm font-semibold text-[#efeff1]">
                                {entry.expanded ? <ChevronDown className="h-4 w-4 text-[#848494]" /> : <ChevronRight className="h-4 w-4 text-[#848494]" />}
                                {entry.date}
                            </span>
                            <span className="text-xs text-[#848494]">
                                {entry.title.length > 0 ? entry.title : '(제목 없음)'}
                                {entry.participants.length > 0 && ` · ${entry.participants.length}명`}
                            </span>
                        </button>

                        {entry.expanded && (
                            <div className="space-y-3 border-t border-[#3a3a44] px-4 py-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1 space-y-3">
                                        <div className="space-y-1">
                                            <label className="flex items-center gap-1.5 text-xs font-medium text-[#adadb8]">
                                                <CalendarPlus className="h-3.5 w-3.5" /> 날짜
                                            </label>
                                            <input
                                                type="date"
                                                value={entry.date}
                                                onChange={(event) => updateEntry(index, { date: event.target.value })}
                                                className={inputClass}
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-[#adadb8]">제목</label>
                                            <input
                                                type="text"
                                                value={entry.title}
                                                onChange={(event) => updateEntry(index, { title: event.target.value })}
                                                className={inputClass}
                                                placeholder="방송 제목"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-[#adadb8]">시작 시간</label>
                                            <input
                                                type="time"
                                                value={entry.startTime}
                                                onChange={(event) => updateEntry(index, { startTime: event.target.value })}
                                                className={inputClass}
                                            />
                                        </div>

                                        <CategorySelector
                                            categories={categories}
                                            selectedId={entry.categoryId}
                                            onChange={(categoryId) => updateEntry(index, { categoryId })}
                                        />

                                        <div className="space-y-1">
                                            <label className="flex items-center gap-1.5 text-xs font-medium text-[#adadb8]">
                                                <Tag className="h-3.5 w-3.5" /> 태그
                                            </label>
                                            <input
                                                type="text"
                                                value={entry.tagsInput}
                                                onChange={(event) => updateEntry(index, { tagsInput: event.target.value })}
                                                className={inputClass}
                                                placeholder="예: 인챈트, 허니즈"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="flex items-center gap-1.5 text-xs font-medium text-[#adadb8]">
                                                <Tag className="h-3.5 w-3.5" /> 타입 / 속성
                                            </label>
                                            <div className="flex flex-wrap gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => updateEntry(index, { isChzzkSupport: !entry.isChzzkSupport })}
                                                    className={cn(
                                                        'inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition',
                                                        entry.isChzzkSupport
                                                            ? 'border-orange-500/40 bg-orange-500/15 text-orange-300'
                                                            : 'border-[#3a3a44] bg-[#26262e] text-[#adadb8] hover:bg-[#32323d]',
                                                    )}
                                                >
                                                    <Zap className="h-3 w-3" /> 제작지원
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => updateEntry(index, { isDrops: !entry.isDrops })}
                                                    className={cn(
                                                        'inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition',
                                                        entry.isDrops
                                                            ? 'border-blue-500/40 bg-blue-500/15 text-blue-300'
                                                            : 'border-[#3a3a44] bg-[#26262e] text-[#adadb8] hover:bg-[#32323d]',
                                                    )}
                                                >
                                                    <Gift className="h-3 w-3" /> 드롭스
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeEntry(entry.date)}
                                        className="cursor-pointer rounded-lg border border-red-500/30 bg-red-500/5 px-2.5 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/15"
                                    >
                                        날짜 삭제
                                    </button>
                                </div>

                                <ParticipantManager
                                    participants={entry.participants}
                                    streamers={streamers}
                                    onChange={(participants) => updateEntry(index, { participants })}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        )
    }

    if (isEditMode) {
        return (
            <ModalOverlay size="lg" disabled={pending} onClose={onClose}>
                <div className="flex max-h-[calc(100vh-2rem)] flex-col">
                    <div className="flex items-start justify-between border-b border-[#3a3a44] px-6 py-4">
                        <div>
                            <h2 className="text-base font-bold text-[#efeff1]">이벤트 수정</h2>
                            <p className="mt-1 text-xs text-[#adadb8]">고정 일정 이벤트 정보를 수정합니다.</p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={pending}
                            className="cursor-pointer rounded-lg border border-[#3a3a44] p-1.5 text-[#adadb8] transition hover:bg-[#26262e] disabled:opacity-50"
                            aria-label="닫기"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="min-h-0 space-y-4 overflow-y-auto px-6 py-4">
                        <div className="space-y-1">
                            <label className="flex items-center gap-1.5 text-xs font-medium text-[#adadb8]">
                                <Type className="h-3.5 w-3.5" /> 이벤트 이름 <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={editName}
                                onChange={(event) => setEditName(event.target.value)}
                                className={inputClass}
                                placeholder="이벤트 이름"
                                autoFocus
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="flex items-center gap-1.5 text-xs font-medium text-[#adadb8]">
                                <CalendarPlus className="h-3.5 w-3.5" /> 날짜 추가
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="date"
                                    value={dateInput}
                                    onChange={(event) => setDateInput(event.target.value)}
                                    className={cn(inputClass, 'flex-1')}
                                />
                                <button
                                    type="button"
                                    onClick={addEditDate}
                                    className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-[#3a3a44] bg-[#26262e] px-3 py-2 text-xs font-semibold text-[#efeff1] transition hover:bg-[#2e2e39]"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    날짜 추가
                                </button>
                            </div>
                        </div>

                        {entries.length > 0 ? renderEntriesEditor() : (
                            <div className="flex items-center justify-center rounded-xl border border-dashed border-[#3a3a44] py-6 text-xs text-[#848494]">
                                날짜를 추가해 세부 일정을 수정해 주세요
                            </div>
                        )}

                        {error !== null && <p className="text-xs text-red-400">{error}</p>}
                    </div>

                    <div className="flex gap-2 border-t border-[#3a3a44] px-6 py-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={pending}
                            className="cursor-pointer flex-1 rounded-xl border border-[#3a3a44] py-2.5 text-sm font-medium text-[#adadb8] transition hover:bg-[#26262e] disabled:opacity-50"
                        >
                            취소
                        </button>
                        <button
                            type="button"
                            onClick={() => { void handleUpdate() }}
                            disabled={pending}
                            className="cursor-pointer flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
                        >
                            {pending ? '저장 중...' : '저장'}
                        </button>
                    </div>
                </div>
            </ModalOverlay>
        )
    }

    const stepLabels = ['이름', '날짜', '프리필', '커스터마이즈']

    return (
        <ModalOverlay size="2xl" disabled={pending} onClose={onClose}>
            <div className="flex max-h-[calc(100vh-2rem)] flex-col">
                <div className="flex items-start justify-between border-b border-[#3a3a44] px-6 py-4">
                    <div>
                        <h2 className="text-base font-bold text-[#efeff1]">이벤트 추가</h2>
                        <p className="mt-1 text-xs text-[#adadb8]">고정 일정 이벤트를 생성합니다.</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={pending}
                        className="cursor-pointer rounded-lg border border-[#3a3a44] p-1.5 text-[#adadb8] transition hover:bg-[#26262e] disabled:opacity-50"
                        aria-label="닫기"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex items-center gap-2 border-b border-[#3a3a44] px-6 py-3">
                    {stepLabels.map((label, index) => {
                        const stepNum = index + 1
                        const isCurrent = step === stepNum
                        const isPast = step > stepNum
                        return (
                            <div key={label} className="flex items-center gap-2">
                                {index > 0 && <ChevronRight className="h-3 w-3 text-[#4a4a58]" />}
                                <span
                                    className={cn(
                                        'rounded-full px-2.5 py-1 text-xs font-semibold transition',
                                        isCurrent
                                            ? 'bg-blue-600 text-white'
                                            : isPast
                                              ? 'bg-emerald-500/15 text-emerald-300'
                                              : 'bg-[#26262e] text-[#848494]',
                                    )}
                                >
                                    {stepNum}. {label}
                                </span>
                            </div>
                        )
                    })}
                </div>

                <div className="min-h-0 overflow-y-auto px-6 py-4">
                {/* Step 1: Event name */}
                {step === 1 && (
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <label className="flex items-center gap-1.5 text-xs font-medium text-[#adadb8]">
                                <Type className="h-3.5 w-3.5" /> 이벤트 이름 <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                className={inputClass}
                                placeholder="예: 인챈트 콜라보 위크"
                                autoFocus
                            />
                        </div>
                    </div>
                )}

                {/* Step 2: Date selection */}
                {step === 2 && (
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <label className="flex items-center gap-1.5 text-xs font-medium text-[#adadb8]">
                                <CalendarPlus className="h-3.5 w-3.5" /> 날짜 추가
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="date"
                                    value={dateInput}
                                    onChange={(event) => setDateInput(event.target.value)}
                                    className={cn(inputClass, 'flex-1')}
                                />
                                <button
                                    type="button"
                                    onClick={addDate}
                                    className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-[#3a3a44] bg-[#26262e] px-3 py-2 text-xs font-semibold text-[#efeff1] transition hover:bg-[#2e2e39]"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    추가
                                </button>
                            </div>
                        </div>

                        {sortedDates.length > 0 && (
                            <div className="space-y-1.5">
                                <p className="text-xs font-medium text-[#adadb8]">선택된 날짜 ({sortedDates.length}개)</p>
                                <div className="flex flex-wrap gap-2">
                                    {sortedDates.map((date) => (
                                        <span
                                            key={date}
                                            className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/40 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300"
                                        >
                                            {date}
                                            <button
                                                type="button"
                                                onClick={() => removeDate(date)}
                                                className="cursor-pointer rounded-full p-0.5 text-blue-400 transition hover:bg-blue-500/20"
                                                aria-label={`${date} 삭제`}
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {sortedDates.length === 0 && (
                            <div className="flex items-center justify-center rounded-xl border border-dashed border-[#3a3a44] py-6 text-xs text-[#848494]">
                                날짜를 추가해 주세요
                            </div>
                        )}
                    </div>
                )}

                {/* Step 3: Prefill settings */}
                {step === 3 && (
                    <div className="space-y-4">
                        <p className="text-xs text-[#adadb8]">
                            아래 설정은 모든 날짜 엔트리에 기본값으로 채워집니다. (선택사항)
                        </p>

                        <div className="space-y-1">
                            <label className="flex items-center gap-1.5 text-xs font-medium text-[#adadb8]">
                                <Type className="h-3.5 w-3.5" /> 기본 방송 제목
                            </label>
                            <input
                                type="text"
                                value={defaultTitle}
                                onChange={(event) => setDefaultTitle(event.target.value)}
                                className={inputClass}
                                placeholder="모든 날짜에 공통 적용될 제목"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="flex items-center gap-1.5 text-xs font-medium text-[#adadb8]">
                                <Clock className="h-3.5 w-3.5" /> 기본 시작 시간
                            </label>
                            <input
                                type="time"
                                value={defaultStartTime}
                                onChange={(event) => setDefaultStartTime(event.target.value)}
                                className={inputClass}
                            />
                        </div>

                        <CategorySelector
                            categories={categories}
                            selectedId={defaultCategoryId}
                            onChange={setDefaultCategoryId}
                        />

                        <div className="space-y-1">
                            <label className="flex items-center gap-1.5 text-xs font-medium text-[#adadb8]">
                                <Tag className="h-3.5 w-3.5" /> 기본 태그
                            </label>
                            <input
                                type="text"
                                value={defaultTagsInput}
                                onChange={(event) => setDefaultTagsInput(event.target.value)}
                                className={inputClass}
                                placeholder="예: 인챈트, 허니즈"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-1.5 text-xs font-medium text-[#adadb8]">
                                <Tag className="h-3.5 w-3.5" /> 기본 타입 / 속성
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setDefaultIsChzzkSupport((prev) => !prev)}
                                    className={cn(
                                        'inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition',
                                        defaultIsChzzkSupport
                                            ? 'border-orange-500/40 bg-orange-500/15 text-orange-300'
                                            : 'border-[#3a3a44] bg-[#26262e] text-[#adadb8] hover:bg-[#32323d]',
                                    )}
                                >
                                    <Zap className="h-3 w-3" /> 제작지원
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDefaultIsDrops((prev) => !prev)}
                                    className={cn(
                                        'inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition',
                                        defaultIsDrops
                                            ? 'border-blue-500/40 bg-blue-500/15 text-blue-300'
                                            : 'border-[#3a3a44] bg-[#26262e] text-[#adadb8] hover:bg-[#32323d]',
                                    )}
                                >
                                    <Gift className="h-3 w-3" /> 드롭스
                                </button>
                            </div>
                        </div>

                        <div className="border-t border-[#3a3a44] pt-3">
                            <ParticipantManager
                                participants={defaultParticipants}
                                streamers={streamers}
                                onChange={setDefaultParticipants}
                            />
                        </div>
                    </div>
                )}

                {/* Step 4: Per-date customize */}
                {step === 4 && (
                    <div className="space-y-3">
                        <p className="text-xs text-[#adadb8]">
                            날짜별로 제목, 시간, 참석자를 개별 설정할 수 있습니다.
                        </p>

                        {renderEntriesEditor()}
                    </div>
                )}

                {error !== null && <p className="mt-3 text-xs text-red-400">{error}</p>}
                </div>

                <div className="flex gap-2 border-t border-[#3a3a44] px-6 py-4">
                    {step > 1 && (
                        <button
                            type="button"
                            onClick={() => goToStep(step - 1)}
                            disabled={pending}
                            className="cursor-pointer rounded-xl border border-[#3a3a44] px-4 py-2.5 text-sm font-medium text-[#adadb8] transition hover:bg-[#26262e] disabled:opacity-50"
                        >
                            이전
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={pending}
                        className="cursor-pointer flex-1 rounded-xl border border-[#3a3a44] py-2.5 text-sm font-medium text-[#adadb8] transition hover:bg-[#26262e] disabled:opacity-50"
                    >
                        취소
                    </button>
                    {step < 4 ? (
                        <button
                            type="button"
                            onClick={() => goToStep(step + 1)}
                            className="cursor-pointer flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
                        >
                            다음
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => { void handleCreate() }}
                            disabled={pending}
                            className="cursor-pointer flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
                        >
                            {pending ? '저장 중...' : '저장'}
                        </button>
                    )}
                </div>
            </div>
        </ModalOverlay>
    )
}
