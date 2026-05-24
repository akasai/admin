import { useEffect, useMemo, useRef, useState } from 'react'
import dayjs from 'dayjs'
import { Search, Users, X } from 'lucide-react'
import type { StagingItem, StreamerItem, UpdateStagingRequest } from '../../types'
import { cn } from '../../lib/cn'
import { inputClass } from '../../constants/styles'
import { ModalOverlay } from '../ModalOverlay'
import { Badge, Button } from '../../../../public/packages/ui/src'

interface EditParticipant {
    id: number
    name: string
    isHost: boolean
}

interface StagingEditModalProps {
    item: StagingItem
    streamers: StreamerItem[]
    pending: boolean
    readOnly?: boolean
    onClose: () => void
    onSubmit: (body: UpdateStagingRequest) => Promise<void>
}

export function StagingEditModal({ item, streamers, pending, readOnly = false, onClose, onSubmit }: StagingEditModalProps) {
    const [title, setTitle] = useState(item.title ?? '')
    const [category, setCategory] = useState(item.category ?? '')
    const [startDate, setStartDate] = useState(item.event_date_kst ?? '')
    const [startTime, setStartTime] = useState(() => {
        if (item.start_time == null || item.start_time.trim().length === 0) return ''
        const d = dayjs(item.start_time)
        return d.isValid() ? d.format('HH:mm') : ''
    })
    const [participants, setParticipants] = useState<EditParticipant[]>(() =>
        (item.participants ?? []).map((p) => ({
            id: p.id,
            name: p.name,
            isHost: p.id === item.host_streamer_id,
        })),
    )
    const [search, setSearch] = useState('')
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const dropdownRef = useRef<HTMLDivElement | null>(null)

    const streamersById = useMemo(() => new Map(streamers.map((s) => [s.id, s])), [streamers])
    const selectedIds = useMemo(() => new Set(participants.map((p) => p.id)), [participants])

    const filteredStreamers = useMemo(() => {
        const keyword = search.trim().toLowerCase()
        const source =
            keyword.length === 0
                ? streamers
                : streamers.filter(
                      (s) => s.name.toLowerCase().includes(keyword) || (s.nickname ?? '').toLowerCase().includes(keyword),
                  )
        return source.filter((s) => !selectedIds.has(s.id)).slice(0, 50)
    }, [search, streamers, selectedIds])

    useEffect(() => {
        function handleOutsideClick(event: MouseEvent): void {
            if (dropdownRef.current !== null && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false)
            }
        }
        window.addEventListener('mousedown', handleOutsideClick)
        return () => window.removeEventListener('mousedown', handleOutsideClick)
    }, [])

    function addStreamer(streamer: StreamerItem): void {
        setParticipants((prev) => [
            ...prev,
            { id: streamer.id, name: streamer.name, isHost: prev.length === 0 },
        ])
        setSearch('')
        setIsDropdownOpen(false)
    }

    function removeParticipant(id: number): void {
        setParticipants((prev) => {
            const next = prev.filter((p) => p.id !== id)
            const wasHost = prev.find((p) => p.id === id)?.isHost ?? false
            if (wasHost && next.length > 0) {
                return next.map((p, i) => (i === 0 ? { ...p, isHost: true } : p))
            }
            return next
        })
    }

    function toggleHost(id: number): void {
        setParticipants((prev) => prev.map((p) => ({ ...p, isHost: p.id === id })))
    }

    async function handleSubmit(): Promise<void> {
        setError(null)
        const body: UpdateStagingRequest = {}
        if (title.trim().length > 0) body.title = title.trim()
        if (category.trim().length > 0) body.category = category.trim()
        body.start_time = startTime.trim().length > 0 ? startTime.trim() : null
        body.participant_ids = participants.map((p) => p.id)
        body.host_streamer_id = participants.find((p) => p.isHost)?.id ?? null
        try {
            await onSubmit(body)
        } catch {
            setError('저장 중 오류가 발생했습니다.')
        }
    }

    return (
        <ModalOverlay size="lg" disabled={pending} onClose={onClose}>
            <div className="flex items-start justify-between border-b border-[#3a3a44] px-6 py-4">
                <div>
                    <h2 className="text-base font-bold text-[#efeff1]">{readOnly ? '스테이징 상세' : '스테이징 수정'}</h2>
                    <p className="mt-1 text-xs text-[#adadb8]">
                        {readOnly ? '스테이징 항목 정보를 확인합니다.' : '스테이징 항목 정보를 수정합니다.'}
                    </p>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    disabled={pending}
                    className="rounded-lg border border-[#3a3a44] text-[#adadb8] hover:bg-[#26262e] hover:text-[#adadb8]"
                    aria-label="닫기"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="max-h-[68vh] space-y-4 overflow-auto px-6 py-4">
                <div className="space-y-1">
                    <label className="text-xs font-medium text-[#adadb8]">제목</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className={inputClass}
                        placeholder="스테이징 제목"
                        autoFocus={!readOnly}
                        readOnly={readOnly}
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-medium text-[#adadb8]">카테고리</label>
                    <input
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className={inputClass}
                        placeholder="카테고리"
                        readOnly={readOnly}
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-[#adadb8]">날짜</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className={inputClass}
                            disabled={readOnly}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-[#adadb8]">시작 시간</label>
                        <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className={inputClass}
                            disabled={readOnly}
                        />
                    </div>
                </div>

                <div className="space-y-2 rounded-xl border border-[#3a3a44] bg-[#20202a] p-3">
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-[#efeff1]">
                            <Users className="h-4 w-4" /> 참여자 관리
                        </h3>
                        <p className="text-[11px] text-[#848494]">스트리머 검색으로 추가</p>
                    </div>

                    <div className="space-y-2">
                        {participants.map((participant) => (
                            <div
                                key={participant.id}
                                className="flex items-center justify-between gap-3 rounded-xl border border-[#3a3a44] bg-[#26262e] px-3 py-2"
                            >
                                <div className="flex min-w-0 items-center gap-2.5">
                                    {(() => {
                                        const imgUrl = streamersById.get(participant.id)?.channelImageUrl
                                        return imgUrl !== undefined && imgUrl.trim().length > 0 ? (
                                            <img
                                                src={imgUrl}
                                                alt={participant.name}
                                                className="h-8 w-8 shrink-0 rounded-full border border-[#3a3a44] object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#3a3a44] bg-[#20202a] text-xs font-semibold text-[#b8b8c3]">
                                                {participant.name.slice(0, 1)}
                                            </div>
                                        )
                                    })()}
                                    <span className="truncate text-sm font-medium text-[#efeff1]">{participant.name}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                     {readOnly ? (
                                         <Badge
                                             size="md"
                                             className={cn(
                                                 'rounded-lg px-2 py-1 text-xs font-semibold',
                                                 participant.isHost
                                                     ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                                                     : 'border-[#3a3a44] bg-[#2f2f39] text-[#adadb8]',
                                             )}
                                         >
                                             {participant.isHost ? '주최' : '참여자'}
                                         </Badge>
                                     ) : (
                                         <>
                                             <Button
                                                 type="button"
                                                 variant="outline"
                                                 size="sm"
                                                 onClick={() => toggleHost(participant.id)}
                                                 className={cn(
                                                     'rounded-lg text-xs font-semibold',
                                                     participant.isHost
                                                         ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-300'
                                                         : 'border-[#3a3a44] bg-[#2f2f39] text-[#adadb8] hover:bg-[#3a3a46] hover:text-[#adadb8]',
                                                 )}
                                             >
                                                 주최
                                             </Button>
                                             <Button
                                                 type="button"
                                                 variant="destructive"
                                                 size="sm"
                                                 onClick={() => removeParticipant(participant.id)}
                                                 className="rounded-lg border-red-500/30 bg-red-500/5 text-xs font-semibold text-red-300 hover:bg-red-500/15 hover:text-red-300"
                                                 aria-label={`${participant.name} 삭제`}
                                             >
                                                 삭제
                                             </Button>
                                         </>
                                     )}
                                 </div>
                             </div>
                         ))}
                        {participants.length === 0 && (
                            <p className="py-3 text-center text-xs text-[#848494]">등록된 참여자가 없습니다.</p>
                        )}
                    </div>

                    {!readOnly && <div className="relative" ref={dropdownRef}>
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#7e7e8c]" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value)
                                    setIsDropdownOpen(true)
                                }}
                                onFocus={() => setIsDropdownOpen(true)}
                                className={cn(inputClass, 'pl-9')}
                                placeholder="스트리머 검색"
                            />
                        </div>
                        {isDropdownOpen && (
                            <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-[#3a3a44] bg-[#1f1f28] shadow-xl">
                                <div className="max-h-48 overflow-auto">
                                    {filteredStreamers.length === 0 ? (
                                        <p className="px-3 py-2 text-xs text-[#848494]">검색 결과가 없습니다.</p>
                                    ) : (
                                        filteredStreamers.map((streamer) => (
                                            <button
                                                key={streamer.id}
                                                type="button"
                                                onClick={() => addStreamer(streamer)}
                                                className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left transition hover:bg-[#2a2a34]"
                                            >
                                                {streamer.channelImageUrl != null && streamer.channelImageUrl.trim().length > 0 ? (
                                                    <img
                                                        src={streamer.channelImageUrl}
                                                        alt={streamer.name}
                                                        className="h-7 w-7 rounded-full border border-[#3a3a44] object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#3a3a44] bg-[#26262e] text-[11px] font-semibold text-[#b8b8c3]">
                                                        {streamer.name.slice(0, 1)}
                                                    </div>
                                                )}
                                                <span className="truncate text-sm text-[#efeff1]">{streamer.name}</span>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>}
                </div>

                {error !== null && <p className="text-xs text-red-400">{error}</p>}
            </div>

            <div className="flex gap-2 border-t border-[#3a3a44] px-6 py-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={pending}
                    className="h-auto flex-1 rounded-xl border-[#3a3a44] py-2.5 text-sm font-medium text-[#adadb8] hover:bg-[#26262e] hover:text-[#adadb8]"
                >
                    {readOnly ? '닫기' : '취소'}
                </Button>
                {!readOnly && <Button
                    type="button"
                    variant="primary"
                    onClick={() => {
                        void handleSubmit()
                    }}
                    disabled={pending}
                    className="h-auto flex-1 rounded-xl py-2.5 text-sm font-semibold text-white"
                >
                    {pending ? '저장 중...' : '저장'}
                </Button>}
            </div>
        </ModalOverlay>
    )
}
