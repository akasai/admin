import { Check, RotateCcw, Search, Tag, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useCrawlerAliasAction, useCrawlerAliases } from '../../hooks/useCrawlerReviews'
import { useAdminToast } from '../../hooks/useAdminToast'
import { ApiError } from '../../lib/apiClient'
import { inputClass, selectClass } from '../../constants/styles'
import type { AliasActionRequest, CrawlerAliasAction, CrawlerAliasItem, CrawlerAliasStatus } from '../../types/crawlerReview'
import { ListEmpty, ListError, ListLoading } from '../ListState'
import { Button } from '../ui/Button'
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../shadcn/ui/alert-dialog'
import { createUuid } from '@/lib/uuid'

interface AliasWorkspaceProps {
    cursor?: string
    query: string
    status?: CrawlerAliasStatus
    onFilters: (changes: Record<string, string | null>) => void
    onCursor: (cursor: string | null) => void
    onConflict: (message: string) => void
}

const STATUS_LABELS: Record<CrawlerAliasStatus, string> = { PROPOSED: '판정 대기', ACTIVE: '활성', REJECTED: '거절', RETIRED: '은퇴' }
const ACTION_COPY: Record<CrawlerAliasAction, { title: string; description: string; confirm: string }> = {
    ACTIVATE: {
        title: '별칭을 활성화할까요?',
        description: '동일 플랫폼·범위·정규화 별칭이 다른 소유자와 충돌하면 활성화하지 않습니다.',
        confirm: '활성화',
    },
    REJECT: { title: '별칭 제안을 거절할까요?', description: '제안 상태와 결정이 별칭 작업 원장에 기록됩니다.', confirm: '거절' },
    RETIRE: { title: '활성 별칭을 은퇴할까요?', description: '향후 매칭에서는 사용하지 않으며 작업 원장은 유지됩니다.', confirm: '은퇴' },
    REACTIVATE: { title: '별칭을 다시 활성화할까요?', description: '현재 소유권 충돌을 다시 검사한 뒤 활성화합니다.', confirm: '재활성화' },
}

function AliasActions({ item, onAction }: { item: CrawlerAliasItem; onAction: (action: CrawlerAliasAction) => void }) {
    if (item.status === 'PROPOSED')
        return (
            <div className="flex gap-1">
                <Button type="button" size="sm" onClick={() => onAction('ACTIVATE')}>
                    활성화
                </Button>
                <Button type="button" size="sm" variant="destructive" onClick={() => onAction('REJECT')}>
                    거절
                </Button>
            </div>
        )
    if (item.status === 'ACTIVE')
        return (
            <Button type="button" size="sm" variant="ghost" onClick={() => onAction('RETIRE')}>
                은퇴
            </Button>
        )
    if (item.status === 'RETIRED' || item.status === 'REJECTED')
        return (
            <Button type="button" size="sm" variant="outline" onClick={() => onAction('REACTIVATE')}>
                재활성화
            </Button>
        )
    return null
}

