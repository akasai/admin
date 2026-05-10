import { useEffect, useState } from 'react'
import { ExternalLink, Pencil, Trash2, X } from 'lucide-react'
import type { AffiliationItem, StreamerItem, UpdateStreamerRequest } from '../../types'

const TYPE_LABELS: Record<'mcn' | 'agency' | 'crew' | 'esports', string> = {
    mcn: 'MCN',
    agency: '소속사',
    crew: '크루',
    esports: '프로게임단',
}
import { cn } from '../../lib/cn'
import { inputClass } from '../../constants/styles'
import { ModalOverlay } from '../ModalOverlay'
import { Avatar } from './Avatar'
import { AffiliationSectionDropdown } from './AffiliationSectionDropdown'
import { AliasSection } from './AliasSection'

import { formatFollowerCount, normalizeInput } from '../../utils/format'
import partnerMark from '../../assets/mark.png'
import chzzkIcon from '../../assets/chzzk_icon.png'

interface StreamerDetailModalProps {
    streamer: StreamerItem
    allAffiliations: AffiliationItem[]
    pendingSave: boolean
    pendingDelete: boolean
    onClose: () => void
    onSave: (data: UpdateStreamerRequest) => void
    onDelete: () => void
}

export function StreamerDetailModal({
    streamer,
    allAffiliations,
    pendingSave,
    pendingDelete,
    onClose,
    onSave,
    onDelete,
}: StreamerDetailModalProps) {
    const [nickname, setNickname] = useState(streamer.nickname ?? '')
    const [youtubeUrl, setYoutubeUrl] = useState(streamer.youtubeUrl ?? '')
    const [fanCafeUrl, setFanCafeUrl] = useState(streamer.fanCafeUrl ?? '')
    const [streamerType, setStreamerType] = useState(streamer.streamerType)
    const [isProGamer, setIsProGamer] = useState(streamer.isProGamer)
    const [affiliationIds, setAffiliationIds] = useState<number[]>(streamer.affiliations.map((a) => a.id))
    const [isEditingNickname, setIsEditingNickname] = useState(false)

    const [isAliasPending, setIsAliasPending] = useState(false)

    useEffect(() => {
        setNickname(streamer.nickname ?? '')
        setYoutubeUrl(streamer.youtubeUrl ?? '')
        setFanCafeUrl(streamer.fanCafeUrl ?? '')
        setStreamerType(streamer.streamerType)
        setIsProGamer(streamer.isProGamer)
        setAffiliationIds(streamer.affiliations.map((a) => a.id))
        setIsEditingNickname(false)

    }, [streamer])

    const originalAffIds = streamer.affiliations.map((a) => a.id)
    const hasChanges =
        nickname !== (streamer.nickname ?? '') ||
        youtubeUrl !== (streamer.youtubeUrl ?? '') ||
        fanCafeUrl !== (streamer.fanCafeUrl ?? '') ||
        streamerType !== streamer.streamerType ||
        isProGamer !== streamer.isProGamer ||
        affiliationIds.length !== originalAffIds.length ||
        affiliationIds.some((id) => !originalAffIds.includes(id))

    const isAnyPending = pendingSave || pendingDelete || isAliasPending

    const channelLink = streamer.channelId ? `https://chzzk.naver.com/${streamer.channelId}` : null
    const displayName = nickname.length > 0 && nickname !== streamer.name ? nickname : streamer.name
    const hasCustomNickname = nickname.length > 0 && nickname !== streamer.name

    function handleSave(): void {
        const data: UpdateStreamerRequest = {}
        const normNickname = normalizeInput(nickname)
        const normYoutube = normalizeInput(youtubeUrl)
        const normFanCafe = normalizeInput(fanCafeUrl)
        if (normNickname !== (streamer.nickname ?? '')) data.nickname = normNickname
        if (normYoutube !== (streamer.youtubeUrl ?? '')) data.youtubeUrl = normYoutube || null
        if (normFanCafe !== (streamer.fanCafeUrl ?? '')) data.fanCafeUrl = normFanCafe || null
        if (streamerType !== streamer.streamerType) data.streamerType = streamerType
        if (isProGamer !== streamer.isProGamer) data.isProGamer = isProGamer
        const affChanged = affiliationIds.length !== originalAffIds.length || affiliationIds.some((id) => !originalAffIds.includes(id))
        if (affChanged) data.affiliationIds = affiliationIds
        onSave(data)
    }

    function handleCancel(): void {
        if (hasChanges && !window.confirm('변경 사항이 있습니다. 취소하시겠습니까?')) return
        onClose()
    }

    return (
        <ModalOverlay size="2xl" disabled={isAnyPending} onClose={handleCancel}>
            <div className="flex items-start justify-between gap-3 border-b border-[#3a3a44] px-6 py-4">
                <div className="flex min-w-0 flex-1 items-start gap-4">
                    <Avatar streamer={streamer} sizeClass="h-18 w-18" textClass="text-lg" />
                    <div className="min-w-0 flex-1">
                        {isEditingNickname ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={nickname}
                                    onChange={(event) => setNickname(event.target.value)}
                                    className={cn(inputClass, 'text-lg font-bold')}
                                    placeholder="닉네임 입력"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setIsEditingNickname(false)}
                                    className="cursor-pointer shrink-0 rounded-lg border border-[#3a3a44] p-1.5 text-[#adadb8] transition hover:bg-[#26262e]"
                                    aria-label="닉네임 편집 닫기"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <p className="truncate text-lg font-bold text-[#efeff1]">{displayName}</p>
                                {streamer.isPartner && <img src={partnerMark} alt="파트너" className="h-5 w-5 shrink-0" />}
                                <button
                                    type="button"
                                    onClick={() => setIsEditingNickname(true)}
                                    className="cursor-pointer shrink-0 rounded-lg p-1 text-[#848494] transition hover:bg-[#26262e] hover:text-[#adadb8]"
                                    aria-label="닉네임 편집"
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        )}
                        {hasCustomNickname && !isEditingNickname && <p className="mt-0.5 text-xs text-[#848494]">본명: {streamer.name}</p>}
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            {channelLink !== null && (
                                <a
                                    href={channelLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="cursor-pointer inline-flex items-center gap-1 rounded-full border border-[#3a3a44] bg-[#26262e] px-2.5 py-1 text-xs text-[#efeff1] transition hover:border-green-500/50 hover:text-green-300"
                                >
                                    <img src={chzzkIcon} alt="치지직" className="h-4 w-4" />
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                            )}
                            <span className="rounded-full border border-[#3a3a44] bg-[#26262e] px-2.5 py-1 text-xs text-[#efeff1]">
                                팔로워 {formatFollowerCount(streamer.followerCount)}
                            </span>
                            {streamer.affiliations.length > 0 &&
                                streamer.affiliations.map((aff) => (
                                    <span key={aff.id} className="inline-flex items-center gap-1 rounded-full border border-[#3a3a44] bg-[#26262e] px-2.5 py-1 text-xs text-[#adadb8]">
                                        {aff.thumbnailUrl !== null && (
                                            <img src={aff.thumbnailUrl} alt={aff.name} className="h-4 w-4 rounded-full object-cover" />
                                        )}
                                        <span className="opacity-60">[{TYPE_LABELS[aff.type]}]</span>
                                        {aff.name}
                                    </span>
                                ))}
                        </div>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isAnyPending}
                    className="cursor-pointer shrink-0 rounded-lg border border-[#3a3a44] p-1.5 text-[#adadb8] transition hover:bg-[#26262e] disabled:opacity-50"
                    aria-label="닫기"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="space-y-4 px-6 py-5">
                <div className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#848494]">프로필 설정</h3>
                    <div className="rounded-xl border border-[#3a3a44]/50 bg-[#1a1a22] p-4">
                        <div className="flex items-center justify-between gap-4">
                            <div className="inline-flex rounded-xl border border-[#3a3a44] bg-[#26262e] p-1">
                                {(['cam', 'vtuber', 'hybrid'] as const).map((type) => {
                                    const labels: Record<'cam' | 'vtuber' | 'hybrid', string> = { cam: '캠', vtuber: '버튜버', hybrid: '하이브리드' }
                                    return (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setStreamerType(type)}
                                            className={cn(
                                                'cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition',
                                                streamerType === type ? 'bg-blue-600 text-white' : 'text-[#adadb8] hover:text-[#efeff1]',
                                            )}
                                        >
                                            {labels[type]}
                                        </button>
                                    )
                                })}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-[#848494]">프로게이머</span>
                                <button
                                    type="button"
                                    onClick={() => setIsProGamer((prev) => !prev)}
                                    className={cn(
                                        'cursor-pointer relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition',
                                        isProGamer ? 'bg-green-500' : 'bg-[#3a3a44]',
                                    )}
                                    role="switch"
                                    aria-checked={isProGamer}
                                >
                                    <span
                                        className={cn(
                                            'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform',
                                            isProGamer ? 'translate-x-4' : 'translate-x-1',
                                        )}
                                    />
                                </button>
                                <span className={cn('text-xs', isProGamer ? 'text-green-300' : 'text-[#848494]')}>{isProGamer ? 'ON' : 'OFF'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#848494]">외부 링크</h3>
                    <div className="space-y-2 rounded-xl border border-[#3a3a44]/50 bg-[#1a1a22] p-4">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={youtubeUrl}
                                onChange={(event) => setYoutubeUrl(event.target.value)}
                                className={inputClass}
                                placeholder="https://www.youtube.com/..."
                            />
                            <a
                                href={streamer.youtubeUrl && streamer.youtubeUrl.trim().length > 0 ? streamer.youtubeUrl : undefined}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(
                                    'inline-flex shrink-0 items-center rounded-xl border px-2.5 py-1.5 text-xs transition',
                                    streamer.youtubeUrl && streamer.youtubeUrl.trim().length > 0
                                        ? 'cursor-pointer border-[#3a3a44] text-[#adadb8] hover:border-red-500/50 hover:text-red-300'
                                        : 'pointer-events-none border-[#3a3a44]/50 text-[#848494]/50',
                                )}
                                aria-label="유튜브 열기"
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={fanCafeUrl}
                                onChange={(event) => setFanCafeUrl(event.target.value)}
                                className={inputClass}
                                placeholder="https://cafe.naver.com/..."
                            />
                            <a
                                href={streamer.fanCafeUrl && streamer.fanCafeUrl.trim().length > 0 ? streamer.fanCafeUrl : undefined}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(
                                    'inline-flex shrink-0 items-center rounded-xl border px-2.5 py-1.5 text-xs transition',
                                    streamer.fanCafeUrl && streamer.fanCafeUrl.trim().length > 0
                                        ? 'cursor-pointer border-[#3a3a44] text-[#adadb8] hover:border-emerald-500/50 hover:text-emerald-300'
                                        : 'pointer-events-none border-[#3a3a44]/50 text-[#848494]/50',
                                )}
                                aria-label="팬카페 열기"
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#848494]">소속</h3>
                    <div className="rounded-xl border border-[#3a3a44]/50 bg-[#1a1a22] p-4">
                        <AffiliationSectionDropdown
                            allAffiliations={allAffiliations}
                            selectedIds={affiliationIds}
                            onChange={setAffiliationIds}
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#848494]">별명</h3>
                    <div className="rounded-xl border border-[#3a3a44]/50 bg-[#1a1a22] p-4">
                        <AliasSection
                            streamerId={streamer.id}
                            onPendingChange={setIsAliasPending}
                        />
                    </div>
                </div>


            </div>

            <div className="flex items-center justify-between gap-2 border-t border-[#3a3a44] px-6 py-4">
                <button
                    type="button"
                    onClick={onDelete}
                    disabled={pendingDelete}
                    className="cursor-pointer inline-flex items-center gap-1 rounded-xl border border-red-500/35 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
                >
                    <Trash2 className="h-4 w-4" /> 삭제
                </button>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleCancel}
                        disabled={isAnyPending}
                        className="cursor-pointer rounded-xl border border-[#3a3a44] px-3 py-2 text-sm font-medium text-[#adadb8] transition hover:bg-[#26262e] disabled:opacity-50"
                    >
                        취소
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={!hasChanges || pendingSave}
                        className="cursor-pointer rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-50"
                    >
                        저장
                    </button>
                </div>
            </div>
        </ModalOverlay>
    )
}
