import { Archive, Bot, GitCompareArrows, GraduationCap, ListChecks, ShieldBan, Tags } from 'lucide-react'
import { useRef, type KeyboardEvent } from 'react'
import type { CrawlerWorkspaceTab } from '../../types/crawlerReview'
import { cn } from '../../lib/cn'

interface CrawlerReviewTabsProps {
    activeTab: CrawlerWorkspaceTab
    onChange: (tab: CrawlerWorkspaceTab) => void
}

const TABS: { id: CrawlerWorkspaceTab; label: string; shortLabel: string; icon: typeof ListChecks }[] = [
    { id: 'review', label: '탐지 현황', shortLabel: '탐지', icon: ListChecks },
    { id: 'changes', label: '변경 작업', shortLabel: '변경', icon: GitCompareArrows },
    { id: 'auto-audit', label: '자동 반영 확인', shortLabel: '자동', icon: Bot },
    { id: 'completed', label: '완료', shortLabel: '완료', icon: Archive },
    { id: 'exclusions', label: '제외 규칙', shortLabel: '제외', icon: ShieldBan },
    { id: 'aliases', label: '별칭', shortLabel: '별칭', icon: Tags },
    { id: 'learning', label: '학습 원장', shortLabel: '학습', icon: GraduationCap },
]

export function CrawlerReviewTabs({ activeTab, onChange }: CrawlerReviewTabsProps) {
    const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

    function moveFocus(event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) {
        let nextIndex = currentIndex
        if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % TABS.length
        else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + TABS.length) % TABS.length
        else if (event.key === 'Home') nextIndex = 0
        else if (event.key === 'End') nextIndex = TABS.length - 1
        else return

        event.preventDefault()
        const nextTab = TABS[nextIndex]
        onChange(nextTab.id)
        tabRefs.current[nextIndex]?.focus()
        tabRefs.current[nextIndex]?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    }

    return (
        <div className="min-w-0">
            <div
                className="grid min-w-0 grid-cols-4 gap-1 rounded-[var(--radius-card)] border border-border bg-bg-secondary p-1 sm:flex"
                role="tablist"
                aria-label="크롤러 검토 작업 영역"
            >
                {TABS.map((tab, index) => {
                    const active = tab.id === activeTab
                    return (
                        <button
                            key={tab.id}
                            ref={(element) => {
                                tabRefs.current[index] = element
                            }}
                            id={`crawler-tab-${tab.id}`}
                            type="button"
                            role="tab"
                            tabIndex={active ? 0 : -1}
                            aria-selected={active}
                            aria-controls={`crawler-panel-${tab.id}`}
                            onClick={() => onChange(tab.id)}
                            onKeyDown={(event) => moveFocus(event, index)}
                            className={cn(
                                'group flex min-h-10 min-w-0 items-center justify-center gap-1 whitespace-nowrap rounded-[var(--radius-input)] px-1 text-xs font-semibold tracking-tight transition-[background-color,color] duration-[var(--dur-micro)] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:gap-2 sm:px-3',
                                active ? 'bg-card text-primary' : 'text-text-dim hover:bg-card-hover hover:text-text',
                            )}
                        >
                            <tab.icon className="h-3.5 w-3.5" aria-hidden="true" />
                            <span className="hidden sm:inline">{tab.label}</span>
                            <span className="sm:hidden">{tab.shortLabel}</span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
