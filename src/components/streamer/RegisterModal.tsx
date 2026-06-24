import { useState } from 'react'
import { AlertCircle, Radio } from 'lucide-react'

import { Button } from '@/components/shadcn/ui/button'
import { Input } from '@/components/shadcn/ui/input'
import { ModalOverlay } from '../ModalOverlay'
import { normalizeInput } from '../../utils/format'

interface RegisterModalProps {
    pending: boolean
    onClose: () => void
    onSubmit: (channelId: string) => Promise<void>
}

export function RegisterModal({ pending, onClose, onSubmit }: RegisterModalProps) {
    const [channelId, setChannelId] = useState('')
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(): Promise<void> {
        const value = normalizeInput(channelId)
        if (value.length === 0) {
            setError('채널 ID를 입력해주세요.')
            return
        }

        setError(null)
        await onSubmit(value)
    }

    return (
        <ModalOverlay size="md" disabled={pending} onClose={onClose}>
            <form
                onSubmit={(event) => {
                    event.preventDefault()
                    void handleSubmit()
                }}
            >
                <div className="border-b border-border bg-bg-secondary/70 px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
                            <Radio className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-text">스트리머 등록</h2>
                            <p className="mt-1 text-xs text-text-muted">치지직 채널 ID로 프로필을 조회해 목록에 추가합니다.</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-3 px-6 py-5">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-text-muted">
                            채널 ID <span className="text-live">*</span>
                        </label>
                        <Input
                            type="text"
                            value={channelId}
                            onChange={(event) => setChannelId(event.target.value)}
                            placeholder="예: 1f2e3d4c5b"
                            className="h-11 rounded-xl border-border bg-card-hover font-mono text-sm"
                            autoFocus
                        />
                    </div>
                    {error !== null && (
                        <p className="flex items-center gap-1.5 text-xs font-medium text-live">
                            <AlertCircle className="h-3.5 w-3.5" />
                            {error}
                        </p>
                    )}
                    <p className="rounded-2xl border border-border bg-bg-secondary px-3 py-2 text-xs leading-relaxed text-text-muted">
                        등록 성공 시 현재 검색과 필터 조건을 유지한 채 목록 데이터가 새로고침됩니다.
                    </p>
                </div>

                <div className="flex gap-2 border-t border-border bg-bg-secondary/70 px-6 py-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={pending}
                        className="flex-1 rounded-xl border-border bg-card text-text-muted hover:bg-card-hover hover:text-text"
                    >
                        취소
                    </Button>
                    <Button
                        type="submit"
                        disabled={pending}
                        className="flex-1 rounded-xl bg-primary font-semibold text-bg hover:bg-primary-dim"
                    >
                        {pending ? '등록 중...' : '등록'}
                    </Button>
                </div>
            </form>
        </ModalOverlay>
    )
}
