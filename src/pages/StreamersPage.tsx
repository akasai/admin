import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Copy, ExternalLink, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'
import {
    useAdminToast,
    useAffiliations,
    useDeleteStreamer,
    useRefreshStreamer,
    useRegisterStreamer,
    useStreamers,
    useUpdateStreamer,
} from '../hooks'
import type { StreamerItem, StreamerSortType, UpdateStreamerRequest } from '../types'
import { cn } from '../lib/cn'
import partnerMark from '../assets/mark.png'
import { getErrorMessage } from '../utils/error'
import { formatFollowerCount } from '../utils/format'
import { panelClass, selectClass } from '../constants/styles'
import { ConfirmModal } from '../components/ConfirmModal'
import { ListLoading, ListError, ListEmpty } from '../components/ListState'
import { Avatar, RegisterModal, StreamerDetailModal } from '../components/streamer'

const pageSize = 20

const sortOptions: { value: StreamerSortType; label: string }[] = [
    { value: 'name_asc', label: '이름순' },
    { value: 'name_desc', label: '이름 역순' },
    { value: 'follower_desc', label: '팔로워순' },
]

export default function StreamersPage() {
    const { addToast } = useAdminToast()
    const { data: allAffiliations = [] } = useAffiliations()
    const registerMutation = useRegisterStreamer()
    const refreshMutation = useRefreshStreamer()
    const updateStreamer = useUpdateStreamer()
    const deleteMutation = useDeleteStreamer()

    const [searchInput, setSearchInput] = useState('')
    const [debouncedName, setDebouncedName] = useState('')
    const [sort, setSort] = useState<StreamerSortType>('name_asc')
    const [page, setPage] = useState(1)

    const [isRegisterOpen, setRegisterOpen] = useState(false)
    const [detailStreamer, setDetailStreamer] = useState<StreamerItem | null>(null)
    const [deletingStreamer, setDeletingStreamer] = useState<StreamerItem | null>(null)

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setDebouncedName(searchInput.trim())
        }, 300)

        return () => {
            window.clearTimeout(timer)
        }
    }, [searchInput])

    useEffect(() => {
        setPage(1)
    }, [debouncedName, sort])

    const params = useMemo(
        () => ({
            name: debouncedName.length > 0 ? debouncedName : undefined,
            page,
            size: pageSize,
            sort,
        }),
        [debouncedName, page, sort],
    )

    const { data, isLoading, isError, refetch } = useStreamers(params)
    const items = data?.items ?? []

    useEffect(() => {
        if (detailStreamer === null) return
        const updated = items.find((s) => s.id === detailStreamer.id)
        if (updated) setDetailStreamer(updated)
    }, [items])

    const total = data?.total ?? 0
    const currentPage = data?.page ?? page
    const currentSize = data?.size ?? pageSize
    const totalPages = Math.max(1, Math.ceil(total / currentSize))

    async function handleRegister(channelId: string): Promise<void> {
        try {
            await registerMutation.mutateAsync({ channelId })
            addToast({ message: '스트리머가 등록되었습니다.', variant: 'success' })
            setRegisterOpen(false)
        } catch (error) {
            const message = getErrorMessage(error)
            if (message !== null) addToast({ message, variant: 'error' })
        }
    }

    async function handleRefresh(streamer: StreamerItem): Promise<void> {
        try {
            await refreshMutation.mutateAsync(streamer.id)
            addToast({ message: `${streamer.name} 정보를 새로고침했습니다.`, variant: 'success' })
        } catch (error) {
            const message = getErrorMessage(error)
            if (message !== null) addToast({ message, variant: 'error' })
        }
    }

    async function handleCopyChannelId(channelId: string | null): Promise<void> {
        if (!channelId) {
            addToast({ message: '채널 ID가 없습니다.', variant: 'error' })
            return
        }

        try {
            await navigator.clipboard.writeText(channelId)
            addToast({ message: '채널 ID를 복사했습니다.', variant: 'success' })
        } catch {
            addToast({ message: '클립보드 복사에 실패했습니다.', variant: 'error' })
        }
    }

    function handleSave(data: UpdateStreamerRequest): void {
        if (!detailStreamer) return
        updateStreamer.mutate(
            { id: detailStreamer.id, body: data },
            {
                onSuccess: () => addToast({ message: '저장되었습니다.', variant: 'success' }),
                onError: (error) => {
                    const message = getErrorMessage(error)
                    if (message !== null) addToast({ message, variant: 'error' })
                },
            },
        )
    }

    async function handleDelete(): Promise<void> {
        if (deletingStreamer === null) return

        try {
            await deleteMutation.mutateAsync(deletingStreamer.id)
            addToast({ message: '스트리머가 삭제되었습니다.', variant: 'success' })
            setDeletingStreamer(null)
            if (detailStreamer?.id === deletingStreamer.id) {
                setDetailStreamer(null)
            }
        } catch (error) {
            const message = getErrorMessage(error)
            if (message !== null) addToast({ message, variant: 'error' })
        }
    }

    return (
        <>
            <div className="mb-6 flex items-start justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold text-[#efeff1]">스트리머 관리</h1>
                        <span className="rounded-full border border-[#3a3a44] bg-[#26262e] px-2.5 py-0.5 text-xs font-semibold text-[#adadb8]">
                            전체 {total.toLocaleString('ko-KR')}명
                        </span>
                    </div>
                    <p className="mt-1 text-sm text-[#adadb8]">등록된 스트리머를 관리합니다</p>
                </div>
                <button
                    type="button"
                    onClick={() => setRegisterOpen(true)}
                    className="cursor-pointer flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
                >
                    <Plus className="h-4 w-4" />
                    스트리머 등록
                </button>
            </div>

            <div className={cn(panelClass, 'mb-4 p-4')}>
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#848494]" />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                            className={cn('w-full rounded-xl border border-[#3a3a44] bg-[#26262e] px-3 py-2 text-sm text-[#efeff1] outline-none transition placeholder:text-[#848494] focus:border-blue-500 pl-9')}
                            placeholder="이름 검색"
                        />
                    </div>

                    <select value={sort} onChange={(event) => setSort(event.target.value as StreamerSortType)} className={cn(selectClass, 'md:w-40')}>
                        {sortOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className={panelClass}>
                <div className="grid grid-cols-[56px_minmax(0,2fr)_minmax(0,1.5fr)_110px_minmax(0,1.4fr)_126px] items-center gap-3 border-b border-[#3a3a44] px-4 py-3 text-center text-xs font-semibold text-[#848494]">
                    <div>아바타</div>
                    <div className="text-left">이름/닉네임</div>
                    <div className="text-left">채널ID</div>
                    <div>팔로워</div>
                    <div className="text-left">소속</div>
                    <div>작업</div>
                </div>

                {isLoading && <ListLoading />}

                {isError && <ListError message="스트리머 목록을 불러오는 중 오류가 발생했습니다." onRetry={() => { void refetch() }} />}

                {!isLoading && !isError && items.length === 0 && <ListEmpty message="등록된 스트리머가 없습니다." />}

                {!isLoading && !isError && items.length > 0 && (
                    <ul className="divide-y divide-[#3a3a44]">
                        {items.map((streamer) => {
                            const showNickname = streamer.nickname !== null && streamer.nickname.trim().length > 0 && streamer.nickname !== streamer.name
                            const refreshingThisRow = refreshMutation.isPending

                            return (
                                <li
                                    key={streamer.id}
                                    className="grid grid-cols-[56px_minmax(0,2fr)_minmax(0,1.5fr)_110px_minmax(0,1.4fr)_126px] items-center gap-3 px-4 py-3 transition hover:bg-[#26262e]/60"
                                >
                                    <div className="flex justify-center">
                                        <Avatar streamer={streamer} />
                                    </div>

                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <p className="truncate text-sm font-semibold text-[#efeff1]">{streamer.name}</p>
                                            {streamer.isPartner && (
                                                <img src={partnerMark} alt="파트너" className="h-4 w-4 shrink-0" />
                                            )}
                                            {streamer.streamerType === 'vtuber' && (
                                                <span className="rounded-full bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-purple-300">버튜버</span>
                                            )}
                                            {streamer.streamerType === 'hybrid' && (
                                                <span className="rounded-full bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-blue-300">하이브리드</span>
                                            )}
                                            {streamer.isProGamer && (
                                                <span className="rounded-full bg-green-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-green-300">프로</span>
                                            )}
                                        </div>
                                        {showNickname && <p className="mt-0.5 truncate text-xs text-[#adadb8]">{streamer.nickname}</p>}
                                    </div>

                                    <div className="flex min-w-0 items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                void handleCopyChannelId(streamer.channelId)
                                            }}
                                            className="inline-flex min-w-0 cursor-pointer items-center gap-1 rounded-lg border border-[#3a3a44] bg-[#26262e] px-2 py-1 text-xs text-[#adadb8] transition hover:border-blue-500 hover:text-[#efeff1]"
                                        >
                                            <span className="truncate font-mono">{streamer.channelId ?? '-'}</span>
                                            <Copy className="h-3.5 w-3.5 shrink-0" />
                                        </button>
                                        {streamer.channelId && (
                                            <a
                                                href={`https://chzzk.naver.com/${streamer.channelId}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="shrink-0 cursor-pointer rounded-lg border border-[#3a3a44] p-1.5 text-[#848494] transition hover:border-blue-500 hover:text-[#efeff1]"
                                                title="치지직 채널"
                                            >
                                                <ExternalLink className="h-3.5 w-3.5" />
                                            </a>
                                        )}
                                    </div>

                                    <div className="text-center text-sm tabular-nums text-[#efeff1]">{formatFollowerCount(streamer.followerCount)}</div>

                                    <div className="min-w-0">
                                        {streamer.affiliations.length === 0 ? (
                                            <span className="text-xs text-[#848494]">-</span>
                                        ) : (
                                            <div className="flex flex-wrap gap-1.5">
                                                {streamer.affiliations.map((affiliation) => (
                                                    <span
                                                        key={affiliation.id}
                                                        className="rounded-full border border-[#3a3a44] bg-[#26262e] px-2 py-0.5 text-[11px] text-[#adadb8]"
                                                    >
                                                        {affiliation.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>



                                    <div className="flex items-center justify-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                void handleRefresh(streamer)
                                            }}
                                            disabled={refreshingThisRow}
                                            className="cursor-pointer rounded-lg border border-[#3a3a44] p-1.5 text-[#adadb8] transition hover:bg-[#26262e] disabled:opacity-50"
                                            aria-label="새로고침"
                                        >
                                            <RefreshCw className={cn('h-4 w-4', refreshingThisRow && 'animate-spin')} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDetailStreamer(streamer)}
                                            className="cursor-pointer rounded-lg border border-[#3a3a44] p-1.5 text-[#adadb8] transition hover:bg-[#26262e]"
                                            aria-label="수정"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDeletingStreamer(streamer)}
                                            className="cursor-pointer rounded-lg border border-red-500/35 p-1.5 text-red-300 transition hover:bg-red-500/10"
                                            aria-label="삭제"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                )}

                <div className="flex items-center justify-between border-t border-[#3a3a44] px-4 py-3">
                    <p className="text-sm text-[#adadb8]">전체 {total.toLocaleString('ko-KR')}명</p>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                            disabled={isLoading || currentPage <= 1}
                            className="cursor-pointer inline-flex items-center gap-1 rounded-lg border border-[#3a3a44] px-2.5 py-1.5 text-xs font-medium text-[#adadb8] transition hover:bg-[#26262e] disabled:opacity-40"
                        >
                            <ChevronLeft className="h-3.5 w-3.5" /> 이전
                        </button>
                        <span className="text-xs tabular-nums text-[#848494]">
                            {Math.min(currentPage, totalPages)} / {totalPages}
                        </span>
                        <button
                            type="button"
                            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                            disabled={isLoading || currentPage >= totalPages}
                            className="cursor-pointer inline-flex items-center gap-1 rounded-lg border border-[#3a3a44] px-2.5 py-1.5 text-xs font-medium text-[#adadb8] transition hover:bg-[#26262e] disabled:opacity-40"
                        >
                            다음 <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {isRegisterOpen && (
                <RegisterModal pending={registerMutation.isPending} onClose={() => setRegisterOpen(false)} onSubmit={handleRegister} />
            )}

            {detailStreamer !== null && (
                <StreamerDetailModal
                    streamer={detailStreamer}
                    allAffiliations={allAffiliations}
                    pendingSave={updateStreamer.isPending}
                    pendingDelete={deleteMutation.isPending}
                    onClose={() => setDetailStreamer(null)}
                    onSave={handleSave}
                    onDelete={() => setDeletingStreamer(detailStreamer)}
                />
            )}

            {deletingStreamer !== null && (
                <ConfirmModal
                    title="스트리머 삭제"
                    message="스트리머를 삭제하시겠습니까?"
                    itemName={deletingStreamer.name}
                    pending={deleteMutation.isPending}
                    onClose={() => setDeletingStreamer(null)}
                    onConfirm={() => {
                        void handleDelete()
                    }}
                />
            )}

        </>
    )
}
