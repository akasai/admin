/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V4 */
import { AlertTriangle, ChevronRight } from 'lucide-react'
import { ListEmpty, ListError, ListLoading } from '../ListState'
import { Button } from '../ui/Button'
import { cn } from '../../lib/cn'
import type { CrawlerReviewListItem } from '../../types/crawlerReview'
import { ASSESSMENT_DECISION_LABELS, DECISION_LABELS, assessmentReasonLabel } from './reviewLabels'

interface ReviewListProps {
    items: CrawlerReviewListItem[]
    isLoading: boolean
    isError: boolean
    selectedId: string | null
    checkedIds: string[]
    nextCursor: string | null
    hasCursor: boolean
    onRetry: () => void
    onSelect: (id: string) => void
    onToggleChecked: (id: string) => void
    onCheckPage: (ids: string[]) => void
    onNext: () => void
    onFirst: () => void
}

function reviewAttentionLabel(item: CrawlerReviewListItem): string | null {
    if (item.readiness.failed) return '반영 실패'
    if (item.readiness.state === 'INCOMPLETE') return '초안 정보 부족'
    if (item.assessment.decision !== item.decisionState) return `운영 이력 · ${DECISION_LABELS[item.decisionState]}`
    return null
}

function AssessmentSummary({ item }: { item: CrawlerReviewListItem }) {
    const attention = reviewAttentionLabel(item)
    return (
        <div className="min-w-0">
            <span className="block text-[10px] font-semibold text-text-dim">최신 자동 판정</span>
            <span className="mt-0.5 block truncate text-xs font-bold text-primary">
                {ASSESSMENT_DECISION_LABELS[item.assessment.decision]}
            </span>
            <span className="mt-1 block line-clamp-2 break-words text-[11px] leading-4 text-text-muted">
                {assessmentReasonLabel(item.assessment)}
            </span>
            {attention !== null && (
                <span className="mt-1.5 flex min-w-0 items-center gap-1 text-[11px] text-[var(--color-warning)]">
                    <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />
                    <span className="truncate">{attention}</span>
                </span>
            )}
        </div>
    )
}

