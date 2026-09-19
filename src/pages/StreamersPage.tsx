/* Hallmark · pre-emit critique: P5 H5 E4 S5 R5 V4 */
/* Hallmark · macrostructure: Workbench Directory · tone: modern-minimal · anchor hue: green */
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ExternalLink, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ConfirmModal } from '../components/ConfirmModal'
import { ListEmpty, ListError, ListLoading } from '../components/ListState'
import { ModalOverlay } from '../components/ModalOverlay'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { inputClass, panelClass } from '../constants/styles'
import {
    useAdminToast,
    useCreateStreamer,
    useCreateStreamerChannel,
    useDeleteStreamer,
    useDeleteStreamerChannel,
    useStreamers,
    useUpdateStreamer,
    useUpdateStreamerChannel,
} from '../hooks'
import type { CreateStreamerChannelRequest, CreateStreamerRequest, StreamerChannel, StreamerItem } from '../types'
import { getErrorMessage } from '../utils/error'

interface StreamerFormValues {
    name: string
    isActive: boolean
}

interface ChannelFormValues {
    platform: string
    externalChannelId: string
    channelName: string
    description: string
    channelUrl: string
    profileImageUrl: string
    isPrimary: boolean
    isActive: boolean
}

const labelClass = 'block space-y-1.5 text-xs font-semibold text-text-muted'
const checkboxClass =
    'h-4 w-4 rounded border-border bg-card accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'

type StreamerFilter = 'all' | 'active' | 'inactive' | 'missing-channel'

const PAGE_SIZE = 40
const streamerFilters: Array<{
    value: StreamerFilter
    label: string
    countKey: 'total' | 'active' | 'inactive' | 'missingChannel'
}> = [
    { value: 'all', label: '전체', countKey: 'total' },
    { value: 'active', label: '활성', countKey: 'active' },
    { value: 'inactive', label: '비활성', countKey: 'inactive' },
    { value: 'missing-channel', label: '채널 미연결', countKey: 'missingChannel' },
]

function getPrimaryChannel(streamer: StreamerItem): StreamerChannel | undefined {
    const explicitlyPrimary = streamer.channels.find((channel) => channel.isPrimary)
    if (explicitlyPrimary !== undefined) return explicitlyPrimary

    const activeChannel = streamer.channels.find((channel) => channel.isActive)
    return activeChannel ?? streamer.channels[0]
}