export function AliasWorkspace({ cursor, query, status, onFilters, onCursor, onConflict }: AliasWorkspaceProps) {
    const aliases = useCrawlerAliases({ cursor, query: query || undefined, status })
    const mutation = useCrawlerAliasAction()
    const { addToast } = useAdminToast()
    const [draftQuery, setDraftQuery] = useState(query)
    const [selected, setSelected] = useState<CrawlerAliasItem | null>(null)
    const [action, setAction] = useState<CrawlerAliasAction | null>(null)
    const [note, setNote] = useState('')
    const [confirmedIntent, setConfirmedIntent] = useState<AliasActionRequest | null>(null)

    useEffect(() => setDraftQuery(query), [query])
    const open = selected !== null && action !== null

    function closeDialog() {
        setSelected(null)
        setAction(null)
        setNote('')
        setConfirmedIntent(null)
        mutation.reset()
    }

    function confirm() {
        if (selected === null || action === null) return
        const request = confirmedIntent ?? {
            action,
            expectedVersion: selected.version,
            idempotencyKey: createUuid(),
            reason: `ADMIN_ALIAS_REVIEW${note.trim().length > 0 ? `: ${note.trim()}` : ''}`,
        }
        setConfirmedIntent(request)
        mutation.mutate(
            { aliasId: selected.id, body: request },
            {
                onSuccess: () => {
                    addToast({ variant: 'success', message: '별칭 작업을 반영했습니다.' })
                    closeDialog()
                },
                onError: (error) => {
                    if (error instanceof ApiError && (error.code === 'CRAWLER_VERSION_CONFLICT' || error.status === 409)) {
                        void aliases.refetch()
                        closeDialog()
                        onConflict(
                            error.code === 'ALIAS_AMBIGUOUS'
                                ? '같은 정규화 별칭에 다른 소유자가 있어 활성화할 수 없습니다.'
                                : '별칭 버전이 변경되었습니다. 목록을 다시 확인하고 재확정해 주세요.',
                        )
                    }
                },
            },
        )
    }

    return (
        <section id="crawler-panel-aliases" role="tabpanel" aria-labelledby="crawler-tab-aliases" className="min-w-0 space-y-3">
            <div className="min-w-0 rounded-[var(--radius-card)] border border-border bg-bg-secondary p-3">
                <form
                    onSubmit={(event) => {
                        event.preventDefault()
                        onFilters({ query: draftQuery.trim(), aliasStatus: status ?? '' })
                    }}
                    className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_11rem_auto]"
                >
                    <label className="relative">
                        <span className="sr-only">현재 페이지 별칭 검색</span>
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim" />
                        <input
                            value={draftQuery}
                            onChange={(event) => setDraftQuery(event.target.value)}
                            className={`${inputClass} pl-9`}
                            placeholder="현재 페이지 별칭·소유자 검색"
                        />
                    </label>
                    <label>
                        <span className="sr-only">별칭 상태</span>
                        <select
                            value={status ?? ''}
                            onChange={(event) => onFilters({ query, aliasStatus: event.target.value })}
                            className={selectClass}
                        >
                            <option value="">모든 상태</option>
                            <option value="PROPOSED">판정 대기</option>
                            <option value="ACTIVE">활성</option>
                            <option value="REJECTED">거절</option>
                            <option value="RETIRED">은퇴</option>
                        </select>
                    </label>
                    <Button type="submit" leftIcon={<Search className="h-4 w-4" />}>
                        검색
                    </Button>
                </form>
            </div>
            <div className="min-w-0 overflow-hidden rounded-[var(--radius-card)] border border-border bg-bg-secondary">
                {aliases.isLoading ? (
                    <ListLoading rows={6} />
                ) : aliases.isError ? (
                    <ListError message="별칭 목록을 불러오지 못했습니다." onRetry={() => void aliases.refetch()} />
                ) : aliases.data?.items.length === 0 ? (
                    <ListEmpty message="조건에 맞는 별칭이 없습니다." />
                ) : (
                    <div className="divide-y divide-border">
                        {aliases.data?.items.map((item) => (
                            <article
                                key={item.id}
                                className="grid min-w-0 gap-3 p-3 md:grid-cols-[minmax(0,1fr)_minmax(10rem,0.6fr)_auto] md:items-center"
                            >
                                <div className="min-w-0">
                                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                                        <Tag className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                                        <strong className="min-w-0 break-words text-sm text-text">{item.alias}</strong>
                                        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-text-muted">
                                            {STATUS_LABELS[item.status]}
                                        </span>
                                    </div>
                                    <p className="mt-1 break-all font-mono text-[11px] text-text-dim">
                                        {item.platform ?? '공통'} / {item.scope} / {item.kind} / {item.normalizedAlias}
                                    </p>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-text-dim">정규 소유자</p>
                                    <p className="mt-1 break-words text-sm font-medium text-text">
                                        {item.streamer.displayName ?? `스트리머 #${item.streamer.id}`}{' '}
                                        <span className="break-all font-mono text-[10px] text-text-dim">#{item.streamer.id}</span>
                                    </p>
                                </div>
                                <AliasActions
                                    item={item}
                                    onAction={(nextAction) => {
                                        setSelected(item)
                                        setAction(nextAction)
                                    }}
                                />
                            </article>
                        ))}
                    </div>
                )}
                <div className="flex justify-between border-t border-border p-3">
                    <Button type="button" size="sm" variant="ghost" disabled={cursor === undefined} onClick={() => onCursor(null)}>
                        처음으로
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={aliases.data?.nextCursor === null || aliases.data?.nextCursor === undefined}
                        onClick={() => onCursor(aliases.data?.nextCursor ?? null)}
                    >
                        다음 페이지
                    </Button>
                </div>
            </div>

            {selected !== null && action !== null && (
                <AlertDialog
                    open={open}
                    onOpenChange={(nextOpen) => {
                        if (!nextOpen) closeDialog()
                    }}
                >
                    <AlertDialogContent className="max-w-[calc(100vw-1rem)] border-border bg-bg-secondary">
                        <AlertDialogHeader>
                            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-[var(--radius-input)] bg-primary/10 text-primary">
                                {action === 'REJECT' || action === 'RETIRE' ? (
                                    <Trash2 className="h-5 w-5" />
                                ) : action === 'REACTIVATE' ? (
                                    <RotateCcw className="h-5 w-5" />
                                ) : (
                                    <Check className="h-5 w-5" />
                                )}
                            </div>
                            <AlertDialogTitle>{ACTION_COPY[action].title}</AlertDialogTitle>
                            <AlertDialogDescription>{ACTION_COPY[action].description}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="min-w-0 rounded-[var(--radius-input)] border border-border bg-bg p-3 text-sm">
                            <strong className="break-words text-text">{selected.alias}</strong>
                            <span className="mx-2 text-text-dim">→</span>
                            <span className="break-words text-text-muted">
                                {selected.streamer.displayName ?? `스트리머 #${selected.streamer.id}`}
                            </span>
                        </div>
                        <label>
                            <span className="mb-1 block text-xs font-semibold text-text-muted">
                                메모 <span className="font-normal text-text-dim">(선택)</span>
                            </span>
                            <textarea
                                value={note}
                                onChange={(event) => {
                                    setNote(event.target.value)
                                    setConfirmedIntent(null)
                                    mutation.reset()
                                }}
                                rows={3}
                                maxLength={500}
                                className={`${inputClass} h-auto`}
                            />
                        </label>
                        {mutation.isError && (
                            <p
                                role="alert"
                                className="rounded-[var(--radius-input)] border border-live/40 bg-live/10 p-2 text-xs text-live"
                            >
                                <span className="font-semibold">작업 실패 · </span>
                                {mutation.error instanceof ApiError
                                    ? mutation.error.message
                                    : '네트워크 오류가 발생했습니다. 같은 요청 키로 재시도할 수 있습니다.'}
                            </p>
                        )}
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={mutation.isPending} className="border-border bg-transparent text-text-muted">
                                취소
                            </AlertDialogCancel>
                            <Button
                                type="button"
                                variant={action === 'REJECT' || action === 'RETIRE' ? 'destructive' : 'primary'}
                                loading={mutation.isPending}
                                onClick={confirm}
                            >
                                {confirmedIntent !== null && mutation.isError ? '같은 요청 재시도' : ACTION_COPY[action].confirm}
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </section>
    )
}
