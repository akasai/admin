import { ArrowDown, ArrowUp, ArrowUpDown, Copy, ExternalLink, RefreshCw, Trash2 } from 'lucide-react'

import { Button } from '@/components/shadcn/ui/button'
import { Badge } from '@/components/shadcn/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/shadcn/ui/table'
import type { StreamerItem } from '@/types/streamer'
import { formatFollowerCount, getStreamerTypeBadgeClass, getStreamerTypeLabel } from './utils'
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
}

interface SortableHeaderProps {
    field: SortField
    currentField: SortField
    currentDirection: SortDirection
    onSort: (field: SortField, direction: SortDirection) => void
    className?: string
    children: React.ReactNode
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
                className="inline-flex cursor-pointer items-center gap-1 font-semibold transition-colors hover:text-primary"
            >
                {children}
                {isActive ? (
                    currentDirection === 'asc' ? (
                        <ArrowUp className="h-3.5 w-3.5 text-primary" />
                    ) : (
                        <ArrowDown className="h-3.5 w-3.5 text-primary" />
                    )
                ) : (
                    <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
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
}: StreamerTableProps) {
    return (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <Table className="table-fixed">
                <TableHeader>
                    <TableRow className="border-b border-border bg-card-hover/50 hover:bg-card-hover/50">
                        <TableHead className="w-[70px] py-4 pl-4">아바타</TableHead>
                        <SortableHeader
                            field="name"
                            currentField={sortField}
                            currentDirection={sortDirection}
                            onSort={onSortChange}
                            className="min-w-[140px] py-4"
                        >
                            이름
                        </SortableHeader>
                        <TableHead className="hidden w-[180px] py-4 font-semibold sm:table-cell">채널 ID</TableHead>
                        <SortableHeader
                            field="followerCount"
                            currentField={sortField}
                            currentDirection={sortDirection}
                            onSort={onSortChange}
                            className="hidden w-[100px] py-4 md:table-cell"
                        >
                            팔로워
                        </SortableHeader>
                        <TableHead className="hidden min-w-[120px] py-4 font-semibold lg:table-cell">소속</TableHead>
                        <TableHead className="w-[80px] py-4 pr-4 text-center font-semibold">작업</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {streamers.map((streamer, index) => (
                        <StreamerTableRow
                            key={streamer.id}
                            streamer={streamer}
                            isEven={index % 2 === 1}
                            onDelete={onDelete}
                            onRefresh={onRefresh}
                            onCopyChannelId={onCopyChannelId}
                            onRowClick={onRowClick}
                        />
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

interface StreamerTableRowProps {
    streamer: StreamerItem
    isEven: boolean
    onDelete: (streamer: StreamerItem) => void
    onRefresh: (streamer: StreamerItem) => void
    onCopyChannelId: (channelId: string) => void
    onRowClick: (streamer: StreamerItem) => void
}

function StreamerTableRow({
    streamer,
    isEven,
    onDelete,
    onRefresh,
    onCopyChannelId,
    onRowClick,
}: StreamerTableRowProps) {
    const typeLabel = getStreamerTypeLabel(streamer.streamerType)
    const typeBadgeClass = getStreamerTypeBadgeClass(streamer.streamerType)
    const hasNickname = streamer.nickname && streamer.nickname !== streamer.name

    return (
        <TableRow
            className={`cursor-pointer border-b border-border/50 transition-colors last:border-0 hover:bg-primary/5 ${isEven ? 'bg-card-hover/30' : ''}`}
            onClick={() => onRowClick(streamer)}
        >
            <TableCell className="py-3 pl-4">
                <div className="group relative">
                    <div className="relative h-11 w-11 overflow-hidden rounded-full bg-gradient-to-br from-primary/20 to-primary/5 ring-2 ring-border transition-all group-hover:ring-primary/50">
                        {streamer.channelImageUrl ? (
                            <img
                                src={streamer.channelImageUrl}
                                alt={streamer.name}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/30 to-primary/10 text-sm font-bold text-primary">
                                {streamer.name.charAt(0)}
                            </div>
                        )}
                    </div>
                    {streamer.isPartner && (
                        <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-card p-0.5 shadow-sm">
                            <img src={partnerMark} alt="파트너" className="h-4 w-4" />
                        </div>
                    )}
                </div>
            </TableCell>

            <TableCell className="py-3">
                <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-semibold text-text">{streamer.name}</span>
                        {typeLabel && (
                            <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${typeBadgeClass}`}>
                                {typeLabel}
                            </span>
                        )}
                        {streamer.isProGamer && (
                            <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                                프로게이머
                            </span>
                        )}
                    </div>
                    {hasNickname && (
                        <p className="text-xs text-text-muted">{streamer.nickname}</p>
                    )}
                </div>
            </TableCell>

            <TableCell className="hidden py-3 sm:table-cell">
                {streamer.channelId ? (
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onCopyChannelId(streamer.channelId!) }}
                            className="group inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border/50 bg-card-hover/50 px-2 py-1 font-mono text-xs text-text-muted transition-all hover:border-primary/50 hover:bg-primary/10 hover:text-text"
                        >
                            <span className="max-w-[100px] truncate">{streamer.channelId}</span>
                            <Copy className="h-3 w-3 shrink-0 opacity-50 transition-opacity group-hover:opacity-100" />
                        </button>
                        <Button
                            variant="ghost"
                            size="icon-xs"
                            className="cursor-pointer text-blue-400 transition-colors hover:bg-blue-500/10 hover:text-blue-500"
                            onClick={(e) => { e.stopPropagation(); window.open(`https://chzzk.naver.com/${streamer.channelId}`, '_blank') }}
                        >
                            <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                ) : (
                    <span className="text-xs text-text-muted/50">-</span>
                )}
            </TableCell>

            <TableCell className="hidden py-3 md:table-cell">
                <div className="flex items-center gap-1.5">
                    <span className="font-medium tabular-nums text-text">
                        {formatFollowerCount(streamer.followerCount)}
                    </span>
                    {streamer.followerCount && streamer.followerCount >= 1000000 && (
                        <span className="rounded bg-yellow-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-500">
                            TOP
                        </span>
                    )}
                </div>
            </TableCell>

            <TableCell className="hidden py-3 lg:table-cell">
                {streamer.affiliations.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                        {streamer.affiliations.map((aff) => (
                            <Badge 
                                key={aff.id} 
                                variant="secondary" 
                                className="rounded-md border border-border/50 bg-card-hover text-[10px] font-medium"
                            >
                                {aff.name}
                            </Badge>
                        ))}
                    </div>
                ) : (
                    <span className="text-xs text-text-muted/50">-</span>
                )}
            </TableCell>

            <TableCell className="py-3 pr-4">
                <div className="flex items-center justify-center gap-0.5">
                    <Button
                        variant="ghost"
                        size="icon-xs"
                        className="cursor-pointer text-text-muted transition-colors hover:bg-primary/10 hover:text-primary"
                        onClick={(e) => { e.stopPropagation(); onRefresh(streamer) }}
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon-xs"
                        className="cursor-pointer text-text-muted transition-colors hover:bg-red-500/10 hover:text-red-500"
                        onClick={(e) => { e.stopPropagation(); onDelete(streamer) }}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    )
}
