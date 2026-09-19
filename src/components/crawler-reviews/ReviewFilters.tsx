import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { inputClass, selectClass } from '../../constants/styles'
import { cn } from '../../lib/cn'
import type { CrawlerContentType, CrawlerDecisionState, CrawlerReviewRisk } from '../../types/crawlerReview'
import { Button } from '../ui/Button'
import { CONTENT_TYPE_FILTER_OPTIONS, CONTENT_TYPE_LABELS, DECISION_FILTER_OPTIONS, DECISION_LABELS } from './reviewLabels'

interface ReviewFiltersProps {
    query: string
    decisionState?: CrawlerDecisionState
    contentType?: CrawlerContentType
    risk?: CrawlerReviewRisk
    onChange: (filters: { query: string; decisionState: string; contentType: string; risk: string }) => void
}

export function ReviewFilters({ query, decisionState, contentType, risk, onChange }: ReviewFiltersProps) {
    const [draftQuery, setDraftQuery] = useState(query)
    const [filtersOpen, setFiltersOpen] = useState(() => window.matchMedia('(min-width: 768px)').matches)
    const activeFilterCount = [decisionState, contentType, risk].filter((value) => value !== undefined).length
    const hasFilters = query.length > 0 || activeFilterCount > 0

    useEffect(() => setDraftQuery(query), [query])
    useEffect(() => {
        const media = window.matchMedia('(min-width: 768px)')
        const syncToViewport = () => setFiltersOpen(media.matches)
        syncToViewport()
        media.addEventListener('change', syncToViewport)
        return () => media.removeEventListener('change', syncToViewport)
    }, [])

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const form = new FormData(event.currentTarget)
        onChange({
            query: draftQuery.trim(),
            decisionState: String(form.get('decisionState') ?? ''),
            contentType: String(form.get('contentType') ?? ''),
            risk: String(form.get('risk') ?? ''),
        })
    }

    function resetFilters() {
        setDraftQuery('')
        onChange({ query: '', decisionState: '', contentType: '', risk: '' })
    }

    return (
        <form
            onSubmit={submit}
            className="min-w-0 rounded-[var(--radius-card)] border border-border bg-bg-secondary p-3"
            aria-label="검토 큐 필터"
        >
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_2.5rem_auto] gap-2">
                <label className="relative block min-w-0">
                    <span className="sr-only">현재 페이지 제목 또는 참여자 검색</span>
                    <Search
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim"
                        aria-hidden="true"
                    />
                    <input
                        value={draftQuery}
                        onChange={(event) => setDraftQuery(event.target.value)}
                        className={`${inputClass} min-w-0 pl-9`}
                        placeholder="제목·참여자 검색"
                        maxLength={120}
                    />
                </label>
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="relative"
                    aria-label={`필터 ${activeFilterCount}`}
                    aria-expanded={filtersOpen}
                    aria-controls="crawler-review-filter-fields"
                    onClick={() => setFiltersOpen((open) => !open)}
                >
                    <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                    {activeFilterCount > 0 && (
                        <span
                            aria-hidden="true"
                            className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-ink"
                        >
                            {activeFilterCount}
                        </span>
                    )}
                </Button>
                <Button type="submit" size="md">
                    적용
                </Button>
            </div>

            <div
                id="crawler-review-filter-fields"
                className={cn('mt-2 min-w-0 gap-2 md:grid-cols-2 lg:grid-cols-3', filtersOpen ? 'grid' : 'hidden')}
            >
                <label>
                    <span className="sr-only">판정 상태</span>
                    <select
                        name="decisionState"
                        defaultValue={decisionState ?? ''}
                        key={`state-${decisionState ?? ''}`}
                        className={selectClass}
                    >
                        <option value="">모든 판정</option>
                        {DECISION_FILTER_OPTIONS.map((value) => (
                            <option key={value} value={value}>
                                {DECISION_LABELS[value]}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    <span className="sr-only">콘텐츠 유형</span>
                    <select
                        name="contentType"
                        defaultValue={contentType ?? ''}
                        key={`content-${contentType ?? ''}`}
                        className={selectClass}
                    >
                        <option value="">모든 유형</option>
                        {CONTENT_TYPE_FILTER_OPTIONS.map((value) => (
                            <option key={value} value={value}>
                                {CONTENT_TYPE_LABELS[value]}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    <span className="sr-only">준비 상태</span>
                    <select name="risk" defaultValue={risk ?? ''} key={`risk-${risk ?? ''}`} className={selectClass}>
                        <option value="">모든 준비 상태</option>
                        <option value="failed">반영 실패</option>
                        <option value="unprepared">초안 미생성</option>
                        <option value="incomplete">필수 정보 부족</option>
                        <option value="ready">기본 정보 준비됨</option>
                    </select>
                </label>
            </div>

            {hasFilters && (
                <div className="mt-2 flex min-w-0 items-center justify-between gap-2 border-t border-border pt-2">
                    <span className="text-xs font-semibold text-text-muted">필터 {activeFilterCount}</span>
                    <Button type="button" variant="ghost" size="sm" leftIcon={<X className="h-4 w-4" />} onClick={resetFilters}>
                        초기화
                    </Button>
                </div>
            )}
            <p className="mt-2 text-[11px] leading-relaxed text-text-dim">
                검색·판정·유형·준비 상태는 현재 서버 페이지에만 적용됩니다. 다음 페이지에 일치 항목이 남아 있을 수 있습니다.
            </p>
        </form>
    )
}
