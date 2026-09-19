import { Search, Trash2 } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import { inputClass, selectClass } from '../../constants/styles'
import { cn } from '../../lib/cn'
import type { BroadcastType, ParticipantRole } from '../../types'
import { Button } from '../ui/Button'
import { CategorySearchPicker } from '../ui/CategorySearchPicker'
import { BROADCAST_TYPE_LABELS, BROADCAST_TYPES, PARTICIPANT_ROLE_LABELS, PARTICIPANT_ROLES } from './utils'

const labelClass = 'flex min-w-0 flex-col gap-1.5 text-xs font-semibold text-text-muted'
const checkboxClass =
    'h-4 w-4 rounded border-border bg-card accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'))
const MINUTE_OPTIONS = ['00', '30'] as const
const DEFAULT_START_TIME = '19:00'

export interface BroadcastParticipantOption {
    id: string
    name: string
    keywords?: readonly string[]
    metadata?: string | null
}

interface BroadcastParticipantPickerProps {
    options: BroadcastParticipantOption[]
    selectedIds: ReadonlySet<string>
    onChange: (participantId: string) => void
    label?: string
    inputRef?: RefObject<HTMLInputElement>
    disabled?: boolean
}

export function BroadcastParticipantPicker({
    options,
    selectedIds,
    onChange,
    label = '참여자 추가',
    inputRef,
    disabled = false,
}: BroadcastParticipantPickerProps) {
    const [query, setQuery] = useState('')
    const resultListId = useId()
    const resultStatusId = useId()
    const searchInputRef = useRef<HTMLInputElement>(null)
    const resultContainerRef = useRef<HTMLDivElement>(null)
    const searchResults = useMemo(() => {
        const normalizedQuery = query.trim().toLocaleLowerCase('ko-KR')
        if (normalizedQuery.length === 0) return { total: 0, items: [] }

        const matches = options.filter((option) => {
            if (selectedIds.has(option.id)) return false
            if (option.name.toLocaleLowerCase('ko-KR').includes(normalizedQuery)) return true
            return option.keywords?.some((keyword) => keyword.toLocaleLowerCase('ko-KR').includes(normalizedQuery)) ?? false
        })
        return { total: matches.length, items: matches.slice(0, 20) }
    }, [options, query, selectedIds])
    const hasQuery = query.trim().length > 0
    const resultStatus = !hasQuery
        ? ''
        : searchResults.total === 0
          ? '검색 결과가 없습니다.'
          : searchResults.total > 20
            ? `${searchResults.total}명 중 상위 20명`
            : `${searchResults.total}명`

    useEffect(() => {
        if (hasQuery) resultContainerRef.current?.scrollIntoView({ block: 'nearest' })
    }, [hasQuery, searchResults.items.length])

    function restoreSearchFocus() {
        requestAnimationFrame(() => (inputRef ?? searchInputRef).current?.focus())
    }

    return (
        <div className="min-w-0 space-y-2">
            <label className={labelClass}>
                {label}
                <span className="relative block">
                    <Search
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim"
                        aria-hidden="true"
                    />
                    <input
                        ref={inputRef ?? searchInputRef}
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        className={cn(inputClass, 'pl-9')}
                        placeholder="이름·채널명·외부 ID"
                        aria-controls={searchResults.items.length > 0 ? resultListId : undefined}
                        aria-describedby={hasQuery ? resultStatusId : undefined}
                        disabled={disabled}
                    />
                </span>
            </label>
            <p id={resultStatusId} role="status" aria-live="polite" aria-atomic="true" className="sr-only">
                {resultStatus}
            </p>
            {hasQuery && (
                <div ref={resultContainerRef} className="overflow-hidden rounded-md border border-border bg-bg">
                    <p aria-hidden="true" className="border-b border-border px-3 py-2 text-[11px] text-text-dim">
                        {resultStatus}
                    </p>
                    {searchResults.items.length > 0 && (
                        <ul id={resultListId} aria-label="참여자 검색 결과" className="max-h-48 divide-y divide-border overflow-y-auto">
                            {searchResults.items.map((option) => (
                                <li key={option.id}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onChange(option.id)
                                            setQuery('')
                                            restoreSearchFocus()
                                        }}
                                        className="flex min-h-10 w-full cursor-pointer items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-card-hover active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                                    >
                                        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-text">{option.name}</span>
                                        {option.metadata !== null && option.metadata !== undefined && (
                                            <span className="max-w-[45%] truncate text-[11px] text-text-dim">{option.metadata}</span>
                                        )}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    )
}

interface BroadcastTitleFieldProps {
    value: string
    onChange: (value: string) => void
    disabled?: boolean
    autoFocus?: boolean
    invalid?: boolean
}

export function BroadcastTitleField({ value, onChange, disabled = false, autoFocus = false, invalid = false }: BroadcastTitleFieldProps) {
    return (
        <label className={labelClass}>
            <span>
                제목 <span className="text-[var(--color-danger)]">*</span>
            </span>
            <input
                autoFocus={autoFocus}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className={inputClass}
                aria-invalid={invalid}
                placeholder="방송 제목을 입력하세요"
                maxLength={200}
                required
                disabled={disabled}
            />
        </label>
    )
}

interface BroadcastTypeCategoryFieldsProps {
    broadcastType: BroadcastType
    onBroadcastTypeChange: (value: BroadcastType) => void
    categories: { id: number; name: string }[]
    categoryId: string
    onCategoryChange: (value: string) => void
    disabled?: boolean
    categoryDisabled?: boolean
    categoryPlaceholder?: string
    categoryMeta?: ReactNode
}

export function BroadcastTypeCategoryFields({
    broadcastType,
    onBroadcastTypeChange,
    categories,
    categoryId,
    onCategoryChange,
    disabled = false,
    categoryDisabled = false,
    categoryPlaceholder,
    categoryMeta,
}: BroadcastTypeCategoryFieldsProps) {
    return (
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
            <label className={labelClass}>
                방송 유형
                <select
                    value={broadcastType}
                    onChange={(event) => onBroadcastTypeChange(event.target.value as BroadcastType)}
                    className={selectClass}
                    disabled={disabled}
                >
                    {BROADCAST_TYPES.map((type) => (
                        <option key={type} value={type}>
                            {BROADCAST_TYPE_LABELS[type]}
                        </option>
                    ))}
                </select>
            </label>
            <div className="min-w-0">
                <CategorySearchPicker
                    categories={categories}
                    selectedId={categoryId}
                    onChange={onCategoryChange}
                    disabled={disabled || categoryDisabled}
                    placeholder={categoryPlaceholder}
                />
                {categoryMeta}
            </div>
        </div>
    )
}

interface BroadcastScheduleFieldsProps {
    startDate: string
    startTime: string | null
    onStartDateChange: (value: string) => void
    onStartTimeChange: (value: string | null) => void
    disabled?: boolean
    dateMeta?: ReactNode
    timeMeta?: ReactNode
    note?: ReactNode
}

export function BroadcastScheduleFields({
    startDate,
    startTime,
    onStartDateChange,
    onStartTimeChange,
    disabled = false,
    dateMeta,
    timeMeta,
    note,
}: BroadcastScheduleFieldsProps) {
    const lastDecidedTimeRef = useRef(startTime ?? DEFAULT_START_TIME)
    if (startTime !== null) lastDecidedTimeRef.current = startTime

    const effectiveStartTime = startTime ?? lastDecidedTimeRef.current
    const [startHour = '19', startMinute = '00'] = effectiveStartTime.split(':')
    const [customMinutes, setCustomMinutes] = useState(() => !MINUTE_OPTIONS.some((minute) => effectiveStartTime.endsWith(`:${minute}`)))
    const minuteInputRef = useRef<HTMLInputElement>(null)
    const minutePresetRef = useRef<HTMLButtonElement>(null)
    const timeUndecided = startTime === null

    useEffect(() => {
        if (!MINUTE_OPTIONS.includes(startMinute as (typeof MINUTE_OPTIONS)[number])) setCustomMinutes(true)
    }, [startMinute])

    function selectMinute(minute: (typeof MINUTE_OPTIONS)[number]) {
        onStartTimeChange(`${startHour}:${minute}`)
        setCustomMinutes(false)
        if (customMinutes) requestAnimationFrame(() => minutePresetRef.current?.focus())
    }

    return (
        <div className="grid min-w-0 grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
            <label className={labelClass}>
                <span>
                    시작 날짜 <span className="text-[var(--color-danger)]">*</span>
                </span>
                <input
                    type="date"
                    value={startDate}
                    onChange={(event) => onStartDateChange(event.target.value)}
                    className={inputClass}
                    required
                    disabled={disabled}
                />
                {dateMeta}
            </label>
            <div className="min-w-0 space-y-1">
                <fieldset disabled={disabled || timeUndecided} className="min-w-0">
                    <legend className="mb-1.5 text-xs font-semibold text-text-muted">시작 시간</legend>
                    <div className="grid min-w-0 grid-cols-2 gap-2">
                        <select
                            aria-label="시작 시"
                            value={startHour}
                            onChange={(event) => onStartTimeChange(`${event.target.value}:${startMinute}`)}
                            className={selectClass}
                        >
                            {HOUR_OPTIONS.map((hour) => (
                                <option key={hour} value={hour}>
                                    {hour}시
                                </option>
                            ))}
                        </select>
                        {customMinutes ? (
                            <label className="relative block min-w-0">
                                <span className="sr-only">시작 분 직접 입력</span>
                                <input
                                    ref={minuteInputRef}
                                    type="number"
                                    min="0"
                                    max="59"
                                    step="1"
                                    value={startMinute}
                                    onChange={(event) => onStartTimeChange(`${startHour}:${event.target.value}`)}
                                    onBlur={(event) => {
                                        const minute = event.target.value
                                        if (minute !== '' && event.currentTarget.validity.valid) {
                                            onStartTimeChange(`${startHour}:${String(Number(minute)).padStart(2, '0')}`)
                                        }
                                    }}
                                    className={cn(inputClass, 'pr-8')}
                                />
                                <span aria-hidden="true" className="pointer-events-none absolute right-3 top-3 text-xs text-text-muted">
                                    분
                                </span>
                            </label>
                        ) : (
                            <div
                                role="group"
                                aria-label="시작 분"
                                className="grid grid-cols-2 overflow-hidden rounded-md border border-border bg-bg"
                            >
                                {MINUTE_OPTIONS.map((minute) => (
                                    <button
                                        key={minute}
                                        ref={startMinute === minute ? minutePresetRef : undefined}
                                        type="button"
                                        aria-pressed={startMinute === minute}
                                        onClick={() => selectMinute(minute)}
                                        className={cn(
                                            'min-h-10 cursor-pointer text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50',
                                            startMinute === minute ? 'bg-primary/15 text-primary' : 'text-text-muted hover:bg-card-hover',
                                        )}
                                    >
                                        {minute}분
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </fieldset>
                <div className="flex min-h-10 items-center justify-between gap-2">
                    <label className="flex min-h-10 cursor-pointer items-center gap-2 text-xs text-text-muted">
                        <input
                            type="checkbox"
                            checked={timeUndecided}
                            onChange={(event) => onStartTimeChange(event.target.checked ? null : lastDecidedTimeRef.current)}
                            className={checkboxClass}
                            disabled={disabled}
                        />
                        시간 미정
                    </label>
                    {customMinutes ? (
                        <div role="group" aria-label="간편 분 선택" className="flex">
                            {MINUTE_OPTIONS.map((minute) => (
                                <Button
                                    key={minute}
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    disabled={disabled || timeUndecided}
                                    onClick={() => selectMinute(minute)}
                                >
                                    {minute}분
                                </Button>
                            ))}
                        </div>
                    ) : (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={disabled || timeUndecided}
                            onClick={() => {
                                setCustomMinutes(true)
                                requestAnimationFrame(() => {
                                    minuteInputRef.current?.focus()
                                    minuteInputRef.current?.select()
                                })
                            }}
                        >
                            직접 입력
                        </Button>
                    )}
                </div>
                {timeMeta}
            </div>
            {note !== undefined && <div className="text-[11px] leading-4 text-text-dim sm:col-span-2">{note}</div>}
        </div>
    )
}

interface BroadcastParticipantRowProps {
    name: string
    role: ParticipantRole
    isBroadcasting: boolean
    selector: ReactNode
    onRoleChange: (value: ParticipantRole) => void
    onBroadcastingChange: (value: boolean) => void
    onRemove: () => void
    disabled?: boolean
}

export function BroadcastParticipantRow({
    name,
    role,
    isBroadcasting,
    selector,
    onRoleChange,
    onBroadcastingChange,
    onRemove,
    disabled = false,
}: BroadcastParticipantRowProps) {
    return (
        <article
            className="grid min-w-0 grid-cols-[minmax(0,1fr)_2.5rem] items-center gap-2 rounded-md border border-border bg-card/45 p-3 sm:grid-cols-[minmax(0,1fr)_7rem_7rem_2.5rem]"
            aria-label={name}
        >
            {selector}
            <div className="col-span-2 row-start-2 grid min-w-0 grid-cols-2 items-center gap-2 sm:contents">
                <label className="min-w-0">
                    <span className="sr-only">{name} 역할</span>
                    <select
                        value={role}
                        onChange={(event) => onRoleChange(event.target.value as ParticipantRole)}
                        className={selectClass}
                        disabled={disabled}
                    >
                        {PARTICIPANT_ROLES.map((participantRole) => (
                            <option key={participantRole} value={participantRole}>
                                {PARTICIPANT_ROLE_LABELS[participantRole]}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="flex min-h-10 cursor-pointer items-center justify-center gap-2 whitespace-nowrap text-xs font-semibold text-text">
                    <input
                        type="checkbox"
                        aria-label={`${name} 직접 송출`}
                        checked={isBroadcasting}
                        onChange={(event) => onBroadcastingChange(event.target.checked)}
                        className={checkboxClass}
                        disabled={disabled}
                    />
                    직접 송출
                </label>
            </div>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`${name} 참여자 삭제`}
                onClick={onRemove}
                disabled={disabled}
                className="col-start-2 row-start-1 text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)] sm:col-start-4"
            >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
        </article>
    )
}

interface BroadcastPreviousFieldProps {
    value: string
    onChange: (value: string) => void
    disabled?: boolean
}

export function BroadcastPreviousField({ value, onChange, disabled = false }: BroadcastPreviousFieldProps) {
    return (
        <label className={labelClass}>
            이전 방송 ID
            <input
                type="number"
                min="1"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className={inputClass}
                placeholder="연결할 방송이 있는 경우"
                disabled={disabled}
            />
        </label>
    )
}

interface BroadcastToggleFieldProps {
    label: string
    checked: boolean
    onChange: (value: boolean) => void
    disabled?: boolean
}

export function BroadcastToggleField({ label, checked, onChange, disabled = false }: BroadcastToggleFieldProps) {
    return (
        <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm text-text">
            <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                className={checkboxClass}
                disabled={disabled}
            />
            {label}
        </label>
    )
}

interface BroadcastVisibilityFieldProps {
    visible: boolean
    onChange: (value: boolean) => void
    disabled?: boolean
}

export function BroadcastVisibilityField({ visible, onChange, disabled = false }: BroadcastVisibilityFieldProps) {
    return (
        <div className="space-y-1.5">
            <p className="text-xs font-semibold text-text-muted">공개 여부</p>
            <BroadcastToggleField label="사용자 화면에 노출" checked={visible} onChange={onChange} disabled={disabled} />
        </div>
    )
}
