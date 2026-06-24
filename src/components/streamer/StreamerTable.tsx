import { ArrowDown, ArrowUp, ArrowUpDown, Copy, ExternalLink, RefreshCw, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/shadcn/ui/button'
import { Badge } from '@/components/shadcn/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/shadcn/ui/table'
import { cn } from '@/lib/cn'
import type { StreamerItem } from '@/types/streamer'
import { formatFollowerCount, getStreamerTypeBadgeClass, getStreamerTypeLabel, segmentStreamerHighlight } from './utils'
import partnerMark from '@/assets/mark.png'

export type SortField = 'name' | 'followerCount'
export type SortDirection = 'asc' | 'desc'

interface StreamerTableProps {
    streamers: StreamerItem[]
    sortField: SortField
    sortDirection: SortDirection
    onSortChange: (field: SortField, direction: SortDirection) => void
    onDelete: (streamer: StreamerItem) => void
    onRefresh: (streamer: StreamerItem) => void
    onCopyChannelId: (channelId: string) => void
    onRowClick: (streamer: StreamerItem) => void
    searchQuery?: string
}

interface SortableHeaderProps {
    field: SortField
    currentField: SortField
    currentDirection: SortDirection
    onSort: (field: SortField, direction: SortDirection) => void
    className?: string
    children: ReactNode
}

function SortableHeader({ field, currentField, currentDirection, onSort, className = '', children }: SortableHeaderProps) {
    const isActive = field === currentField

    const handleClick = () => {
        if (isActive) {
            onSort(field, currentDirection === 'asc' ? 'desc' : 'asc')
        } else {
            onSort(field, 'asc')
        }
    }

    return (
        <TableHead className={className}>
            <button
                type="button"
                onClick={handleClick}
                className="inline-flex cursor-pointer items-center gap-1 rounded-md font-semibold text-text-muted transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
                {children}
                {isActive ? (
                    currentDirection === 'asc' ? (
                        <ArrowUp className="h-3.5 w-3.5 text-primary" />
                    ) : (
                        <ArrowDown className="h-3.5 w-3.5 text-primary" />
                    )
                ) : (
                    <ArrowUpDown className="h-3.5 w-3.5 text-text-dim" />
                )}
            </button>
        </TableHead>
    )
}

export function StreamerTable({
    streamers,
    sortField,
    sortDirection,
    onSortChange,
    onDelete,
    onRefresh,
    onCopyChannelId,
    onRowClick,
    searchQuery = '',
}: StreamerTableProps) {
    return (
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
            <div className="hidden overflow-x-auto md:block">
                <Table className="min-w-[900px] table-fixed">
                    <TableHeader>
                        <TableRow className="border-b border-border bg-bg-secondary/70 hover:bg-bg-secondary/70">
                            <TableHead className="w-[68px] py-4 pl-5 text-xs font-semibold uppercase tracking-wide text-text-dim">
                                프로필
                            </TableHead>
                            <SortableHeader
                                field="name"
                                currentField={sortField}
                                currentDirection={sortDirection}
                                onSort={onSortChange}
                                className="w-[24%] py-4 pr-5 text-xs uppercase tracking-wide"
                            >
                                이름
                            </SortableHeader>
                            <TableHead className="hidden w-[230px] py-4 pr-5 text-xs font-semibold uppercase tracking-wide text-text-dim sm:table-cell">
                                채널
                            </TableHead>
                            <SortableHeader
                                field="followerCount"
                                currentField={sortField}
                                currentDirection={sortDirection}
                                onSort={onSortChange}
                                className="hidden w-[124px] py-4 pr-5 text-right text-xs uppercase tracking-wide md:table-cell"
                            >
                                팔로워
                            </SortableHeader>
                            <TableHead className="hidden py-4 pr-5 text-xs font-semibold uppercase tracking-wide text-text-dim lg:table-cell">
                                소속
                            </TableHead>
                            <TableHead className="w-[96px] py-4 pr-5 text-center text-xs font-semibold uppercase tracking-wide text-text-dim">
                                작업
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {streamers.map((streamer) => (
                            <StreamerTableRow
                                key={streamer.id}
                                streamer={streamer}
                                onDelete={onDelete}
                                onRefresh={onRefresh}
                                onCopyChannelId={onCopyChannelId}
                                onRowClick={onRowClick}
                                searchQuery={searchQuery}
                            />
                        ))}
                    </TableBody>
                </Table>
            </div>

            <div className="space-y-3 p-3 md:hidden">
                {streamers.map((streamer) => (
                    <StreamerMobileCard key={streamer.id} streamer={streamer} onRowClick={onRowClick} searchQuery={searchQuery} />
                ))}
            </div>
        </div>
    )
}

interface StreamerRowProps {
    streamer: StreamerItem
    onDelete: (streamer: StreamerItem) => void
    onRefresh: (streamer: StreamerItem) => void
    onCopyChannelId: (channelId: string) => void
    onRowClick: (streamer: StreamerItem) => void
    searchQuery?: string
}

function StreamerIdentity({
    streamer,
    compact = false,
    searchQuery = '',
}: {
    streamer: StreamerItem
    compact?: boolean
    searchQuery?: string
}) {
    const displayName = streamer.nickname?.trim() || streamer.name

    return (
        <div className="flex min-w-0 flex-col gap-2">
            <span className={cn('truncate font-semibold text-text', compact ? 'text-base' : 'text-sm')}>
                <HighlightedText text={displayName} query={searchQuery} />
            </span>
            <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
                <StreamerTraitChips streamer={streamer} compact={compact} inline />
            </div>
        </div>
    )
}

function StreamerTraitChips({
    streamer,
    compact = false,
    inline = false,
}: {
    streamer: StreamerItem
    compact?: boolean
    inline?: boolean
}) {
    const typeLabel = getStreamerTypeLabel(streamer.streamerType)
    const typeBadgeClass = getStreamerTypeBadgeClass(streamer.streamerType)

    return (
        <div className={cn('flex min-w-0 items-center gap-1.5', inline && 'shrink-0')}>
            <span
                className={cn(
                    'rounded-full border font-semibold',
                    compact || inline ? 'px-1.5 py-px text-[10px]' : 'px-2 py-0.5 text-[10px]',
                    typeBadgeClass,
                )}
            >
                {typeLabel}
            </span>
            {streamer.isProGamer && (
                <span
                    className={cn(
                        'rounded-full border border-primary/30 bg-primary/10 font-semibold text-primary',
                        compact || inline ? 'px-1.5 py-px text-[10px]' : 'px-2 py-0.5 text-[10px]',
                    )}
                >
                    {compact || inline ? '프로' : '프로게이머'}
                </span>
            )}
        </div>
    )
}

function HighlightedText({ text, query }: { text: string; query: string }) {
    return segmentStreamerHighlight(text, query).map((segment, index) => (
        <span
            key={`${segment.text}-${index}`}
            className={segment.highlighted ? 'rounded-sm bg-primary/20 px-0.5 font-bold text-primary' : undefined}
        >
            {segment.text}
        </span>
    ))
}

function StreamerAvatar({ streamer, size = 'md' }: { streamer: StreamerItem; size?: 'md' | 'lg' }) {
    const imageSize = size === 'lg' ? 'h-14 w-14' : 'h-11 w-11'
    const partnerSize = size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'

    return (
        <div className="group relative inline-flex h-fit w-fit shrink-0">
            <div
                className={cn(
                    'relative overflow-hidden rounded-2xl bg-primary/10 ring-1 ring-border transition group-hover:ring-primary/50',
                    imageSize,
                )}
            >
                {streamer.channelImageUrl ? (
                    <img src={streamer.channelImageUrl} alt={`${streamer.name} 프로필`} className="h-full w-full object-cover" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-card-hover text-sm font-bold text-primary">
                        {streamer.name.charAt(0)}
                    </div>
                )}
            </div>
            {streamer.isPartner && (
                <div className="absolute right-0 bottom-0 rounded-full border border-border bg-card p-0.5 shadow-card">
                    <img src={partnerMark} alt="파트너" className={partnerSize} />
                </div>
            )}
        </div>
    )
}

function ChannelActions({ streamer, onCopyChannelId }: Pick<StreamerRowProps, 'streamer' | 'onCopyChannelId'>) {
    if (!streamer.channelId) {
        return <span className="text-xs text-text-dim">-</span>
    }

    return (
        <div className="flex items-center gap-1.5">
            <button
                type="button"
                onClick={(event) => {
                    event.stopPropagation()
                    onCopyChannelId(streamer.channelId!)
                }}
                className="group inline-flex max-w-full cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-bg-secondary px-2 py-1 font-mono text-xs text-text-muted transition hover:border-primary/50 hover:bg-primary/10 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
                <span className="truncate">{streamer.channelId}</span>
                <Copy className="h-3 w-3 shrink-0 text-text-dim transition group-hover:text-primary" />
            </button>
            <Button
                variant="ghost"
                size="icon-xs"
                className="cursor-pointer text-text-muted hover:bg-primary/10 hover:text-primary"
                onClick={(event) => {
                    event.stopPropagation()
                    window.open(`https://chzzk.naver.com/${streamer.channelId}`, '_blank')
                }}
                aria-label={`${streamer.name} 치지직 채널 열기`}
            >
                <ExternalLink className="h-3.5 w-3.5" />
            </Button>
        </div>
    )
}

function AffiliationBadges({ streamer }: { streamer: StreamerItem }) {
    if (streamer.affiliations.length === 0) {
        return <span className="text-xs text-text-dim">-</span>
    }

    return (
        <div className="flex flex-wrap gap-1">
            {streamer.affiliations.map((affiliation) => (
                <Badge
                    key={affiliation.id}
                    variant="secondary"
                    className="border border-border bg-bg-secondary text-[10px] font-medium text-text-muted"
                >
                    {affiliation.name}
                </Badge>
            ))}
        </div>
    )
}

function RowActions({ streamer, onDelete, onRefresh }: Pick<StreamerRowProps, 'streamer' | 'onDelete' | 'onRefresh'>) {
    return (
        <div className="flex items-center justify-center gap-1">
            <Button
                variant="ghost"
                size="icon-sm"
                className="cursor-pointer text-text-muted hover:bg-primary/10 hover:text-primary"
                onClick={(event) => {
                    event.stopPropagation()
                    onRefresh(streamer)
                }}
                aria-label={`${streamer.name} 새로고침`}
            >
                <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="icon-sm"
                className="cursor-pointer text-text-muted hover:bg-live/10 hover:text-live"
                onClick={(event) => {
                    event.stopPropagation()
                    onDelete(streamer)
                }}
                aria-label={`${streamer.name} 삭제`}
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    )
}

function StreamerTableRow({ streamer, onDelete, onRefresh, onCopyChannelId, onRowClick, searchQuery = '' }: StreamerRowProps) {
    return (
        <TableRow
            className="cursor-pointer border-b border-border/70 transition hover:bg-primary/5 last:border-0"
            onClick={() => onRowClick(streamer)}
        >
            <TableCell className="py-4 pl-5 pr-5">
                <StreamerAvatar streamer={streamer} />
            </TableCell>
            <TableCell className="py-4 pl-3 pr-5">
                <StreamerIdentity streamer={streamer} searchQuery={searchQuery} />
            </TableCell>
            <TableCell className="hidden py-4 pr-5 sm:table-cell">
                <ChannelActions streamer={streamer} onCopyChannelId={onCopyChannelId} />
            </TableCell>
            <TableCell className="hidden py-4 pr-5 md:table-cell">
                <div className="flex items-center justify-end gap-1.5 text-right">
                    <span className="font-semibold tabular-nums text-text">{formatFollowerCount(streamer.followerCount)}</span>
                    {streamer.followerCount !== null && streamer.followerCount >= 1000000 && (
                        <span className="rounded-full border border-collab/30 bg-collab/10 px-1.5 py-0.5 text-[10px] font-semibold text-collab">
                            TOP
                        </span>
                    )}
                </div>
            </TableCell>
            <TableCell className="hidden py-4 pr-5 whitespace-normal lg:table-cell">
                <AffiliationBadges streamer={streamer} />
            </TableCell>
            <TableCell className="py-4 pr-5">
                <RowActions streamer={streamer} onDelete={onDelete} onRefresh={onRefresh} />
            </TableCell>
        </TableRow>
    )
}

function StreamerMobileCard({ streamer, onRowClick, searchQuery = '' }: Pick<StreamerRowProps, 'streamer' | 'onRowClick' | 'searchQuery'>) {
    const displayName = streamer.nickname?.trim() || streamer.name

    return (
        <div
            role="button"
            tabIndex={0}
            aria-label={`${streamer.name} 상세 보기`}
            onClick={() => onRowClick(streamer)}
            onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onRowClick(streamer)
                }
            }}
            className="w-full cursor-pointer rounded-2xl border border-border bg-bg-secondary/70 p-2.5 text-left transition hover:border-primary/40 hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
            <div className="flex items-center gap-4">
                <StreamerAvatar streamer={streamer} />
                <div className="min-w-0 flex-1 space-y-1.5">
                    <span className="block truncate text-sm font-bold text-text">
                        <HighlightedText text={displayName} query={searchQuery} />
                    </span>
                    <StreamerTraitChips streamer={streamer} compact />
                </div>
            </div>
        </div>
    )
}
