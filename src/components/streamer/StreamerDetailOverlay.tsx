import React, { useEffect, useRef, useState } from 'react'
import { ExternalLink, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { useSidebarCollapsed } from '../AdminLayout'
import { useAdminToast } from '../../hooks/useAdminToast'
import { useAddStreamerAffiliation, useRemoveStreamerAffiliation, useStreamerDetail } from '../../hooks/useStreamers'
import { Avatar } from './Avatar'
import { AffiliationSectionDropdown } from './AffiliationSectionDropdown'
import { AliasSection } from './AliasSection'
import { formatFollowerCount, normalizeInput } from '../../utils/format'
import type { AffiliationItem, StreamerItem, UpdateStreamerRequest } from '../../types'
import partnerMark from '../../assets/mark.png'
import chzzkIcon from '../../assets/chzzk_icon.png'

interface StreamerDetailOverlayProps {
    streamer: StreamerItem
    allAffiliations: AffiliationItem[]
    pendingSave: boolean
    onClose: () => void
    onSave: (data: UpdateStreamerRequest) => void
}

const STREAMER_TYPE_LABELS: Record<'cam' | 'vtuber' | 'hybrid', string> = { cam: '캠', vtuber: '버튜버', hybrid: '하이브리드' }

export function StreamerDetailOverlay({
    streamer,
    allAffiliations,
    pendingSave,
    onClose,
    onSave,
}: StreamerDetailOverlayProps) {
    const [nickname, setNickname] = useState(streamer.nickname ?? '')
    const [youtubeUrl, setYoutubeUrl] = useState('')
    const [fanCafeUrl, setFanCafeUrl] = useState('')
    const [streamerType, setStreamerType] = useState(streamer.streamerType)
    const [isProGamer, setIsProGamer] = useState(streamer.isProGamer)
    const [affiliationIds, setAffiliationIds] = useState<number[]>(streamer.affiliations.map((a) => a.id))
    const [isAliasPending, setIsAliasPending] = useState(false)
    const [visible, setVisible] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const sidebarCollapsed = useSidebarCollapsed()
    const { data: detail } = useStreamerDetail(streamer.id)
    const addAffiliationMutation = useAddStreamerAffiliation()
    const removeAffiliationMutation = useRemoveStreamerAffiliation()
    const { addToast } = useAdminToast()

    useEffect(() => {
        const id = requestAnimationFrame(() => setVisible(true))
        return () => cancelAnimationFrame(id)
    }, [])

    useEffect(() => {
        setNickname(streamer.nickname ?? '')
        setStreamerType(streamer.streamerType)
        setIsProGamer(streamer.isProGamer)
        setAffiliationIds(streamer.affiliations.map((a) => a.id))
        setYoutubeUrl('')
        setFanCafeUrl('')
        scrollRef.current?.scrollTo({ top: 0 })
    }, [streamer])

    useEffect(() => {
        if (detail) {
            setYoutubeUrl(detail.youtubeUrl ?? '')
            setFanCafeUrl(detail.fanCafeUrl ?? '')
        }
    }, [detail])

    const originalAffIds = streamer.affiliations.map((a) => a.id)
    const hasChanges =
        nickname !== (streamer.nickname ?? '') ||
        youtubeUrl !== (detail?.youtubeUrl ?? '') ||
        fanCafeUrl !== (detail?.fanCafeUrl ?? '') ||
        streamerType !== streamer.streamerType ||
        isProGamer !== streamer.isProGamer ||
        affiliationIds.length !== originalAffIds.length ||
        affiliationIds.some((id) => !originalAffIds.includes(id))

    const isAnyPending = pendingSave || isAliasPending || addAffiliationMutation.isPending || removeAffiliationMutation.isPending
    const channelLink = streamer.channelId ? `https://chzzk.naver.com/${streamer.channelId}` : null
    const displayName = nickname.trim().length > 0 && nickname !== streamer.name ? nickname : streamer.name

    function handleSave(): void {
        const data: UpdateStreamerRequest = {}
        const normNickname = normalizeInput(nickname)
        const normYoutube = normalizeInput(youtubeUrl)
        const normFanCafe = normalizeInput(fanCafeUrl)
        if (normNickname !== (streamer.nickname ?? '')) data.nickname = normNickname
        if (normYoutube !== (detail?.youtubeUrl ?? '')) data.youtubeUrl = normYoutube
        if (normFanCafe !== (detail?.fanCafeUrl ?? '')) data.fanCafeUrl = normFanCafe
        if (streamerType !== streamer.streamerType) data.streamerType = streamerType
        if (isProGamer !== streamer.isProGamer) data.isProGamer = isProGamer

        const toAdd = affiliationIds.filter((id) => !originalAffIds.includes(id))
        const toRemove = originalAffIds.filter((id) => !affiliationIds.includes(id))
        for (const affiliationId of toAdd) {
            addAffiliationMutation.mutate(
                { streamerId: streamer.id, affiliationId },
                { onError: () => addToast({ message: '소속 추가에 실패했습니다.', variant: 'error' }) },
            )
        }
        for (const affiliationId of toRemove) {
            removeAffiliationMutation.mutate(
                { streamerId: streamer.id, affiliationId },
                { onError: () => addToast({ message: '소속 삭제에 실패했습니다.', variant: 'error' }) },
            )
        }

        onSave(data)
    }

    function handleClose(): void {
        if (hasChanges && !window.confirm('변경 사항이 있습니다. 취소하시겠습니까?')) return
        setVisible(false)
        setTimeout(onClose, 200)
    }

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape' && !isAnyPending) handleClose()
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [isAnyPending, hasChanges])

    return (
        <>
            <div
                className={cn('fixed inset-0 z-50 bg-black/40 transition-opacity duration-200', visible ? 'opacity-100' : 'opacity-0')}
                onClick={isAnyPending ? undefined : handleClose}
            />

            <div
                className={cn(
                    'fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-bg-secondary shadow-2xl transition-[transform,left] duration-200',
                    'left-0 md:left-[var(--sidebar-w)]',
                    visible ? 'translate-x-0' : 'translate-x-full',
                )}
                style={{ '--sidebar-w': sidebarCollapsed ? '3.5rem' : '14rem' } as React.CSSProperties}
            >
                <div className="shrink-0 border-b border-border px-6 py-4">
                    <div className="mx-auto flex max-w-2xl items-center gap-4">
                    <Avatar streamer={streamer} sizeClass="h-12 w-12 shrink-0" textClass="text-sm" />
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <span className="truncate font-bold text-text">{displayName}</span>
                            {streamer.isPartner && <img src={partnerMark} alt="파트너" className="h-4 w-4 shrink-0" />}
                            <span className={cn(
                                'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold',
                                streamer.streamerType === 'vtuber' ? 'bg-purple-500/15 text-purple-300'
                                : streamer.streamerType === 'hybrid' ? 'bg-sky-500/15 text-sky-300'
                                : 'bg-rose-500/15 text-rose-300',
                            )}>
                                {STREAMER_TYPE_LABELS[streamer.streamerType]}
                            </span>
                            {streamer.isProGamer && (
                                <span className="shrink-0 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                    프로게이머
                                </span>
                            )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-3">
                            <span className="text-xs text-text-dim">팔로워 {formatFollowerCount(streamer.followerCount)}</span>
                            {channelLink !== null && (
                                <a
                                    href={channelLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="cursor-pointer inline-flex items-center gap-1 text-xs text-text-dim transition hover:text-primary"
                                >
                                    <img src={chzzkIcon} alt="치지직" className="h-3.5 w-3.5" />
                                    치지직
                                    <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isAnyPending}
                        className="cursor-pointer shrink-0 rounded-lg p-1.5 text-text-dim transition hover:bg-card hover:text-text-muted disabled:opacity-50"
                        aria-label="닫기"
                    >
                        <X className="h-4 w-4" />
                    </button>
                    </div>
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto">
                    <div className="mx-auto max-w-2xl divide-y divide-border/50">

                        <PropRow label="닉네임">
                            <input
                                type="text"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                placeholder={streamer.name}
                                className="w-full bg-transparent text-sm text-text outline-none placeholder:text-text-dim"
                            />
                        </PropRow>

                        <PropRow label="타입">
                            <div
                                role="radiogroup"
                                className="inline-flex rounded-lg border border-border bg-card p-0.5"
                                onKeyDown={(e) => {
                                    const types = ['cam', 'vtuber', 'hybrid'] as const
                                    const idx = types.indexOf(streamerType)
                                    if (e.key === 'ArrowRight') setStreamerType(types[(idx + 1) % 3])
                                    if (e.key === 'ArrowLeft') setStreamerType(types[(idx + 2) % 3])
                                }}
                            >
                                {(['cam', 'vtuber', 'hybrid'] as const).map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        role="radio"
                                        aria-checked={streamerType === type}
                                        tabIndex={streamerType === type ? 0 : -1}
                                        onClick={() => setStreamerType(type)}
                                        className={cn(
                                            'cursor-pointer rounded-md px-3 py-1 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                                            streamerType === type ? 'bg-primary/20 text-primary' : 'text-text-muted hover:text-text',
                                        )}
                                    >
                                        {STREAMER_TYPE_LABELS[type]}
                                    </button>
                                ))}
                            </div>
                        </PropRow>

                        <PropRow label="프로게이머">
                            <button
                                type="button"
                                onClick={() => setIsProGamer((prev) => !prev)}
                                role="switch"
                                aria-checked={isProGamer}
                                className={cn(
                                    'cursor-pointer relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                                    isProGamer ? 'bg-primary' : 'bg-card-hover',
                                )}
                            >
                                <span className={cn('inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform', isProGamer ? 'translate-x-4' : 'translate-x-1')} />
                            </button>
                        </PropRow>

                        <PropRow label="유튜브">
                            <div className="flex w-full items-center gap-2">
                                <input
                                    type="text"
                                    value={youtubeUrl}
                                    onChange={(e) => setYoutubeUrl(e.target.value)}
                                    placeholder="https://www.youtube.com/..."
                                    className="flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-dim"
                                />
                                {youtubeUrl.trim().length > 0 && (
                                    <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" tabIndex={-1} className="cursor-pointer shrink-0 text-text-dim transition hover:text-red-400">
                                        <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                )}
                            </div>
                        </PropRow>

                        <PropRow label="팬카페">
                            <div className="flex w-full items-center gap-2">
                                <input
                                    type="text"
                                    value={fanCafeUrl}
                                    onChange={(e) => setFanCafeUrl(e.target.value)}
                                    placeholder="https://cafe.naver.com/..."
                                    className="flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-dim"
                                />
                                {fanCafeUrl.trim().length > 0 && (
                                    <a href={fanCafeUrl} target="_blank" rel="noopener noreferrer" tabIndex={-1} className="cursor-pointer shrink-0 text-text-dim transition hover:text-emerald-400">
                                        <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                )}
                            </div>
                        </PropRow>

                        <PropRow label="소속" alignTop>
                            <AffiliationSectionDropdown
                                allAffiliations={allAffiliations}
                                selectedIds={affiliationIds}
                                onChange={setAffiliationIds}
                            />
                        </PropRow>

                        <PropRow label="별명" alignTop>
                            <AliasSection streamerId={streamer.id} onPendingChange={setIsAliasPending} />
                        </PropRow>

                    </div>
                </div>

                <div className="shrink-0 border-t border-border px-6 py-4">
                    <div className="mx-auto flex max-w-2xl items-center justify-end gap-2">
                    <button
                        type="button"
                        tabIndex={-1}
                        onClick={handleClose}
                        disabled={isAnyPending}
                        className="cursor-pointer rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-muted transition hover:bg-card disabled:opacity-50"
                    >
                        취소
                    </button>
                    <button
                        type="button"
                        tabIndex={-1}
                        onClick={handleSave}
                        disabled={!hasChanges || pendingSave}
                        className="cursor-pointer rounded-lg bg-primary px-3 py-2 text-sm font-medium text-bg transition hover:bg-primary-dim disabled:opacity-30"
                    >
                        저장
                    </button>
                    </div>
                </div>
            </div>
        </>
    )
}

interface PropRowProps {
    label: string
    alignTop?: boolean
    children: React.ReactNode
}

function PropRow({ label, alignTop = false, children }: PropRowProps) {
    return (
        <div className={cn('grid grid-cols-[100px_1fr] gap-4 px-6 py-3.5 transition hover:bg-card/40 focus-within:bg-card/60', alignTop ? 'items-start' : 'items-center')}>
            <span className="text-xs font-medium text-text-dim">{label}</span>
            <div className="min-w-0">{children}</div>
        </div>
    )
}
