import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ExternalLink, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { useSidebarCollapsed } from '../AdminLayout'
import { useAdminToast } from '../../hooks/useAdminToast'
import { useAddStreamerAffiliation, useRemoveStreamerAffiliation, useStreamerDetail } from '../../hooks/useStreamers'
import { Avatar } from './Avatar'
import { AffiliationSectionDropdown } from './AffiliationSectionDropdown'
import { AliasSection } from './AliasSection'
import { formatFollowerCount, normalizeInput } from '../../utils/format'
import { getStreamerTypeBadgeClass } from './utils'
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

export function StreamerDetailOverlay({ streamer, allAffiliations, pendingSave, onClose, onSave }: StreamerDetailOverlayProps) {
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
    const persistedDisplayName = streamer.nickname?.trim().length ? streamer.nickname : streamer.name
    const footerState = isAnyPending ? 'saving' : hasChanges ? 'dirty' : 'clean'

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

    const handleClose = useCallback((): void => {
        if (hasChanges && !window.confirm('변경 사항이 있습니다. 취소하시겠습니까?')) return
        setVisible(false)
        setTimeout(onClose, 200)
    }, [hasChanges, onClose])

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape' && !isAnyPending) handleClose()
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [isAnyPending, handleClose])

    return (
        <>
            <div
                className={cn('fixed inset-0 z-50 bg-black/40 transition-opacity duration-200', visible ? 'opacity-100' : 'opacity-0')}
                onClick={isAnyPending ? undefined : handleClose}
            />

            <div
                className={cn(
                    'fixed inset-y-0 right-0 z-50 flex flex-col bg-bg-secondary shadow-2xl transition-[transform,left] duration-200',
                    'left-0 md:left-[var(--sidebar-w)]',
                    visible ? 'translate-x-0' : 'translate-x-full',
                )}
                style={{ '--sidebar-w': sidebarCollapsed ? '3.5rem' : '14rem' } as React.CSSProperties}
            >
                <div className="shrink-0 border-b border-border px-4 py-3 md:px-6 md:py-4">
                    <div className="mx-auto max-w-3xl rounded-2xl border border-border/70 bg-card/70 p-3 shadow-card md:p-4">
                        <div className="flex items-start gap-3 md:gap-4">
                            <div className="rounded-2xl border border-border/70 bg-bg-secondary/80 p-1 shadow-inner">
                                <Avatar
                                    streamer={streamer}
                                    sizeClass="h-11 w-11 shrink-0 md:h-14 md:w-14"
                                    textClass="text-sm md:text-base"
                                />
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex min-w-0 items-center gap-2">
                                    <h2 className="truncate text-base font-bold text-text md:text-lg">{persistedDisplayName}</h2>
                                    {streamer.isPartner && <img src={partnerMark} alt="파트너" className="h-4 w-4 shrink-0" />}
                                </div>
                                <div className="mt-2 flex flex-wrap items-center gap-1 md:gap-1.5">
                                    <StreamerTypeChip type={streamer.streamerType} />
                                    {streamer.isProGamer && (
                                        <span className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary md:px-2">
                                            프로게이머
                                        </span>
                                    )}
                                    <span className="rounded-full border border-border bg-bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-text-dim md:px-2">
                                        팔로워 {formatFollowerCount(streamer.followerCount)}
                                    </span>
                                </div>
                                {channelLink !== null && (
                                    <a
                                        href={channelLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-2 inline-flex cursor-pointer items-center gap-1 text-[11px] font-medium text-text-dim transition hover:text-primary md:mt-3 md:gap-1.5 md:rounded-full md:border md:border-border md:bg-bg-secondary md:px-2.5 md:py-1 md:text-xs md:text-text-muted md:hover:border-primary/40"
                                    >
                                        <img src={chzzkIcon} alt="치지직" className="h-3.5 w-3.5 shrink-0" />
                                        <span className="sr-only md:not-sr-only">치지직 채널</span>
                                        <ExternalLink className="h-3 w-3 shrink-0" />
                                    </a>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={isAnyPending}
                                className="cursor-pointer shrink-0 rounded-xl border border-transparent p-1.5 text-text-dim transition hover:border-border hover:bg-bg-secondary hover:text-text-muted disabled:opacity-50"
                                aria-label="닫기"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto">
                    <div className="mx-auto max-w-3xl space-y-5 px-4 py-5 md:px-6 md:py-6">
                        <DetailSection index="01" title="기본 프로필" description="목록과 검색 결과에서 보이는 핵심 식별값입니다.">
                            <PropRow label="닉네임">
                                <input
                                    type="text"
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    placeholder={streamer.name}
                                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-text outline-none transition placeholder:text-text-dim focus:border-primary/50"
                                />
                            </PropRow>

                            <PropRow label="타입">
                                <div
                                    role="radiogroup"
                                    className="inline-flex rounded-xl border border-border bg-card p-1"
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
                                                'cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                                                streamerType === type ? 'bg-primary text-bg' : 'text-text-muted hover:text-text',
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
                                        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                                        isProGamer ? 'bg-primary' : 'bg-card-hover',
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
                                            isProGamer ? 'translate-x-6' : 'translate-x-1',
                                        )}
                                    />
                                </button>
                            </PropRow>
                        </DetailSection>

                        <DetailSection index="02" title="외부 활동 링크" description="공식 외부 채널로 이동할 수 있는 링크입니다.">
                            <PropRow label="유튜브" alignTop>
                                <div className="flex w-full items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 focus-within:border-primary/50">
                                    <input
                                        type="text"
                                        value={youtubeUrl}
                                        onChange={(e) => setYoutubeUrl(e.target.value)}
                                        placeholder="https://www.youtube.com/..."
                                        className="min-w-0 flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-dim"
                                    />
                                    {youtubeUrl.trim().length > 0 && (
                                        <a
                                            href={youtubeUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            tabIndex={-1}
                                            className="shrink-0 cursor-pointer text-text-dim transition hover:text-red-400"
                                        >
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </a>
                                    )}
                                </div>
                            </PropRow>

                            <PropRow label="팬카페" alignTop>
                                <div className="flex w-full items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 focus-within:border-primary/50">
                                    <input
                                        type="text"
                                        value={fanCafeUrl}
                                        onChange={(e) => setFanCafeUrl(e.target.value)}
                                        placeholder="https://cafe.naver.com/..."
                                        className="min-w-0 flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-dim"
                                    />
                                    {fanCafeUrl.trim().length > 0 && (
                                        <a
                                            href={fanCafeUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            tabIndex={-1}
                                            className="shrink-0 cursor-pointer text-text-dim transition hover:text-emerald-400"
                                        >
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </a>
                                    )}
                                </div>
                            </PropRow>
                        </DetailSection>

                        <DetailSection index="03" title="조직과 소속" description="팀, 크루, 대회 조직과의 연결을 관리합니다.">
                            <PropRow label="소속" alignTop>
                                <AffiliationSectionDropdown
                                    allAffiliations={allAffiliations}
                                    selectedIds={affiliationIds}
                                    onChange={setAffiliationIds}
                                />
                            </PropRow>
                        </DetailSection>

                        <DetailSection index="04" title="검색 별명" description="검색과 매칭에 사용할 별칭을 관리합니다.">
                            <AliasSection streamerId={streamer.id} onPendingChange={setIsAliasPending} />
                        </DetailSection>
                    </div>
                </div>

                <div className="shrink-0 border-t border-border px-4 py-3 md:px-6 md:py-4">
                    <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-2">
                            <span
                                className={cn(
                                    'h-2 w-2 shrink-0 rounded-full',
                                    footerState === 'saving' ? 'bg-primary' : footerState === 'dirty' ? 'bg-collab' : 'bg-text-dim',
                                )}
                            />
                            <span
                                className={cn(
                                    'truncate text-xs font-medium',
                                    footerState === 'saving' ? 'text-primary' : footerState === 'dirty' ? 'text-collab' : 'text-text-dim',
                                )}
                            >
                                {footerState === 'saving' ? '저장 중...' : footerState === 'dirty' ? '저장 대기' : '변경사항 없음'}
                            </span>
                        </div>
                        <div className="inline-flex shrink-0 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
                            <button
                                type="button"
                                tabIndex={-1}
                                onClick={handleClose}
                                disabled={isAnyPending}
                                className="cursor-pointer px-4 py-2.5 text-sm font-medium text-text-muted transition hover:bg-bg-secondary hover:text-text disabled:opacity-50"
                            >
                                취소
                            </button>
                            <button
                                type="button"
                                tabIndex={-1}
                                onClick={handleSave}
                                disabled={!hasChanges || pendingSave}
                                className="cursor-pointer border-l border-border bg-primary px-4 py-2.5 text-sm font-semibold text-bg transition hover:bg-primary-dim disabled:opacity-30"
                            >
                                저장
                            </button>
                        </div>
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

function StreamerTypeChip({ type }: { type: 'cam' | 'vtuber' | 'hybrid' }) {
    return (
        <span className={cn('shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold', getStreamerTypeBadgeClass(type))}>
            {STREAMER_TYPE_LABELS[type]}
        </span>
    )
}

interface DetailSectionProps {
    index: string
    title: string
    description?: string
    children: React.ReactNode
}

function DetailSection({ index, title, description, children }: DetailSectionProps) {
    return (
        <section className="overflow-hidden rounded-[1.4rem] border border-border/80 bg-card/70 shadow-card">
            <div className="flex items-start gap-3 border-b border-border/70 bg-bg-secondary/35 px-4 py-4">
                <span className="mt-0.5 rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-bold tracking-[0.18em] text-text-dim">
                    {index}
                </span>
                <div className="min-w-0">
                    <h3 className="text-sm font-bold text-text">{title}</h3>
                    {description && <p className="mt-1 text-xs leading-5 text-text-dim">{description}</p>}
                </div>
            </div>
            <div className="space-y-2.5 p-3 md:p-4">{children}</div>
        </section>
    )
}

function PropRow({ label, alignTop = false, children }: PropRowProps) {
    return (
        <div
            className={cn(
                'grid grid-cols-1 gap-2 rounded-2xl border border-border/60 bg-bg-secondary/55 px-3.5 py-3.5 transition hover:border-border hover:bg-bg-secondary/80 focus-within:border-primary/40 focus-within:bg-bg-secondary sm:grid-cols-[108px_1fr] sm:gap-4 sm:px-4',
                alignTop ? 'items-start' : 'items-center',
            )}
        >
            <span className="text-xs font-semibold text-text-dim">{label}</span>
            <div className="min-w-0">{children}</div>
        </div>
    )
}
