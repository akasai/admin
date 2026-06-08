import type { StreamerStats as StreamerStatsType } from '@/types/streamer'

interface StreamerStatsProps {
    stats: StreamerStatsType | undefined
    isLoading?: boolean
}

export function StreamerStats({ stats, isLoading }: StreamerStatsProps) {
    if (isLoading || !stats) {
        return (
            <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="text-text-muted">로딩 중...</span>
            </div>
        )
    }

    return (
        <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="text-text-muted">
                전체 <span className="font-semibold text-text">{stats.total}</span>명
            </span>
            <span className="text-text-muted">
                파트너 <span className="font-semibold text-yellow-500">{stats.partner}</span>명
            </span>
            <span className="text-text-muted">
                버튜버 <span className="font-semibold text-purple-500">{stats.vtuber}</span>명
            </span>
        </div>
    )
}
