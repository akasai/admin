import { useState } from 'react'
import dayjs from 'dayjs'
import { Info, X } from 'lucide-react'
import { useAdminToast, useDeleteStaging, usePromoteStaging, useStaging, useStreamers, useUpdateStaging } from '../hooks'
import type { StagingItem, UpdateStagingRequest } from '../types'
import { getErrorMessage } from '../utils/error'
import { cn } from '../lib/cn'
import { panelClass } from '../constants/styles'
import { ConfirmModal } from '../components/ConfirmModal'
import { ListEmpty, ListError, ListLoading } from '../components/ListState'
import { StagingEditModal } from '../components/staging/StagingEditModal'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'] as const

function formatEventDate(dateStr: string): string {
    const d = dayjs(dateStr)
    if (!d.isValid()) return '-'
    return `${d.format('M')}월 ${d.format('D')}일 (${DAY_NAMES[d.day()]})`
}

function formatTime(timeStr: string | null): string | null {
    if (timeStr == null || timeStr.trim().length === 0) return null
    const d = dayjs(timeStr)
    if (d.isValid()) return d.format('HH:mm')
    const match = timeStr.match(/(\d{2}):(\d{2})/)
    return match != null ? `${match[1]}:${match[2]}` : null
}

function getCategoryLabel(category: string | null): string | null {
    if (category == null) return null
    const trimmed = category.trim()
    return trimmed.length > 0 ? trimmed : null
}

