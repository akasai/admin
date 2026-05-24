import { useMemo, useState } from 'react'
import { CalendarPlus, ChevronDown, ChevronRight, Clock, Plus, Type, X } from 'lucide-react'
import { useAdminToast, useCreatePinnedEvent, useUpdatePinnedEvent, usePinnedEventDetail, useStreamers } from '../../hooks'
import type { CreatePinnedEventEntry } from '../../types'
import type { ParticipantDraft } from '../schedule/types'
import { getErrorMessage } from '../../utils/error'
import { cn } from '../../lib/cn'
import { inputClass } from '../../constants/styles'
import { ModalOverlay } from '../ModalOverlay'
import { ParticipantManager } from '../schedule/ParticipantManager'

interface PinnedEventFormModalProps {
    eventId?: number
    onClose: () => void
}

interface EntryDraft {
    date: string
    title: string
    startTime: string
    participants: ParticipantDraft[]
    expanded: boolean
}

export function PinnedEventFormModal({ eventId, onClose }: PinnedEventFormModalProps) {
    const isEditMode = eventId !== undefined
    const { addToast } = useAdminToast()
    const createMutation = useCreatePinnedEvent()
    const updateMutation = useUpdatePinnedEvent()
    const { data: detail } = usePinnedEventDetail(eventId ?? 0)
    const { data: streamersData } = useStreamers({ size: 1000 })
    const streamers = streamersData?.items ?? []

    const [step, setStep] = useState(1)
    const [name, setName] = useState('')
    const [editName, setEditName] = useState('')
    const [editNameInitialized, setEditNameInitialized] = useState(false)

    const [dates, setDates] = useState<string[]>([])
    const [dateInput, setDateInput] = useState('')
    const [defaultTitle, setDefaultTitle] = useState('')
    const [defaultStartTime, setDefaultStartTime] = useState('')
    const [defaultParticipants, setDefaultParticipants] = useState<ParticipantDraft[]>([])
    const [entries, setEntries] = useState<EntryDraft[]>([])
    const [error, setError] = useState<string | null>(null)

    if (isEditMode && detail !== undefined && !editNameInitialized) {
        setEditName(detail.name)
        setEditNameInitialized(true)
    }

    const pending = createMutation.isPending || updateMutation.isPending

    const sortedDates = useMemo(() => [...dates].sort(), [dates])

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
            participants: entry.participants
                .filter((p) => p.streamerId !== undefined)
                .map((p) => ({
                    streamerId: p.streamerId as number,
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

        try {
            await updateMutation.mutateAsync({ id: eventId, body: { name: editName.trim() } })
            addToast({ message: '고정 일정이 수정되었습니다.', variant: 'success' })
            onClose()
        } catch (err) {
            const message = getErrorMessage(err)
            if (message !== null) addToast({ message, variant: 'error' })
        }
    }

    if (isEditMode) {
        return (
            <ModalOverlay size="lg" disabled={pending} onClose={onClose}>
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

                <div className="space-y-4 px-6 py-4">
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

                    {detail !== undefined && detail.broadcasts.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-[#adadb8]">등록된 방송 ({detail.broadcasts.length}개)</p>
                            <div className="max-h-48 space-y-1 overflow-auto rounded-xl border border-[#3a3a44] bg-[#20202a] p-2">
                                {detail.broadcasts.map((broadcast) => (
                                    <div key={broadcast.id} className="flex items-center justify-between rounded-lg bg-[#26262e] px-3 py-2">
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm text-[#efeff1]">{broadcast.title}</p>
                                            <p className="text-xs text-[#848494]">
                                                {broadcast.date}
                                                {broadcast.startTime !== null && ` · ${broadcast.startTime}`}
                                            </p>
                                        </div>
                                        {broadcast.streamers.length > 0 && (
                                            <span className="ml-2 shrink-0 text-xs text-[#848494]">
                                                {broadcast.streamers.map((s) => s.name).join(', ')}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
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
            </ModalOverlay>
        )
    }

    const stepLabels = ['이름', '날짜', '프리필', '커스터마이즈']

    return (
        <ModalOverlay size="2xl" disabled={pending} onClose={onClose}>
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

            <div className="max-h-[60vh] overflow-auto px-6 py-4">
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

                        {entries.map((entry, index) => (
                            <div
                                key={entry.date}
                                className="rounded-xl border border-[#3a3a44] bg-[#20202a]"
                            >
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
        </ModalOverlay>
    )
}
