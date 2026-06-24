import { useEffect, useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Database, Plus, RefreshCw, Search, X } from 'lucide-react'

import { Button } from '@/components/shadcn/ui/button'
import { Input } from '@/components/shadcn/ui/input'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/shadcn/ui/alert-dialog'
import {
    RegisterModal,
    StreamerFilters,
    StreamerStats,
    StreamerTable,
    type PartnerFilter,
    type SortDirection,
    type SortField,
    type StreamerTypeFilter,
} from '@/components/streamer'
import { StreamerDetailOverlay } from '@/components/streamer/StreamerDetailOverlay'
import { useAdminToast } from '@/hooks/useAdminToast'
import { useAffiliations } from '@/hooks/useAffiliations'
import { useStreamers, useRefreshStreamer, useDeleteStreamer, useRegisterStreamer, useUpdateStreamer } from '@/hooks/useStreamers'
import { ApiError } from '@/lib/apiClient'
import type { StreamerItem, StreamerType, UpdateStreamerRequest } from '@/types/streamer'

const PAGE_SIZE = 20

const SORT_FIELD_MAP: Record<SortField, 'name' | 'follower'> = {
    name: 'name',
    followerCount: 'follower',
}

export default function StreamersPage() {
    const { addToast } = useAdminToast()
    const [searchQuery, setSearchQuery] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [deleteTarget, setDeleteTarget] = useState<StreamerItem | null>(null)
    const [showRegisterModal, setShowRegisterModal] = useState(false)
    const [selectedStreamer, setSelectedStreamer] = useState<StreamerItem | null>(null)
    const [sortField, setSortField] = useState<SortField>('name')
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
    const [currentPage, setCurrentPage] = useState(1)
    const [typeFilter, setTypeFilter] = useState<StreamerTypeFilter>('all')
    const [partnerFilter, setPartnerFilter] = useState<PartnerFilter>('all')
    const [isMobileHeroExpanded, setIsMobileHeroExpanded] = useState(false)

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setDebouncedSearch(searchQuery.trim())
            setCurrentPage(1)
        }, 300)

        return () => window.clearTimeout(timeoutId)
    }, [searchQuery])

    const { data, isLoading, isError, refetch } = useStreamers({
        type: typeFilter !== 'all' ? (typeFilter as StreamerType) : undefined,
        partner: partnerFilter === 'partner' ? true : partnerFilter === 'non-partner' ? false : undefined,
        sort: SORT_FIELD_MAP[sortField],
        order: sortDirection,
        page: currentPage,
        size: PAGE_SIZE,
        search: debouncedSearch || undefined,
    })

    const refreshMutation = useRefreshStreamer()
    const deleteMutation = useDeleteStreamer()
    const registerMutation = useRegisterStreamer()
    const updateMutation = useUpdateStreamer()
    const { data: affiliationsData } = useAffiliations()

    const streamers = data?.items ?? []
    const total = data?.total ?? 0
    const stats = data?.stats
    const totalPages = Math.ceil(total / PAGE_SIZE)
    const hasActiveCriteria = searchQuery.trim().length > 0 || typeFilter !== 'all' || partnerFilter !== 'all'

    const handleSearchChange = (value: string) => {
        setSearchQuery(value)
    }

    const handleTypeFilterChange = (filter: StreamerTypeFilter) => {
        setTypeFilter(filter)
        setCurrentPage(1)
    }

    const handlePartnerFilterChange = (filter: PartnerFilter) => {
        setPartnerFilter(filter)
        setCurrentPage(1)
    }

    const handleClearFilters = () => {
        setTypeFilter('all')
        setPartnerFilter('all')
        setCurrentPage(1)
    }

    const handleClearSearchAndFilters = () => {
        setSearchQuery('')
        setDebouncedSearch('')
        setTypeFilter('all')
        setPartnerFilter('all')
        setCurrentPage(1)
    }

    const handleScrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleSortChange = (field: SortField, direction: SortDirection) => {
        setSortField(field)
        setSortDirection(direction)
        setCurrentPage(1)
    }

    const handleCopyChannelId = async (channelId: string) => {
        try {
            await navigator.clipboard.writeText(channelId)
            addToast({ message: '채널 ID를 복사했습니다.', variant: 'success' })
        } catch {
            addToast({ message: '복사에 실패했습니다.', variant: 'error' })
        }
    }

    const handleRefresh = (streamer: StreamerItem) => {
        refreshMutation.mutate(streamer.id, {
            onSuccess: () => addToast({ message: `${streamer.name} 정보를 새로고침했습니다.`, variant: 'success' }),
            onError: () => addToast({ message: '새로고침에 실패했습니다.', variant: 'error' }),
        })
    }

    const handleRowClick = (streamer: StreamerItem) => {
        setSelectedStreamer(streamer)
    }

    const handleOverlayClose = () => {
        setSelectedStreamer(null)
    }

    const handleOverlaySave = (data: UpdateStreamerRequest) => {
        if (!selectedStreamer) return
        updateMutation.mutate(
            { id: selectedStreamer.id, body: data },
            {
                onSuccess: () => {
                    addToast({ message: '스트리머 정보를 수정했습니다.', variant: 'success' })
                    setSelectedStreamer(null)
                },
                onError: () => addToast({ message: '수정에 실패했습니다.', variant: 'error' }),
            },
        )
    }

    const handleDeleteClick = (streamer: StreamerItem) => {
        setDeleteTarget(streamer)
    }

    const handleDeleteConfirm = () => {
        if (!deleteTarget) return
        deleteMutation.mutate(deleteTarget.id, {
            onSuccess: () => {
                addToast({ message: `${deleteTarget.name}을(를) 삭제했습니다.`, variant: 'success' })
                setDeleteTarget(null)
            },
            onError: () => {
                addToast({ message: '삭제에 실패했습니다.', variant: 'error' })
                setDeleteTarget(null)
            },
        })
    }

    const handleRegister = async (channelId: string) => {
        try {
            await registerMutation.mutateAsync({ channelId })
            addToast({ message: '스트리머를 등록했습니다.', variant: 'success' })
            setShowRegisterModal(false)
        } catch (error) {
            if (error instanceof ApiError && error.status === 409) {
                addToast({ message: '이미 등록된 스트리머입니다.', variant: 'error' })
            } else if (error instanceof ApiError && error.status === 400) {
                addToast({ message: '존재하지 않는 채널 ID입니다.', variant: 'error' })
            } else {
                addToast({ message: '스트리머 등록에 실패했습니다.', variant: 'error' })
            }
        }
    }

    const renderResults = () => {
        if (isLoading) {
            return (
                <ResultsPanel total={total} currentPage={currentPage} totalPages={totalPages}>
                    <StreamerLoadingState />
                </ResultsPanel>
            )
        }

        if (isError) {
            return (
                <ResultsPanel total={total} currentPage={currentPage} totalPages={totalPages}>
                    <StreamerErrorState
                        onRetry={() => {
                            void refetch()
                        }}
                    />
                </ResultsPanel>
            )
        }

        if (streamers.length === 0) {
            return (
                <ResultsPanel total={total} currentPage={currentPage} totalPages={totalPages}>
                    <StreamerEmptyState
                        hasActiveCriteria={hasActiveCriteria}
                        onReset={handleClearSearchAndFilters}
                        onRegister={() => setShowRegisterModal(true)}
                    />
                </ResultsPanel>
            )
        }

        return (
            <ResultsPanel total={total} currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage}>
                <StreamerTable
                    streamers={streamers}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSortChange={handleSortChange}
                    onDelete={handleDeleteClick}
                    onRefresh={handleRefresh}
                    onCopyChannelId={handleCopyChannelId}
                    onRowClick={handleRowClick}
                    searchQuery={debouncedSearch}
                />
            </ResultsPanel>
        )
    }

    return (
        <div className="space-y-5 sm:space-y-6">
            <section className="relative overflow-hidden rounded-3xl border border-border bg-bg-secondary shadow-card">
                <div className="pointer-events-none absolute -top-24 right-0 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-28 left-10 h-44 w-44 rounded-full bg-collab/10 blur-3xl" />
                <div className="relative space-y-4 p-5 sm:p-6 md:space-y-5">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div className="flex items-start justify-between gap-4 md:block md:max-w-2xl">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Streamer Operations</p>
                                <h1 className="mt-3 text-2xl font-bold tracking-tight text-text sm:text-3xl">스트리머 관리</h1>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsMobileHeroExpanded((value) => !value)}
                                className="mt-1 inline-flex shrink-0 cursor-pointer items-center py-1 text-text-muted transition hover:text-primary md:hidden"
                                aria-expanded={isMobileHeroExpanded}
                                aria-controls="streamer-mobile-hero-controls"
                                aria-label={isMobileHeroExpanded ? '접기' : '펼치기'}
                            >
                                {isMobileHeroExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                        </div>
                        <div className="hidden flex-col gap-3 sm:flex-row sm:items-center sm:justify-between md:flex lg:flex-col lg:items-end">
                            <StreamerStats stats={stats} isLoading={isLoading} />
                            <Button
                                onClick={() => setShowRegisterModal(true)}
                                className="rounded-xl bg-primary font-semibold text-bg shadow-card hover:bg-primary-dim"
                            >
                                <Plus className="h-4 w-4" />
                                스트리머 등록
                            </Button>
                        </div>
                    </div>

                    <div
                        id="streamer-mobile-hero-controls"
                        className={`${isMobileHeroExpanded ? 'block' : 'hidden md:block'} rounded-2xl border border-border bg-card/75 p-3 sm:p-4`}
                    >
                        <div className="flex flex-col gap-3 xl:flex-row xl:items-start">
                            <div className="relative min-w-0 flex-1">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-dim" />
                                <Input
                                    value={searchQuery}
                                    onChange={(event) => handleSearchChange(event.target.value)}
                                    placeholder="이름, 닉네임, 초성 검색"
                                    className="h-11 rounded-xl border-border bg-bg-secondary pr-10 pl-10 text-sm shadow-none"
                                />
                                {searchQuery.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => handleSearchChange('')}
                                        className="absolute top-1/2 right-2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-text-muted transition hover:bg-card-hover hover:text-text"
                                        aria-label="검색어 지우기"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                            <StreamerFilters
                                typeFilter={typeFilter}
                                partnerFilter={partnerFilter}
                                onTypeFilterChange={handleTypeFilterChange}
                                onPartnerFilterChange={handlePartnerFilterChange}
                                onClearFilters={handleClearFilters}
                                className="xl:shrink-0"
                            />
                        </div>
                    </div>
                </div>
            </section>

            <div className="fixed right-4 bottom-20 z-40 overflow-hidden rounded-2xl border border-border bg-card/95 shadow-[0_14px_32px_rgba(0,0,0,0.24)] backdrop-blur lg:right-6 lg:bottom-6 lg:rounded-xl lg:border-0 lg:bg-transparent lg:shadow-none lg:backdrop-blur-none">
                <button
                    type="button"
                    onClick={handleScrollToTop}
                    className="flex h-12 w-12 cursor-pointer items-center justify-center text-text-muted transition hover:bg-card-hover hover:text-primary active:scale-95 lg:h-10 lg:w-10 lg:rounded-xl lg:border lg:border-border lg:bg-card/95 lg:shadow-[0_10px_24px_rgba(0,0,0,0.18)] lg:backdrop-blur lg:hover:border-primary/40"
                    aria-label="맨 위로 이동"
                >
                    <ChevronUp className="h-5 w-5" />
                </button>
                <div className="mx-2 h-px bg-border/80 lg:hidden" />
                <button
                    type="button"
                    onClick={() => setShowRegisterModal(true)}
                    className="flex h-12 w-12 cursor-pointer items-center justify-center bg-primary/95 text-bg transition hover:bg-primary-dim active:scale-95 lg:hidden"
                    aria-label="스트리머 등록"
                >
                    <Plus className="h-5 w-5" />
                </button>
            </div>

            {renderResults()}

            {showRegisterModal && (
                <RegisterModal pending={registerMutation.isPending} onClose={() => setShowRegisterModal(false)} onSubmit={handleRegister} />
            )}

            {selectedStreamer !== null && (
                <StreamerDetailOverlay
                    streamer={selectedStreamer}
                    allAffiliations={affiliationsData ?? []}
                    pendingSave={updateMutation.isPending}
                    onClose={handleOverlayClose}
                    onSave={handleOverlaySave}
                />
            )}

            <AlertDialog open={!!deleteTarget} onOpenChange={(open: boolean) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>스트리머 삭제</AlertDialogTitle>
                        <AlertDialogDescription>
                            "{deleteTarget?.name}" 스트리머를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="cursor-pointer">취소</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} className="cursor-pointer bg-live text-text hover:bg-live/80">
                            삭제
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

interface ResultsPanelProps {
    children: ReactNode
    total: number
    currentPage: number
    totalPages: number
    onPageChange?: (page: number) => void
}

function ResultsPanel({ children, total, currentPage, totalPages, onPageChange }: ResultsPanelProps) {
    const showPagination = onPageChange !== undefined && totalPages > 1
    const startItem = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
    const endItem = Math.min(currentPage * PAGE_SIZE, total)

    return (
        <section className="overflow-hidden rounded-3xl border border-border bg-bg-secondary/70 shadow-card">
            <div className="flex flex-col gap-2 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-dim">Results Panel</p>
                    <h2 className="mt-1 text-base font-bold text-text">스트리머 목록</h2>
                </div>
                <p className="text-sm text-text-muted">
                    <span className="font-semibold tabular-nums text-text">{total.toLocaleString('ko-KR')}</span>명 중{' '}
                    <span className="font-semibold tabular-nums text-primary">
                        {startItem}-{endItem}
                    </span>
                    명 표시
                </p>
            </div>

            <div className="p-3 sm:p-4">{children}</div>

            {showPagination && (
                <div className="flex justify-end border-t border-border bg-card/60 px-4 py-3">
                    <div className="flex items-center justify-between gap-2 sm:justify-end">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="cursor-pointer gap-1 rounded-xl border-border bg-bg-secondary text-text-muted hover:bg-card-hover hover:text-text"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            이전
                        </Button>
                        <span className="min-w-16 rounded-xl bg-bg-secondary px-3 py-1.5 text-center text-sm font-semibold text-text">
                            {currentPage} / {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="cursor-pointer gap-1 rounded-xl border-border bg-bg-secondary text-text-muted hover:bg-card-hover hover:text-text"
                        >
                            다음
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </section>
    )
}

function StreamerLoadingState() {
    return (
        <div className="overflow-hidden rounded-3xl border border-border bg-card p-4 shadow-card">
            <div className="space-y-4">
                {Array.from({ length: 5 }, (_, index) => (
                    <div key={index} className="flex animate-pulse items-center gap-4 rounded-2xl bg-bg-secondary/60 p-3">
                        <div className="h-12 w-12 shrink-0 rounded-2xl bg-card-hover" />
                        <div className="min-w-0 flex-1 space-y-2">
                            <div className="h-3.5 w-2/5 rounded bg-card-hover" />
                            <div className="h-3 w-3/5 rounded bg-card-hover" />
                        </div>
                        <div className="hidden h-8 w-24 rounded-xl bg-card-hover sm:block" />
                    </div>
                ))}
            </div>
        </div>
    )
}

function StreamerErrorState({ onRetry }: { onRetry: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-card px-6 py-16 text-center shadow-card">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-live/30 bg-live/10 text-live">
                <AlertTriangle className="h-7 w-7" />
            </div>
            <h3 className="mt-5 text-lg font-bold text-text">목록을 불러오지 못했습니다</h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-text-muted">
                Go 어드민 스트리머 API 연결 상태를 확인한 뒤 다시 시도해주세요.
            </p>
            <Button onClick={onRetry} className="mt-5 rounded-xl bg-primary font-semibold text-bg hover:bg-primary-dim">
                <RefreshCw className="h-4 w-4" />
                다시 시도
            </Button>
        </div>
    )
}

function StreamerEmptyState({
    hasActiveCriteria,
    onReset,
    onRegister,
}: {
    hasActiveCriteria: boolean
    onReset: () => void
    onRegister: () => void
}) {
    return (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-card px-6 py-16 text-center shadow-card">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-bg-secondary text-text-muted">
                <Database className="h-7 w-7" />
            </div>
            <h3 className="mt-5 text-lg font-bold text-text">
                {hasActiveCriteria ? '조건에 맞는 스트리머가 없습니다' : '아직 등록된 스트리머가 없습니다'}
            </h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-text-muted">
                {hasActiveCriteria
                    ? '검색어나 필터를 조정하면 다른 운영 대상을 확인할 수 있습니다.'
                    : '치지직 채널 ID를 등록하면 이 화면에서 검색, 정렬, 상세 수정을 시작할 수 있습니다.'}
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                {hasActiveCriteria ? (
                    <Button
                        variant="outline"
                        onClick={onReset}
                        className="rounded-xl border-border bg-bg-secondary text-text-muted hover:bg-card-hover hover:text-text"
                    >
                        조건 초기화
                    </Button>
                ) : (
                    <Button onClick={onRegister} className="rounded-xl bg-primary font-semibold text-bg hover:bg-primary-dim">
                        <Plus className="h-4 w-4" />
                        스트리머 등록
                    </Button>
                )}
            </div>
        </div>
    )
}