function ColumnGuideModal({ onClose }: { onClose: () => void }) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose()
            }}
        >
            <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#3a3a44] bg-[#1a1a23] shadow-xl">
                <div className="flex items-center justify-between border-b border-[#3a3a44] px-5 py-3.5">
                    <h3 className="text-sm font-bold text-[#efeff1]">컬럼 설명</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="cursor-pointer rounded-lg border border-[#3a3a44] p-1.5 text-[#adadb8] transition hover:bg-[#26262e]"
                        aria-label="닫기"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
                <div className="space-y-4 px-5 py-4 text-xs leading-relaxed text-[#adadb8]">
                    <div>
                        <span className="font-semibold text-[#efeff1]">확신도</span>
                        <p className="mt-1">크롤러가 해당 일정의 정확도를 판단한 수치입니다. 100%에 가까울수록 신뢰도가 높습니다.</p>
                    </div>
                    <div>
                        <span className="font-semibold text-[#efeff1]">관측</span>
                        <p className="mt-1">동일한 일정이 크롤링에서 몇 회 관측되었는지를 나타냅니다. 횟수가 많을수록 확실한 일정입니다.</p>
                    </div>

                    <div>
                        <span className="font-semibold text-[#efeff1]">참여자</span>
                        <p className="mt-1">
                            <span className="text-emerald-300">초록</span> = 전원 등록 완료,{' '}
                            <span className="text-amber-300">주황</span> = 미등록 참여자 있음. 숫자는 [등록/전체] 형식입니다.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function StagingManagePage() {
    const { addToast } = useAdminToast()

    const [showGuide, setShowGuide] = useState(false)
    const [viewingItem, setViewingItem] = useState<StagingItem | null>(null)
    const [editingItem, setEditingItem] = useState<StagingItem | null>(null)
    const [promotingItem, setPromotingItem] = useState<StagingItem | null>(null)
    const [deletingItem, setDeletingItem] = useState<StagingItem | null>(null)

    const { data, isLoading, isError, refetch } = useStaging()
    const { data: streamersData } = useStreamers({ size: 1000 })
    const streamers = streamersData?.items ?? []

    const updateMutation = useUpdateStaging()
    const promoteMutation = usePromoteStaging()
    const deleteMutation = useDeleteStaging()

    async function handleUpdate(body: UpdateStagingRequest): Promise<void> {
        if (editingItem === null) return
        try {
            await updateMutation.mutateAsync({ id: editingItem.id, body })
            addToast({ message: '스테이징 항목이 수정되었습니다.', variant: 'success' })
            setEditingItem(null)
        } catch (error) {
            const message = getErrorMessage(error)
            addToast({ message, variant: 'error' })
            throw error
        }
    }

    async function handlePromote(): Promise<void> {
        if (promotingItem === null) return
        try {
            await promoteMutation.mutateAsync(promotingItem.id)
            addToast({ message: '방송 일정으로 승격되었습니다.', variant: 'success' })
            setPromotingItem(null)
        } catch (error) {
            const message = getErrorMessage(error)
            addToast({ message, variant: 'error' })
        }
    }

    async function handleDelete(): Promise<void> {
        if (deletingItem === null) return
        try {
            await deleteMutation.mutateAsync(deletingItem.id)
            addToast({ message: '스테이징 항목이 삭제되었습니다.', variant: 'success' })
            setDeletingItem(null)
        } catch (error) {
            const message = getErrorMessage(error)
            addToast({ message, variant: 'error' })
        }
    }

    return (
        <>
            <div className="mb-6 flex items-start justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-[#efeff1]">스테이징 관리</h1>
                    <p className="mt-1 text-sm text-[#adadb8]">크롤링된 방송 후보를 검토하고 승격합니다</p>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowGuide(true)}
                    className="rounded-lg border-[#3a3a44] bg-[#26262e] text-[#848494] hover:bg-[#32323d] hover:text-[#adadb8]"
                    aria-label="컬럼 설명"
                    title="컬럼 설명"
                >
                    <Info className="h-4 w-4" />
                </Button>
            </div>



            {isLoading && <ListLoading className="py-24" />}
            {isError && (
                <ListError
                    message="스테이징 목록을 불러오는 중 오류가 발생했습니다."
                    className="py-24"
                    onRetry={() => {
                        void refetch()
                    }}
                />
            )}
            {!isLoading && !isError && (data === undefined || data.length === 0) && (
                <ListEmpty message="스테이징된 일정이 없습니다." className="py-24" />
            )}

            {!isLoading && !isError && data !== undefined && data.length > 0 && (
                <>
                    <div className="space-y-3 md:hidden">
                        {data.map((item) => (
                            <StagingMobileCard
                                key={item.id}
                                item={item}
                                onOpen={() => setViewingItem(item)}
                                onPromote={() => setPromotingItem(item)}
                                onDelete={() => setDeletingItem(item)}
                            />
                        ))}
                    </div>

                    <div className={cn(panelClass, 'hidden overflow-hidden md:block')}>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#3a3a44] text-xs font-semibold text-[#848494]">
                                    <th className="whitespace-nowrap border-r border-[#2a2a34] px-4 py-3 text-center">날짜</th>
                                    <th className="whitespace-nowrap border-r border-[#2a2a34] px-4 py-3 text-center">제목</th>
                                    <th className="whitespace-nowrap border-r border-[#2a2a34] px-4 py-3 text-center">참여자</th>
                                    <th className="whitespace-nowrap border-r border-[#2a2a34] px-4 py-3 text-center">확신도 / 관측</th>
                                    <th className="whitespace-nowrap px-4 py-3 text-center">액션</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item) => (
                                    <StagingRow
                                        key={item.id}
                                        item={item}
                                        onOpen={() => setViewingItem(item)}
                                        onPromote={() => setPromotingItem(item)}
                                        onDelete={() => setDeletingItem(item)}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {viewingItem !== null && (
                <StagingEditModal
                    item={viewingItem}
                    streamers={streamers}
                    pending={false}
                    readOnly
                    onClose={() => setViewingItem(null)}
                    onSubmit={async () => {}}
                />
            )}

            {editingItem !== null && (
                <StagingEditModal
                    item={editingItem}
                    streamers={streamers}
                    pending={updateMutation.isPending}
                    onClose={() => setEditingItem(null)}
                    onSubmit={handleUpdate}
                />
            )}

            {promotingItem !== null && (
                <ConfirmModal
                    title="방송 일정 승격"
                    message="방송 일정으로 승격하시겠습니까?"
                    itemName={promotingItem.title ?? `스테이징 #${promotingItem.id}`}
                    confirmLabel="승격"
                    pendingLabel="승격 중..."
                    pending={promoteMutation.isPending}
                    onClose={() => setPromotingItem(null)}
                    onConfirm={() => {
                        void handlePromote()
                    }}
                />
            )}

            {deletingItem !== null && (
                <ConfirmModal
                    title="스테이징 삭제"
                    message="스테이징 항목을 삭제하시겠습니까?"
                    itemName={deletingItem.title ?? `스테이징 #${deletingItem.id}`}
                    pending={deleteMutation.isPending}
                    onClose={() => setDeletingItem(null)}
                    onConfirm={() => {
                        void handleDelete()
                    }}
                />
            )}

            {showGuide && <ColumnGuideModal onClose={() => setShowGuide(false)} />}
        </>
    )
}

interface StagingRowProps {
    item: StagingItem
    onOpen: () => void
    onPromote: () => void
    onDelete: () => void
}

interface StagingActionButtonsProps {
    onPromote: () => void
    onDelete: () => void
    centered?: boolean
    stacked?: boolean
}

function ParticipantSyncBadge({ item }: { item: StagingItem }) {
    const participants = item.participants ?? []
    const total = participants.length
    const synced = participants.filter((p) => p.synced).length
    const allSynced = total > 0 && synced === total

    if (total === 0) {
        return <span className="text-xs text-[#848494]">-</span>
    }

    return (
        <Badge
            size="md"
            className={cn(
                'whitespace-nowrap rounded-full tabular-nums',
                allSynced
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                    : 'border-amber-500/40 bg-amber-500/10 text-amber-300',
            )}
        >
            {synced}/{total}
        </Badge>
    )
}

function StagingActionButtons({ onPromote, onDelete, centered = false, stacked = false }: StagingActionButtonsProps) {
    return (
        <div
            className={cn(
                stacked ? 'grid grid-cols-2 gap-2' : 'flex items-center gap-1',
                !stacked && (centered ? 'flex-wrap justify-center' : 'justify-end'),
            )}
        >
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(event) => {
                    event.stopPropagation()
                    onPromote()
                }}
                className={cn(
                    'whitespace-nowrap rounded-lg border-blue-500/40 bg-blue-500/10 text-xs font-semibold text-blue-300 hover:bg-blue-500/20 hover:text-blue-300',
                    stacked && 'w-full',
                )}
            >
                승격
            </Button>
            <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={(event) => {
                    event.stopPropagation()
                    onDelete()
                }}
                className={cn(
                    'whitespace-nowrap rounded-lg border-red-500/30 bg-red-500/5 text-xs font-semibold text-red-300 hover:bg-red-500/15 hover:text-red-300',
                    stacked && 'w-full',
                )}
            >
                삭제
            </Button>
        </div>
    )
}

