import { Crown, Radio, Users } from 'lucide-react'

import type { StreamerStats as StreamerStatsType } from '@/types/streamer'

interface StreamerStatsProps {
    stats: StreamerStatsType | undefined
    isLoading?: boolean
}

export function StreamerStats({ stats, isLoading }: StreamerStatsProps) {
    if (isLoading || !stats) {
        return (
            <div className="flex flex-wrap items-center gap-2">
                {Array.from({ length: 3 }, (_, index) => (
                    <div key={index} className="h-9 w-24 animate-pulse rounded-full border border-border bg-card-hover" />
                ))}
            </div>
        )
    }

    const items = [
        { label: '전체', value: stats.total, icon: Users, tone: 'text-text' },
        { label: '파트너', value: stats.partner, icon: Crown, tone: 'text-primary' },
        { label: '버튜버', value: stats.vtuber, icon: Radio, tone: 'text-collab' },
    ]

    return (
        <div className="flex flex-wrap items-center gap-2">
            {items.map((item) => (
                <div
                    key={item.label}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-2 shadow-card"
                >
                    <item.icon className={`h-3.5 w-3.5 ${item.tone}`} />
                    <span className="text-xs font-medium text-text-muted">{item.label}</span>
                    <span className={`text-sm font-bold tabular-nums ${item.tone}`}>{item.value.toLocaleString('ko-KR')}</span>
                </div>
            ))}
        </div>
    )
}
