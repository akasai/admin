export function formatFollowerCount(count: number | null): string {
    if (count === null) return '-'
    if (count >= 1000000) {
        return `${(count / 1000000).toFixed(1)}M`
    }
    if (count >= 1000) {
        return `${(count / 1000).toFixed(1)}K`
    }
    return count.toLocaleString('ko-KR')
}

export function getStreamerTypeLabel(type: 'cam' | 'vtuber' | 'hybrid'): string {
    switch (type) {
        case 'vtuber':
            return '버튜버'
        case 'hybrid':
            return '하이브리드'
        default:
            return ''
    }
}

export function getStreamerTypeBadgeClass(type: 'cam' | 'vtuber' | 'hybrid'): string {
    switch (type) {
        case 'vtuber':
            return 'bg-purple-500/20 text-purple-400'
        case 'hybrid':
            return 'bg-blue-500/20 text-blue-400'
        default:
            return ''
    }
}