function StagingMobileCard({ item, onOpen, onPromote, onDelete }: StagingRowProps) {
    const categoryLabel = getCategoryLabel(item.category)

    return (
        <button
            type="button"
            onClick={onOpen}
            className="w-full rounded-2xl border border-[#3a3a44] bg-[#1f1f28] p-4 text-left transition hover:bg-[#242430]"
        >
            <div className="space-y-3">
                <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <p className="break-words text-base font-semibold leading-5 text-[#efeff1]">
                                {item.title ?? '미정'}
                            </p>
                        </div>
                        <div className="shrink-0 pt-0.5">
                            <ParticipantSyncBadge item={item} />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#adadb8]">
                        <span className="font-medium text-[#d5d5dd]">{formatEventDate(item.event_date_kst)}</span>
                        {formatTime(item.start_time) != null && <span className="text-[#848494]">· {formatTime(item.start_time)}</span>}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                        {categoryLabel !== null && (
                            <span className="rounded-full border border-[#3a3a44] bg-[#181821] px-2.5 py-1 text-[#adadb8]">
                                {categoryLabel}
                            </span>
                        )}
                        <span className="text-[#848494]">신뢰 {Math.round(item.confidence * 100)}%</span>
                        <span className="text-[#848494]">관측 {item.observation_count}회</span>
                    </div>
                </div>

                <div className="border-t border-[#2a2a34] pt-3">
                    <StagingActionButtons stacked onPromote={onPromote} onDelete={onDelete} />
                </div>
            </div>
        </button>
    )
}

function StagingRow({ item, onOpen, onPromote, onDelete }: StagingRowProps) {
    const categoryLabel = getCategoryLabel(item.category)

    return (
        <tr
            className="cursor-pointer border-b border-[#3a3a44] transition hover:bg-[#20202a]"
            onClick={onOpen}
        >
            <td className="whitespace-nowrap border-r border-[#2a2a34] px-4 py-3 text-center text-xs tabular-nums">
                <span className="block text-[#adadb8]">{formatEventDate(item.event_date_kst)}</span>
                {formatTime(item.start_time) != null && (
                    <span className="mt-0.5 block text-[#848494]">{formatTime(item.start_time)}</span>
                )}
            </td>
            <td className="whitespace-nowrap border-r border-[#2a2a34] px-4 py-3">
                <span className="block whitespace-nowrap truncate font-medium text-[#efeff1]">
                    {item.title ?? <span className="text-[#848494]">미정</span>}
                </span>
                {categoryLabel !== null && (
                    <span className="mt-0.5 block whitespace-nowrap truncate text-[11px] text-[#848494]">{categoryLabel}</span>
                )}
            </td>
            <td className="border-r border-[#2a2a34] px-4 py-3 text-center">
                <ParticipantSyncBadge item={item} />
            </td>
            <td className="whitespace-nowrap border-r border-[#2a2a34] px-4 py-3 text-center text-xs tabular-nums text-[#adadb8]">
                {Math.round(item.confidence * 100)}% ({item.observation_count})
            </td>
            <td className="px-4 py-3 text-center">
                <StagingActionButtons centered onPromote={onPromote} onDelete={onDelete} />
            </td>
        </tr>
    )
}