function StreamerAvatar({ name, channel, size = 'md' }: { name: string; channel?: StreamerChannel; size?: 'sm' | 'md' }) {
    const sizeClass = size === 'sm' ? 'h-9 w-9 text-xs' : 'h-11 w-11 text-sm'

    return (
        <span
            className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-card font-semibold text-text-muted ${sizeClass}`}
            aria-hidden="true"
        >
            {name.trim().slice(0, 1).toUpperCase() || '—'}
            {channel?.profileImageUrl !== null && channel?.profileImageUrl !== undefined && (
                <img
                    src={channel.profileImageUrl}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                    onError={(event) => {
                        event.currentTarget.hidden = true
                    }}
                />
            )}
        </span>
    )
}

function toStreamerValues(streamer?: StreamerItem): StreamerFormValues {
    return { name: streamer?.name ?? '', isActive: streamer?.isActive ?? true }
}

function toChannelValues(channel?: StreamerChannel): ChannelFormValues {
    return {
        platform: channel?.platform ?? '',
        externalChannelId: channel?.externalChannelId ?? '',
        channelName: channel?.channelName ?? '',
        description: channel?.description ?? '',
        channelUrl: channel?.channelUrl ?? '',
        profileImageUrl: channel?.profileImageUrl ?? '',
        isPrimary: channel?.isPrimary ?? false,
        isActive: channel?.isActive ?? true,
    }
}

function toChannelPayload(values: ChannelFormValues): CreateStreamerChannelRequest {
    const description = values.description.trim()
    const profileImageUrl = values.profileImageUrl.trim()
    return {
        platform: values.platform.trim(),
        externalChannelId: values.externalChannelId.trim(),
        channelName: values.channelName.trim(),
        description: description.length > 0 ? description : null,
        channelUrl: values.channelUrl.trim(),
        profileImageUrl: profileImageUrl.length > 0 ? profileImageUrl : null,
        isPrimary: values.isPrimary,
        isActive: values.isActive,
    }
}

function StreamerFormModal({
    streamer,
    pending,
    onClose,
    onSubmit,
}: {
    streamer?: StreamerItem
    pending: boolean
    onClose: () => void
    onSubmit: (body: CreateStreamerRequest) => Promise<void>
}) {
    const [values, setValues] = useState(toStreamerValues(streamer))
    const [error, setError] = useState<string | null>(null)

    async function submit() {
        if (values.name.trim().length === 0) {
            setError('이름은 필수입니다.')
            return
        }
        setError(null)
        await onSubmit({ name: values.name.trim(), isActive: values.isActive })
    }

    return (
        <ModalOverlay ariaLabel={streamer === undefined ? '스트리머 추가' : '스트리머 수정'} size="lg" disabled={pending} onClose={onClose}>
            <div className="border-b border-border px-5 py-4 sm:px-6">
                <p className="mb-1 font-mono text-[10px] font-semibold tracking-[0.12em] text-text-dim">STREAMER RECORD</p>
                <h2 className="text-lg font-[650] tracking-[-0.02em] text-text">
                    {streamer === undefined ? '스트리머 추가' : '스트리머 수정'}
                </h2>
            </div>
            <div className="space-y-5 px-5 py-5 sm:px-6">
                <label className={labelClass}>
                    이름 <span className="text-[var(--color-danger)]">*</span>
                    <input
                        autoFocus
                        value={values.name}
                        onChange={(event) => setValues((previous) => ({ ...previous, name: event.target.value }))}
                        className={inputClass}
                        aria-invalid={error !== null}
                    />
                </label>
                <label className="flex min-h-10 cursor-pointer items-center gap-2 rounded-md border border-border bg-card/40 px-3 text-sm text-text">
                    <input
                        type="checkbox"
                        checked={values.isActive}
                        onChange={(event) => setValues((previous) => ({ ...previous, isActive: event.target.checked }))}
                        className={checkboxClass}
                    />
                    활성화
                </label>
                {error !== null && (
                    <p role="alert" className="text-xs text-[var(--color-danger)]">
                        {error}
                    </p>
                )}
            </div>
            <div className="flex gap-2 border-t border-border bg-bg px-5 py-4 sm:justify-end sm:px-6">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={pending}
                    className="min-w-0 flex-1 sm:flex-none sm:px-6"
                >
                    취소
                </Button>
                <Button type="button" onClick={() => void submit()} loading={pending} className="min-w-0 flex-1 sm:flex-none sm:px-6">
                    {pending ? '저장 중...' : '저장'}
                </Button>
            </div>
        </ModalOverlay>
    )
}

function ChannelFormModal({
    channel,
    pending,
    onClose,
    onSubmit,
}: {
    channel?: StreamerChannel
    pending: boolean
    onClose: () => void
    onSubmit: (body: CreateStreamerChannelRequest) => Promise<void>
}) {
    const [values, setValues] = useState(toChannelValues(channel))
    const [error, setError] = useState<string | null>(null)

    async function submit() {
        const body = toChannelPayload(values)
        if ([body.platform, body.externalChannelId, body.channelName, body.channelUrl].some((value) => value.length === 0)) {
            setError('플랫폼, 외부 채널 ID, 채널명, 채널 URL은 필수입니다.')
            return
        }
        setError(null)
        await onSubmit(body)
    }

    return (
        <ModalOverlay ariaLabel={channel === undefined ? '채널 추가' : '채널 수정'} size="2xl" disabled={pending} onClose={onClose}>
            <div className="border-b border-border px-5 py-4 sm:px-6">
                <p className="mb-1 font-mono text-[10px] font-semibold tracking-[0.12em] text-text-dim">CHANNEL RECORD</p>
                <h2 className="text-lg font-[650] tracking-[-0.02em] text-text">{channel === undefined ? '채널 추가' : '채널 수정'}</h2>
                <p className="mt-1 text-xs text-text-muted">플랫폼 채널 식별자와 노출 상태를 관리합니다.</p>
            </div>
            <div className="max-h-[calc(100dvh-12rem)] overflow-y-auto px-5 py-5 sm:px-6">
                <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className={labelClass}>
                        플랫폼 <span className="text-[var(--color-danger)]">*</span>
                        <input
                            autoFocus
                            value={values.platform}
                            onChange={(event) => setValues((previous) => ({ ...previous, platform: event.target.value }))}
                            className={inputClass}
                        />
                    </label>
                    <label className={labelClass}>
                        외부 채널 ID <span className="text-[var(--color-danger)]">*</span>
                        <input
                            value={values.externalChannelId}
                            onChange={(event) => setValues((previous) => ({ ...previous, externalChannelId: event.target.value }))}
                            className={`${inputClass} font-mono`}
                        />
                    </label>
                    <label className={labelClass}>
                        채널명 <span className="text-[var(--color-danger)]">*</span>
                        <input
                            value={values.channelName}
                            onChange={(event) => setValues((previous) => ({ ...previous, channelName: event.target.value }))}
                            className={inputClass}
                        />
                    </label>
                    <label className={labelClass}>
                        채널 URL <span className="text-[var(--color-danger)]">*</span>
                        <input
                            type="url"
                            value={values.channelUrl}
                            onChange={(event) => setValues((previous) => ({ ...previous, channelUrl: event.target.value }))}
                            className={inputClass}
                        />
                    </label>
                    <label className={labelClass}>
                        프로필 이미지 URL
                        <input
                            type="url"
                            value={values.profileImageUrl}
                            onChange={(event) => setValues((previous) => ({ ...previous, profileImageUrl: event.target.value }))}
                            className={inputClass}
                        />
                    </label>
                    <label className={labelClass}>
                        설명
                        <input
                            value={values.description}
                            onChange={(event) => setValues((previous) => ({ ...previous, description: event.target.value }))}
                            className={inputClass}
                        />
                    </label>
                </div>
                <fieldset className="mt-5 rounded-md border border-border bg-card/40 p-3">
                    <legend className="px-1 text-xs font-semibold text-text-muted">채널 상태</legend>
                    <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:gap-6">
                        <label className="flex min-h-9 cursor-pointer items-center gap-2 text-sm text-text">
                            <input
                                type="checkbox"
                                checked={values.isPrimary}
                                onChange={(event) => setValues((previous) => ({ ...previous, isPrimary: event.target.checked }))}
                                className={checkboxClass}
                            />
                            대표 채널
                        </label>
                        <label className="flex min-h-9 cursor-pointer items-center gap-2 text-sm text-text">
                            <input
                                type="checkbox"
                                checked={values.isActive}
                                onChange={(event) => setValues((previous) => ({ ...previous, isActive: event.target.checked }))}
                                className={checkboxClass}
                            />
                            활성화
                        </label>
                    </div>
                </fieldset>
                {error !== null && (
                    <p role="alert" className="mt-4 text-xs text-[var(--color-danger)]">
                        {error}
                    </p>
                )}
            </div>
            <div className="flex gap-2 border-t border-border bg-bg px-5 py-4 sm:justify-end sm:px-6">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={pending}
                    className="min-w-0 flex-1 sm:flex-none sm:px-6"
                >
                    취소
                </Button>
                <Button type="button" onClick={() => void submit()} loading={pending} className="min-w-0 flex-1 sm:flex-none sm:px-6">
                    {pending ? '저장 중...' : '저장'}
                </Button>
            </div>
        </ModalOverlay>
    )
}

export default function StreamersPage() {
    const { addToast } = useAdminToast()
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState<StreamerFilter>('all')
    const [page, setPage] = useState(1)
    const listRef = useRef<HTMLUListElement>(null)
    const { data, isLoading, isError, refetch } = useStreamers()
    const createStreamer = useCreateStreamer()
    const updateStreamer = useUpdateStreamer()
    const deleteStreamer = useDeleteStreamer()
    const createChannel = useCreateStreamerChannel()
    const updateChannel = useUpdateStreamerChannel()
    const deleteChannel = useDeleteStreamerChannel()
    const [showCreate, setShowCreate] = useState(false)
    const [editingStreamer, setEditingStreamer] = useState<StreamerItem | null>(null)
    const [deletingStreamer, setDeletingStreamer] = useState<StreamerItem | null>(null)
    const [expanded, setExpanded] = useState<number | null>(null)
    const [channelTarget, setChannelTarget] = useState<{ streamer: StreamerItem; channel?: StreamerChannel } | null>(null)
    const [deletingChannel, setDeletingChannel] = useState<{ streamerId: number; channel: StreamerChannel } | null>(null)
    const summary = useMemo(() => {
        const allStreamers = data?.items ?? []
        const active = allStreamers.filter((streamer) => streamer.isActive).length
        return {
            total: allStreamers.length,
            active,
            inactive: allStreamers.length - active,
            missingChannel: allStreamers.filter((streamer) => streamer.channels.length === 0).length,
        }
    }, [data])
    const streamers = useMemo(() => {
        const allStreamers = data?.items ?? []
        const query = search.trim().toLocaleLowerCase('ko-KR')
        return allStreamers.filter((streamer) => {
            const matchesFilter =
                filter === 'all' ||
                (filter === 'active' && streamer.isActive) ||
                (filter === 'inactive' && !streamer.isActive) ||
                (filter === 'missing-channel' && streamer.channels.length === 0)
            if (!matchesFilter) return false
            if (query.length === 0) return true
            return (
                streamer.name.toLocaleLowerCase('ko-KR').includes(query) ||
                streamer.channels.some((channel) =>
                    [channel.channelName, channel.platform, channel.externalChannelId].some((value) =>
                        value.toLocaleLowerCase('ko-KR').includes(query),
                    ),
                )
            )
        })
    }, [data, filter, search])
    const totalPages = Math.max(1, Math.ceil(streamers.length / PAGE_SIZE))
    useEffect(() => {
        setPage((previous) => Math.min(previous, totalPages))
    }, [totalPages])
    const currentPage = Math.min(page, totalPages)
    const visibleStreamers = streamers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
    const rangeStart = streamers.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
    const rangeEnd = Math.min(currentPage * PAGE_SIZE, streamers.length)

    function goToPage(nextPage: number) {
        setPage(nextPage)
        setExpanded(null)
        requestAnimationFrame(() => {
            listRef.current?.focus({ preventScroll: true })
            listRef.current?.scrollIntoView({ block: 'start' })
        })
    }

    async function run(action: () => Promise<unknown>, success: string): Promise<boolean> {
        try {
            await action()
            addToast({ message: success, variant: 'success' })
            return true
        } catch (error) {
            const message = getErrorMessage(error)
            if (message !== null) addToast({ message, variant: 'error' })
            return false
        }
    }

    return (
        <>
            <header className="mb-4 flex items-center justify-between gap-3 border-b border-border pb-4 sm:mb-6 sm:items-end sm:pb-6">
                <div className="min-w-0">
                    <p className="mb-2 hidden font-mono text-[11px] font-semibold tracking-[0.12em] text-text-dim sm:block">
                        TALENT DIRECTORY
                    </p>
                    <h1 className="min-w-0 text-xl font-[650] tracking-[-0.025em] text-text [overflow-wrap:anywhere] sm:text-2xl">
                        스트리머 관리
                    </h1>
                    <p className="mt-1.5 hidden text-sm text-text-muted sm:block">스트리머와 플랫폼별 채널 상태를 관리합니다.</p>
                </div>
                <Button
                    type="button"
                    size="lg"
                    leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}
                    onClick={() => setShowCreate(true)}
                    aria-label="스트리머 추가"
                    className="px-3 sm:px-5"
                >
                    <span className="sm:hidden">추가</span>
                    <span className="hidden sm:inline">스트리머 추가</span>
                </Button>
            </header>

            <section className={panelClass} aria-label="스트리머 목록">
                <div className="space-y-3 border-b border-border p-3 sm:p-5">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                        <label htmlFor="streamer-search" className="sr-only">
                            스트리머와 채널 검색
                        </label>
                        <div className="relative w-full xl:max-w-xl">
                            <Search
                                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim"
                                aria-hidden="true"
                            />
                            <input
                                id="streamer-search"
                                type="search"
                                value={search}
                                onChange={(event) => {
                                    setSearch(event.target.value)
                                    setPage(1)
                                    setExpanded(null)
                                }}
                                className={`${inputClass} pl-9`}
                                placeholder="이름·채널명·플랫폼·ID 검색"
                            />
                        </div>
                        <div aria-label="스트리머 필터">
                            <div className="grid grid-cols-2 gap-1 sm:flex sm:items-center">
                                {streamerFilters.map((option) => (
                                    <Button
                                        key={option.value}
                                        type="button"
                                        variant={filter === option.value ? 'primary' : 'ghost'}
                                        size="sm"
                                        onClick={() => {
                                            setFilter(option.value)
                                            setPage(1)
                                            setExpanded(null)
                                        }}
                                        className="w-full justify-between sm:w-auto sm:justify-center"
                                        aria-pressed={filter === option.value}
                                    >
                                        <span>{option.label}</span>
                                        <span className="tabular-nums">{isLoading || isError ? '—' : summary[option.countKey]}</span>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                    {!isLoading && !isError && (
                        <p
                            className={search.trim().length === 0 && filter === 'all' ? 'sr-only' : 'text-xs text-text-dim'}
                            aria-live="polite"
                        >
                            전체 {summary.total}명 중 {streamers.length}명
                        </p>
                    )}
                </div>

                {isLoading && <ListLoading />}
                {isError && <ListError message="스트리머를 불러오는 중 오류가 발생했습니다." onRetry={() => void refetch()} />}
                {!isLoading && !isError && summary.total === 0 && <ListEmpty message="등록된 스트리머가 없습니다." />}
                {!isLoading && !isError && summary.total > 0 && streamers.length === 0 && (
                    <div className="px-4 py-12 text-center sm:px-5">
                        <p className="text-sm font-semibold text-text">조건에 맞는 스트리머가 없습니다.</p>
                        <p className="mt-1 text-xs text-text-dim">검색어나 상태 필터를 바꿔보세요.</p>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-4"
                            onClick={() => {
                                setSearch('')
                                setFilter('all')
                                setPage(1)
                            }}
                        >
                            필터 초기화
                        </Button>
                    </div>
                )}
                {!isLoading && !isError && visibleStreamers.length > 0 && (
                    <>
                        <div
                            className="hidden grid-cols-[minmax(16rem,1.5fr)_minmax(13rem,1fr)_minmax(9rem,0.7fr)_5.5rem] gap-4 border-b border-border bg-bg px-5 py-2.5 text-[10px] font-semibold tracking-[0.08em] text-text-dim xl:grid"
                            aria-hidden="true"
                        >
                            <span>스트리머</span>
                            <span>주요 채널</span>
                            <span>연결 상태</span>
                            <span className="text-right">관리</span>
                        </div>
                        <ul
                            ref={listRef}
                            tabIndex={-1}
                            aria-label={`${currentPage}페이지 스트리머 목록`}
                            className="scroll-mt-20 divide-y divide-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                            {visibleStreamers.map((streamer) => {
                                const isExpanded = expanded === streamer.id
                                const channelPanelId = `streamer-${streamer.id}-channels`
                                const primaryChannel = getPrimaryChannel(streamer)
                                const showChannelName = primaryChannel !== undefined && primaryChannel.channelName !== streamer.name
                                const inactiveChannelCount = streamer.channels.reduce(
                                    (count, channel) => count + (channel.isActive ? 0 : 1),
                                    0,
                                )
                                const connectionStatus =
                                    primaryChannel === undefined ? '채널 미연결' : primaryChannel.isPrimary ? null : '대표 미지정'
                                return (
                                    <li key={streamer.id}>
                                        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-3 sm:px-5 xl:grid-cols-[minmax(16rem,1.5fr)_minmax(13rem,1fr)_minmax(9rem,0.7fr)_5.5rem] xl:gap-4">
                                            <button
                                                type="button"
                                                onClick={() => setExpanded(isExpanded ? null : streamer.id)}
                                                aria-label={`${streamer.name} 채널 ${isExpanded ? '접기' : '보기'}`}
                                                aria-expanded={isExpanded}
                                                aria-controls={channelPanelId}
                                                aria-describedby={`streamer-${streamer.id}-status`}
                                                className="flex min-h-10 min-w-0 cursor-pointer items-center gap-2 rounded-md text-left transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                            >
                                                <StreamerAvatar name={streamer.name} channel={primaryChannel} size="sm" />
                                                <span className="min-w-0 flex-1">
                                                    <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                                                        <span className="min-w-0 max-w-full text-sm font-semibold text-text [overflow-wrap:anywhere] xl:truncate">
                                                            {streamer.name}
                                                        </span>
                                                        <span
                                                            id={`streamer-${streamer.id}-status`}
                                                            className={
                                                                streamer.isActive
                                                                    ? 'text-[10px] text-text-dim'
                                                                    : 'text-[10px] font-semibold text-[var(--color-warning)]'
                                                            }
                                                        >
                                                            {streamer.isActive ? '활성' : '비활성'}
                                                        </span>
                                                    </span>
                                                    {primaryChannel !== undefined && (
                                                        <span className="mt-1 block text-xs text-text-dim [overflow-wrap:anywhere] xl:hidden">
                                                            {showChannelName && `${primaryChannel.channelName} · `}
                                                            {primaryChannel.platform} · 채널 {streamer.channels.length}개
                                                        </span>
                                                    )}
                                                </span>
                                                {isExpanded ? (
                                                    <ChevronUp className="h-4 w-4 shrink-0 text-text-dim" aria-hidden="true" />
                                                ) : (
                                                    <ChevronDown className="h-4 w-4 shrink-0 text-text-dim" aria-hidden="true" />
                                                )}
                                            </button>

                                            <div className="hidden min-w-0 xl:block">
                                                <span className="sr-only">주요 채널: </span>
                                                {primaryChannel === undefined ? (
                                                    <span className="text-xs text-text-dim" aria-hidden="true">
                                                        —
                                                    </span>
                                                ) : (
                                                    <>
                                                        <p className="truncate text-sm font-medium text-text">
                                                            {showChannelName ? primaryChannel.channelName : primaryChannel.platform}
                                                        </p>
                                                        {showChannelName && (
                                                            <p className="mt-1 truncate text-xs text-text-dim">{primaryChannel.platform}</p>
                                                        )}
                                                    </>
                                                )}
                                            </div>

                                            <div
                                                className={
                                                    connectionStatus !== null || inactiveChannelCount > 0
                                                        ? 'col-span-2 row-start-2 space-y-1 xl:col-span-1 xl:row-auto'
                                                        : 'hidden xl:block'
                                                }
                                            >
                                                <span className="sr-only">연결 상태: </span>
                                                {primaryChannel !== undefined && (
                                                    <p className="hidden text-xs text-text-muted xl:block">
                                                        채널 {streamer.channels.length}개
                                                    </p>
                                                )}
                                                {connectionStatus !== null && (
                                                    <p className="text-xs font-medium text-[var(--color-warning)]">{connectionStatus}</p>
                                                )}
                                                {inactiveChannelCount > 0 && (
                                                    <p className="text-xs font-medium text-[var(--color-warning)]">
                                                        비활성 채널 {inactiveChannelCount}개
                                                    </p>
                                                )}
                                            </div>

                                            <div
                                                className="col-start-2 row-start-1 flex items-center justify-end gap-1 xl:col-start-4"
                                                role="group"
                                                aria-label={`${streamer.name} 관리`}
                                            >
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setEditingStreamer(streamer)}
                                                    aria-label={`${streamer.name} 수정`}
                                                >
                                                    <Pencil className="h-4 w-4" aria-hidden="true" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setDeletingStreamer(streamer)}
                                                    className="text-[var(--color-danger)] hover:border-live/30 hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]"
                                                    aria-label={`${streamer.name} 삭제`}
                                                >
                                                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                                                </Button>
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div id={channelPanelId} className="border-t border-border bg-bg px-4 py-4 sm:px-5">
                                                <div className="mb-3 flex items-center justify-between gap-3">
                                                    <div>
                                                        <p className="text-xs font-semibold text-text-muted">플랫폼 채널</p>
                                                        <p className="mt-0.5 text-[11px] text-text-dim">
                                                            총 {streamer.channels.length}개 채널
                                                        </p>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setChannelTarget({ streamer })}
                                                        leftIcon={<Plus className="h-3.5 w-3.5" aria-hidden="true" />}
                                                    >
                                                        채널 추가
                                                    </Button>
                                                </div>
                                                {streamer.channels.length === 0 ? (
                                                    <div className="rounded-md border border-dashed border-border px-4 py-7 text-center">
                                                        <p className="text-xs font-medium text-text-muted">연결된 채널이 없습니다.</p>
                                                        <p className="mt-1 text-[11px] text-text-dim">방송 플랫폼 채널을 연결해 주세요.</p>
                                                    </div>
                                                ) : (
                                                    <ul className="grid gap-2 xl:grid-cols-2">
                                                        {streamer.channels.map((channel) => (
                                                            <li
                                                                key={channel.id}
                                                                className="grid min-w-0 grid-cols-[2.25rem_minmax(0,1fr)] items-start gap-3 rounded-md border border-border bg-bg-secondary p-3 sm:grid-cols-[2.25rem_minmax(0,1fr)_auto]"
                                                            >
                                                                <StreamerAvatar name={channel.channelName} channel={channel} size="sm" />
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                                                                        <p className="max-w-full text-sm font-medium text-text [overflow-wrap:anywhere] sm:truncate">
                                                                            {channel.channelName}
                                                                        </p>
                                                                        {channel.isPrimary && (
                                                                            <Badge variant="primary" size="sm">
                                                                                대표
                                                                            </Badge>
                                                                        )}
                                                                        <Badge variant={channel.isActive ? 'default' : 'outline'} size="sm">
                                                                            {channel.isActive ? '활성' : '비활성'}
                                                                        </Badge>
                                                                    </div>
                                                                    <p className="mt-1 break-all font-mono text-[11px] text-text-dim sm:truncate sm:break-normal">
                                                                        {channel.platform} · {channel.externalChannelId}
                                                                    </p>
                                                                    {channel.description !== null &&
                                                                        channel.description.trim().length > 0 && (
                                                                            <p className="mt-2 line-clamp-2 text-xs leading-5 text-text-muted">
                                                                                {channel.description}
                                                                            </p>
                                                                        )}
                                                                </div>
                                                                <div
                                                                    className="col-span-2 flex shrink-0 items-center justify-end gap-1 border-t border-border pt-2 sm:col-span-1 sm:border-0 sm:pt-0"
                                                                    role="group"
                                                                    aria-label={`${channel.channelName} 채널 관리`}
                                                                >
                                                                    <a
                                                                        href={channel.channelUrl}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-transparent text-text-muted transition-colors hover:border-border hover:bg-card hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                                                        aria-label={`${channel.channelName} 채널 새 탭에서 열기`}
                                                                    >
                                                                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                                                                    </a>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => setChannelTarget({ streamer, channel })}
                                                                        aria-label={`${channel.channelName} 수정`}
                                                                    >
                                                                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                                                                    </Button>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() =>
                                                                            setDeletingChannel({ streamerId: streamer.id, channel })
                                                                        }
                                                                        className="text-[var(--color-danger)] hover:border-live/30 hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]"
                                                                        aria-label={`${channel.channelName} 삭제`}
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                                                                    </Button>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        )}
                                    </li>
                                )
                            })}
                        </ul>
                        <nav
                            className="flex flex-col gap-3 border-t border-border bg-bg px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                            aria-label="스트리머 목록 페이지"
                        >
                            <p className="text-xs text-text-dim">
                                {rangeStart}–{rangeEnd} / {streamers.length}명
                            </p>
                            <div className="flex items-center justify-between gap-2 sm:justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    leftIcon={<ChevronLeft className="h-4 w-4" aria-hidden="true" />}
                                    onClick={() => goToPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                >
                                    이전
                                </Button>
                                <span
                                    className="min-w-16 text-center font-mono text-xs text-text-muted"
                                    aria-live="polite"
                                    aria-atomic="true"
                                >
                                    {currentPage} / {totalPages}
                                </span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    rightIcon={<ChevronRight className="h-4 w-4" aria-hidden="true" />}
                                    onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    다음
                                </Button>
                            </div>
                        </nav>
                    </>
                )}
            </section>

            {showCreate && (
                <StreamerFormModal
                    pending={createStreamer.isPending}
                    onClose={() => setShowCreate(false)}
                    onSubmit={async (body) => {
                        const succeeded = await run(() => createStreamer.mutateAsync(body), '스트리머가 추가되었습니다.')
                        if (succeeded) setShowCreate(false)
                    }}
                />
            )}
            {editingStreamer !== null && (
                <StreamerFormModal
                    streamer={editingStreamer}
                    pending={updateStreamer.isPending}
                    onClose={() => setEditingStreamer(null)}
                    onSubmit={async (body) => {
                        const succeeded = await run(
                            () => updateStreamer.mutateAsync({ id: editingStreamer.id, body }),
                            '스트리머가 수정되었습니다.',
                        )
                        if (succeeded) setEditingStreamer(null)
                    }}
                />
            )}
            {channelTarget !== null && (
                <ChannelFormModal
                    channel={channelTarget.channel}
                    pending={createChannel.isPending || updateChannel.isPending}
                    onClose={() => setChannelTarget(null)}
                    onSubmit={async (body) => {
                        const target = channelTarget
                        if (target === null) return
                        const channel = target.channel
                        const succeeded =
                            channel === undefined
                                ? await run(
                                      () => createChannel.mutateAsync({ streamerId: target.streamer.id, body }),
                                      '채널이 추가되었습니다.',
                                  )
                                : await run(
                                      () =>
                                          updateChannel.mutateAsync({
                                              streamerId: target.streamer.id,
                                              channelId: channel.id,
                                              body,
                                          }),
                                      '채널이 수정되었습니다.',
                                  )
                        if (succeeded) setChannelTarget(null)
                    }}
                />
            )}
            {deletingStreamer !== null && (
                <ConfirmModal
                    title="스트리머 삭제"
                    message="스트리머와 모든 채널을 삭제하시겠습니까?"
                    itemName={deletingStreamer.name}
                    pending={deleteStreamer.isPending}
                    onClose={() => setDeletingStreamer(null)}
                    onConfirm={() =>
                        void run(async () => {
                            await deleteStreamer.mutateAsync(deletingStreamer.id)
                            setDeletingStreamer(null)
                        }, '스트리머가 삭제되었습니다.')
                    }
                />
            )}
            {deletingChannel !== null && (
                <ConfirmModal
                    title="채널 삭제"
                    message="채널을 삭제하시겠습니까?"
                    itemName={deletingChannel.channel.channelName}
                    pending={deleteChannel.isPending}
                    onClose={() => setDeletingChannel(null)}
                    onConfirm={() =>
                        void run(async () => {
                            await deleteChannel.mutateAsync({
                                streamerId: deletingChannel.streamerId,
                                channelId: deletingChannel.channel.id,
                            })
                            setDeletingChannel(null)
                        }, '채널이 삭제되었습니다.')
                    }
                />
            )}
        </>
    )
}
