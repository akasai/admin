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

export interface HighlightSegment {
    text: string
    highlighted: boolean
}

const CHOSUNG_PATTERN = /^[ㄱ-ㅎ]+$/
const HANGUL_BASE_CODE = 0xac00
const HANGUL_END_CODE = 0xd7a3
const HANGUL_CHOSUNG = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']

export function segmentStreamerHighlight(text: string, query: string): HighlightSegment[] {
    const trimmedQuery = query.trim()
    if (trimmedQuery.length === 0) return [{ text, highlighted: false }]

    if (CHOSUNG_PATTERN.test(trimmedQuery)) {
        return segmentByChosung(text, trimmedQuery)
    }

    return segmentBySubstring(text, trimmedQuery)
}

function segmentBySubstring(text: string, query: string): HighlightSegment[] {
    const index = text.toLocaleLowerCase('ko-KR').indexOf(query.toLocaleLowerCase('ko-KR'))
    if (index === -1) return [{ text, highlighted: false }]

    return withoutEmptySegments([
        { text: text.slice(0, index), highlighted: false },
        { text: text.slice(index, index + query.length), highlighted: true },
        { text: text.slice(index + query.length), highlighted: false },
    ])
}

function segmentByChosung(text: string, query: string): HighlightSegment[] {
    const hangulPositions: number[] = []
    let chosungText = ''

    for (let index = 0; index < text.length; index += 1) {
        const code = text.charCodeAt(index)
        if (code >= HANGUL_BASE_CODE && code <= HANGUL_END_CODE) {
            hangulPositions.push(index)
            chosungText += HANGUL_CHOSUNG[Math.floor((code - HANGUL_BASE_CODE) / 588)]
        }
    }

    const matchStart = chosungText.indexOf(query)
    if (matchStart === -1 || matchStart + query.length - 1 >= hangulPositions.length) return [{ text, highlighted: false }]

    const highlightStart = hangulPositions[matchStart]
    const highlightEnd = hangulPositions[matchStart + query.length - 1] + 1

    return withoutEmptySegments([
        { text: text.slice(0, highlightStart), highlighted: false },
        { text: text.slice(highlightStart, highlightEnd), highlighted: true },
        { text: text.slice(highlightEnd), highlighted: false },
    ])
}

function withoutEmptySegments(segments: HighlightSegment[]): HighlightSegment[] {
    return segments.filter((segment) => segment.text.length > 0)
}

export function getStreamerTypeLabel(type: 'cam' | 'vtuber' | 'hybrid'): string {
    switch (type) {
        case 'cam':
            return '캠'
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
        case 'cam':
            return 'border-border bg-category text-text-muted'
        case 'vtuber':
            return 'border-collab/30 bg-collab/15 text-collab'
        case 'hybrid':
            return 'border-primary/30 bg-primary/10 text-primary'
        default:
            return ''
    }
}
