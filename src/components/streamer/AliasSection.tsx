import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import {
    useAdminToast,
    useCreateStreamerAlias,
    useDeleteStreamerAlias,
} from '../../hooks'
import { useStreamerDetail } from '../../hooks/useStreamers'
import { getErrorMessage } from '../../utils/error'

interface AliasSectionProps {
    streamerId: number
    onPendingChange?: (pending: boolean) => void
}

const inputClass = 'flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-text outline-none transition placeholder:text-text-dim hover:border-text-dim/50 focus:border-text-dim/50 disabled:opacity-50'

export function AliasSection({ streamerId, onPendingChange }: AliasSectionProps) {
    const { addToast } = useAdminToast()
    const { data: detail, isLoading } = useStreamerDetail(streamerId)
    const aliases = detail?.aliases ?? []
    const createMutation = useCreateStreamerAlias()
    const deleteMutation = useDeleteStreamerAlias()
    const [input, setInput] = useState('')

    const isPending = createMutation.isPending || deleteMutation.isPending

    useEffect(() => {
        onPendingChange?.(isPending)
    }, [isPending, onPendingChange])

    useEffect(() => {
        setInput('')
    }, [streamerId])

    async function handleAdd(): Promise<void> {
        if (createMutation.isPending) return
        const alias = input.trim()
        if (alias.length === 0) return
        if (aliases.some((a) => a.alias.toLowerCase() === alias.toLowerCase())) {
            addToast({ message: '이미 등록된 별명입니다.', variant: 'error' })
            return
        }
        try {
            await createMutation.mutateAsync({ streamerId, alias })
            addToast({ message: '별명을 추가했습니다.', variant: 'success' })
            setInput('')
        } catch (error) {
            const message = getErrorMessage(error)
            if (message !== null) addToast({ message, variant: 'error' })
        }
    }

    async function handleDelete(aliasId: number): Promise<void> {
        try {
            await deleteMutation.mutateAsync({ streamerId, aliasId })
            addToast({ message: '별명을 삭제했습니다.', variant: 'success' })
        } catch (error) {
            const message = getErrorMessage(error)
            if (message !== null) addToast({ message, variant: 'error' })
        }
    }

    return (
        <div className="space-y-3">
            <p className="text-[11px] text-text-dim">
                라이브 크롤러가 합방 감지 시 식별할 추가 이름입니다.
            </p>

            {isLoading ? (
                <div className="flex flex-wrap gap-1.5">
                    {[0, 1, 2].map((i) => (
                        <span key={i} className="h-6 w-16 animate-pulse rounded-full bg-card-hover" />
                    ))}
                </div>
            ) : aliases.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                    {aliases.map((a) => (
                        <span
                            key={a.id}
                            className="inline-flex items-center gap-1 rounded-full border border-border bg-card-hover px-2.5 py-1 text-xs font-medium text-text-muted"
                        >
                            {a.alias}
                            <button
                                type="button"
                                onClick={() => { void handleDelete(a.id) }}
                                disabled={isPending}
                                className="cursor-pointer ml-0.5 rounded-full p-0.5 text-text-dim transition hover:text-text-muted disabled:opacity-50"
                                aria-label={`${a.alias} 삭제`}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    ))}
                </div>
            ) : (
                <p className="text-xs text-text-dim">등록된 별명이 없습니다.</p>
            )}

            <div className="flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                            e.preventDefault()
                            void handleAdd()
                        }
                    }}
                    placeholder="새 별명 입력 후 Enter"
                    maxLength={100}
                    disabled={isPending}
                    className={inputClass}
                />
                <button
                    type="button"
                    onClick={() => { void handleAdd() }}
                    disabled={isPending || input.trim().length === 0}
                    className="cursor-pointer shrink-0 rounded-lg border border-border px-3 py-2 text-xs font-medium text-text-muted transition hover:bg-card disabled:opacity-50"
                >
                    추가
                </button>
            </div>
        </div>
    )
}
