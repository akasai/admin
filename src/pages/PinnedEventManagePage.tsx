import { useState } from 'react'
import dayjs from 'dayjs'
import { Check, Pencil, Pin, Plus, Trash2, X } from 'lucide-react'
import { useAdminToast, usePinnedEvents, useUpdatePinnedEvent, useDeletePinnedEvent } from '../hooks'
import type { PinnedEventItem, UpdatePinnedEventRequest } from '../types'
import { getErrorMessage } from '../utils/error'
import { cn } from '../lib/cn'
import { panelClass } from '../constants/styles'
import { ListEmpty, ListError, ListLoading } from '../components/ListState'
import { ConfirmModal } from '../components/ConfirmModal'
import { PinnedEventFormModal } from '../components/pinned-event/PinnedEventFormModal'

export default function PinnedEventManagePage() {
    const { addToast } = useAdminToast()
    const { data: events = [], isLoading, isError, refetch } = usePinnedEvents()
    const updateMutation = useUpdatePinnedEvent()
    const deleteMutation = useDeletePinnedEvent()

    const [creating, setCreating] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [deletingItem, setDeletingItem] = useState<PinnedEventItem | null>(null)
    const [activeOverrides, setActiveOverrides] = useState<Record<number, boolean>>({})
    const [pendingToggleIds, setPendingToggleIds] = useState<number[]>([])

    async function handleToggleActive(item: PinnedEventItem): Promise<void> {
        const currentValue = activeOverrides[item.id] ?? item.isActive
        const nextValue = !currentValue

        setActiveOverrides((prev) => ({ ...prev, [item.id]: nextValue }))
        setPendingToggleIds((prev) => [...prev, item.id])

        try {
            const body: UpdatePinnedEventRequest = { isActive: nextValue }
            await updateMutation.mutateAsync({ id: item.id, body })
            addToast({ message: `이벤트 상태를 ${nextValue ? '활성' : '비활성'}으로 변경했습니다.`, variant: 'success' })
        } catch (error) {
            setActiveOverrides((prev) => ({ ...prev, [item.id]: currentValue }))
            const message = getErrorMessage(error)
            if (message !== null) addToast({ message, variant: 'error' })
        } finally {
            setPendingToggleIds((prev) => prev.filter((id) => id !== item.id))
        }
    }

    async function handleDelete(): Promise<void> {
        if (deletingItem === null) return
        try {
            await deleteMutation.mutateAsync(deletingItem.id)
            addToast({ message: '고정 일정이 삭제되었습니다.', variant: 'success' })
            setDeletingItem(null)
        } catch (error) {
            const message = getErrorMessage(error)
            if (message !== null) addToast({ message, variant: 'error' })
        }
    }

    return (
        <>
            <div className="mb-6 flex items-start justify-between gap-3">
                <div>
                    <h1 className="flex items-center gap-2 text-xl font-bold text-[#efeff1]">
                        <Pin className="h-5 w-5" />
                        고정 일정 관리
                    </h1>
                    <p className="mt-1 text-sm text-[#adadb8]">고정 일정 이벤트를 관리합니다</p>
                </div>
                <button
                    type="button"
                    onClick={() => setCreating(true)}
                    className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
                >
                    <Plus className="h-4 w-4" />
                    이벤트 추가
                </button>
            </div>

            <div className={panelClass}>
                <div className="grid grid-cols-[minmax(0,2fr)_90px_90px_120px_110px] items-center gap-3 border-b border-[#3a3a44] px-4 py-3 text-center text-xs font-semibold text-[#848494]">
                    <div className="text-left">이름</div>
                    <div>상태</div>
                    <div>방송 수</div>
                    <div>생성일</div>
                    <div>작업</div>
                </div>

                {isLoading && <ListLoading />}
                {isError && <ListError message="고정 일정을 불러오는 중 오류가 발생했습니다." onRetry={() => { void refetch() }} />}
                {!isLoading && !isError && events.length === 0 && <ListEmpty message="등록된 고정 일정이 없습니다." />}

                {!isLoading && !isError && events.length > 0 && (
                    <ul className="divide-y divide-[#3a3a44]">
                        {events.map((item) => {
                            const isActive = activeOverrides[item.id] ?? item.isActive
                            const isTogglePending = pendingToggleIds.includes(item.id)

                            return (
                                <li
                                    key={item.id}
                                    className="grid grid-cols-[minmax(0,2fr)_90px_90px_120px_110px] items-center gap-3 px-4 py-3"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-[#efeff1]">{item.name}</p>
                                    </div>

                                    <div className="flex justify-center">
                                        <button
                                            type="button"
                                            onClick={() => { void handleToggleActive(item) }}
                                            disabled={isTogglePending}
                                            className={cn(
                                                'cursor-pointer inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
                                                isActive
                                                    ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                                                    : 'border-[#4a4a58] bg-[#2a2a34] text-[#adadb8]',
                                            )}
                                        >
                                            {isActive ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                            {isActive ? '활성' : '비활성'}
                                        </button>
                                    </div>

                                    <div className="text-center text-sm text-[#adadb8]">
                                        {item.broadcastCount}
                                    </div>

                                    <div className="text-center text-xs text-[#848494]">
                                        {dayjs(item.createdAt).format('YYYY-MM-DD')}
                                    </div>

                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setEditingId(item.id)}
                                            className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-[#3a3a44] p-1.5 text-[#adadb8] transition hover:bg-[#26262e]"
                                            aria-label="이벤트 수정"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDeletingItem(item)}
                                            className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-red-500/35 p-1.5 text-red-300 transition hover:bg-red-500/10"
                                            aria-label="이벤트 삭제"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </div>

            {creating && (
                <PinnedEventFormModal onClose={() => setCreating(false)} />
            )}

            {editingId !== null && (
                <PinnedEventFormModal eventId={editingId} onClose={() => setEditingId(null)} />
            )}

            {deletingItem !== null && (
                <ConfirmModal
                    title="이벤트 삭제"
                    message="이벤트를 삭제하시겠습니까?"
                    itemName={deletingItem.name}
                    pending={deleteMutation.isPending}
                    onClose={() => setDeletingItem(null)}
                    onConfirm={() => { void handleDelete() }}
                />
            )}
        </>
    )
}