export function ReviewList({
    items,
    isLoading,
    isError,
    selectedId,
    checkedIds,
    nextCursor,
    hasCursor,
    onRetry,
    onSelect,
    onToggleChecked,
    onCheckPage,
    onNext,
    onFirst,
}: ReviewListProps) {
    if (isLoading) return <ListLoading className="py-10" rows={6} />
    if (isError) return <ListError message="검토 큐를 불러오지 못했습니다." onRetry={onRetry} />
    if (items.length === 0) {
        return (
            <div className="min-w-0">
                <ListEmpty message="현재 페이지의 조건에 맞는 검토 항목이 없습니다." />
                <div className="flex items-center justify-between border-t border-border p-3">
                    <Button type="button" size="sm" variant="ghost" disabled={!hasCursor} onClick={onFirst}>
                        처음으로
                    </Button>
                    <Button type="button" size="sm" variant="outline" disabled={nextCursor === null} onClick={onNext}>
                        다음 페이지
                    </Button>
                </div>
            </div>
        )
    }

    const pageIds = items.filter((item) => item.decisionState === 'REVIEW').map((item) => item.detectionId)
    const pageChecked = pageIds.length > 0 && pageIds.every((id) => checkedIds.includes(id))

    return (
        <div className="min-w-0">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <label className="flex min-h-10 cursor-pointer items-center gap-2 text-xs text-text-muted">
                    <input
                        type="checkbox"
                        checked={pageChecked}
                        onChange={() =>
                            onCheckPage(
                                pageChecked
                                    ? checkedIds.filter((id) => !pageIds.includes(id))
                                    : Array.from(new Set([...checkedIds, ...pageIds])),
                            )
                        }
                        className="h-4 w-4 accent-primary"
                    />
                    이 페이지 선택
                </label>
                <span className="text-[11px] tabular-nums text-text-dim">{items.length}개 표시</span>
            </div>

            <div className="divide-y divide-border md:hidden lg:block">
                {items.map((item) => (
                    <article
                        key={item.detectionId}
                        className={cn('relative p-2.5', selectedId === item.detectionId ? 'bg-card' : 'bg-bg-secondary')}
                    >
                        <div className="flex gap-2">
                            <label
                                className={cn(
                                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-md focus-within:ring-2 focus-within:ring-primary',
                                    item.decisionState === 'REVIEW' ? 'cursor-pointer' : 'cursor-not-allowed opacity-40',
                                )}
                            >
                                <input
                                    type="checkbox"
                                    disabled={item.decisionState !== 'REVIEW'}
                                    checked={checkedIds.includes(item.detectionId)}
                                    onChange={() => onToggleChecked(item.detectionId)}
                                    className="h-4 w-4 accent-primary"
                                />
                                <span className="sr-only">{item.normalizedTitle ?? '제목 없는 탐지'} 일괄 선택</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => onSelect(item.detectionId)}
                                className="min-w-0 flex-1 rounded-[var(--radius-input)] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                                <div className="flex min-w-0 items-start justify-between gap-2">
                                    <p className="line-clamp-2 min-w-0 break-words text-sm font-semibold leading-5 text-text">
                                        {item.normalizedTitle ?? '제목 보존 기간 만료'}
                                    </p>
                                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-text-dim" />
                                </div>
                                <div className="mt-1 flex min-w-0 items-center gap-1.5 text-[11px] leading-4">
                                    <span className="max-w-28 shrink-0 truncate rounded bg-category px-1.5 py-0.5 text-text-muted">
                                        {item.category ?? '카테고리 없음'}
                                    </span>
                                    <span className="text-border" aria-hidden="true">
                                        ·
                                    </span>
                                    <span className="min-w-0 truncate text-text-muted">
                                        {item.participantNames.join(' · ') || '참여자 정보 없음'}
                                    </span>
                                </div>
                                <div className="mt-2">
                                    <AssessmentSummary item={item} />
                                </div>
                            </button>
                        </div>
                    </article>
                ))}
            </div>

            <div className="hidden overflow-x-auto md:block lg:hidden">
                <table className="w-full text-left text-xs">
                    <thead className="bg-bg text-[10px] uppercase tracking-[var(--tracking-label)] text-text-dim">
                        <tr>
                            <th className="w-10 px-3 py-3">
                                <span className="sr-only">선택</span>
                            </th>
                            <th className="min-w-64 px-3 py-3 font-semibold">탐지</th>
                            <th className="min-w-44 px-3 py-3 font-semibold">추천</th>
                            <th className="w-10 px-3 py-3">
                                <span className="sr-only">상세</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {items.map((item) => (
                            <tr key={item.detectionId} className={cn('hover:bg-card-hover', selectedId === item.detectionId && 'bg-card')}>
                                <td className="px-2 py-2 align-top">
                                    <label
                                        className={cn(
                                            'flex h-10 w-10 items-center justify-center rounded-md focus-within:ring-2 focus-within:ring-primary',
                                            item.decisionState === 'REVIEW' ? 'cursor-pointer' : 'cursor-not-allowed opacity-40',
                                        )}
                                    >
                                        <input
                                            type="checkbox"
                                            disabled={item.decisionState !== 'REVIEW'}
                                            checked={checkedIds.includes(item.detectionId)}
                                            onChange={() => onToggleChecked(item.detectionId)}
                                            className="h-4 w-4 accent-primary"
                                        />
                                        <span className="sr-only">{item.normalizedTitle ?? '제목 없는 탐지'} 일괄 선택</span>
                                    </label>
                                </td>
                                <td className="px-3 py-3">
                                    <button
                                        type="button"
                                        onClick={() => onSelect(item.detectionId)}
                                        className="block max-w-xs rounded-[var(--radius-input)] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                    >
                                        <span className="line-clamp-1 font-semibold text-text">
                                            {item.normalizedTitle ?? '제목 보존 기간 만료'}
                                        </span>
                                        <span className="mt-1 block max-w-xs truncate text-[11px] text-text-dim">
                                            {item.category ?? '카테고리 없음'} · {item.participantNames.join(' · ') || '참여자 정보 없음'}
                                        </span>
                                    </button>
                                </td>
                                <td className="px-3 py-3">
                                    <AssessmentSummary item={item} />
                                </td>
                                <td className="px-3 py-3">
                                    <button
                                        type="button"
                                        onClick={() => onSelect(item.detectionId)}
                                        aria-label="상세 보기"
                                        className="min-h-10 min-w-10 rounded-[var(--radius-input)] text-text-dim hover:bg-card-hover hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-between border-t border-border p-3">
                <Button type="button" size="sm" variant="ghost" disabled={!hasCursor} onClick={onFirst}>
                    처음으로
                </Button>
                <Button type="button" size="sm" variant="outline" disabled={nextCursor === null} onClick={onNext}>
                    다음 페이지
                </Button>
            </div>
        </div>
    )
}
