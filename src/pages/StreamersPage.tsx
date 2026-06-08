import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react'

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
import { ListError, ListLoading } from '@/components/ListState'
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

    const { data, isLoading, isError, refetch } = useStreamers({
        type: typeFilter !== 'all' ? typeFilter as StreamerType : undefined,
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

    const handleSearchChange = (value: string) => {
        setSearchQuery(value)
        setTimeout(() => {
            setDebouncedSearch(value)
            setCurrentPage(1)
        }, 300)
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

    return (
        <div className="space-y-4 p-4 sm:space-y-6 sm:p-6">
            <div>
                <h1 className="text-xl font-bold text-text sm:text-2xl">스트리머 관리</h1>
                <p className="mt-1 text-sm text-text-muted">
                    등록된 스트리머를 관리합니다
                </p>
            </div>

            <StreamerStats stats={stats} isLoading={isLoading} />

            <div className="space-y-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        placeholder="이름, 닉네임, 채널 ID로 검색..."
                        className="h-11 rounded-xl pl-10"
                    />
                </div>
                <div className="flex items-start justify-between gap-3">
                    <StreamerFilters
                        typeFilter={typeFilter}
                        partnerFilter={partnerFilter}
                        onTypeFilterChange={handleTypeFilterChange}
                        onPartnerFilterChange={handlePartnerFilterChange}
                        onClearFilters={handleClearFilters}
                    />
                    <Button variant="outline" onClick={() => setShowRegisterModal(true)} className="hidden shrink-0 cursor-pointer lg:inline-flex">
                        <Plus className="h-4 w-4" />
                        스트리머 등록
                    </Button>
                </div>
            </div>

            <button
                type="button"
                onClick={() => setShowRegisterModal(true)}
                className="fixed right-4 bottom-20 z-40 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-text shadow-lg transition-transform hover:scale-105 active:scale-95 lg:hidden"
            >
                <Plus className="h-6 w-6" />
            </button>

            {isLoading ? (
                <ListLoading />
            ) : isError ? (
                <ListError onRetry={refetch} />
            ) : streamers.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-12">
                    <div className="rounded-full bg-card-hover p-4">
                        <Search className="h-8 w-8 text-text-muted" />
                    </div>
                    <p className="mt-4 font-medium text-text">
                        {searchQuery ? '검색 결과가 없습니다' : '등록된 스트리머가 없습니다'}
                    </p>
                    <p className="mt-1 text-sm text-text-muted">
                        {searchQuery ? '다른 검색어로 시도해보세요' : '새 스트리머를 등록해주세요'}
                    </p>
                </div>
            ) : (
                <>
                    <StreamerTable
                        streamers={streamers}
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSortChange={handleSortChange}
                        onDelete={handleDeleteClick}
                        onRefresh={handleRefresh}
                        onCopyChannelId={handleCopyChannelId}
                        onRowClick={handleRowClick}
                    />

                    {totalPages > 1 && (
                        <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                            <p className="text-sm text-text-muted">
                                <span className="font-medium text-text">{total}</span>명 중{' '}
                                <span className="font-medium text-text">
                                    {(currentPage - 1) * PAGE_SIZE + 1}-
                                    {Math.min(currentPage * PAGE_SIZE, total)}
                                </span>
                                명 표시
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="cursor-pointer gap-1"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    <span className="hidden sm:inline">이전</span>
                                </Button>
                                <span className="min-w-[60px] text-center text-sm font-medium text-text">
                                    {currentPage} / {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="cursor-pointer gap-1"
                                >
                                    <span className="hidden sm:inline">다음</span>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {showRegisterModal && (
                <RegisterModal
                    pending={registerMutation.isPending}
                    onClose={() => setShowRegisterModal(false)}
                    onSubmit={handleRegister}
                />
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
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="cursor-pointer bg-red-500 hover:bg-red-600"
                        >
                            삭제
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
