import { useState } from 'react'
import { Crown, Filter, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/shadcn/ui/button'
import { Badge } from '@/components/shadcn/ui/badge'
import { cn } from '@/lib/cn'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/shadcn/ui/dialog'

export type StreamerTypeFilter = 'all' | 'cam' | 'vtuber' | 'hybrid'
export type PartnerFilter = 'all' | 'partner' | 'non-partner'

interface StreamerFiltersProps {
    typeFilter: StreamerTypeFilter
    partnerFilter: PartnerFilter
    onTypeFilterChange: (filter: StreamerTypeFilter) => void
    onPartnerFilterChange: (filter: PartnerFilter) => void
    onClearFilters: () => void
    className?: string
}

const typeOptions: { value: StreamerTypeFilter; label: string }[] = [
    { value: 'all', label: '전체' },
    { value: 'cam', label: '캠' },
    { value: 'vtuber', label: '버튜버' },
    { value: 'hybrid', label: '하이브리드' },
]

const partnerOptions: { value: PartnerFilter; label: string }[] = [
    { value: 'all', label: '전체' },
    { value: 'partner', label: '파트너' },
    { value: 'non-partner', label: '일반' },
]

export function StreamerFilters({
    typeFilter,
    partnerFilter,
    onTypeFilterChange,
    onPartnerFilterChange,
    onClearFilters,
    className,
}: StreamerFiltersProps) {
    const [mobileOpen, setMobileOpen] = useState(false)
    const hasActiveFilters = typeFilter !== 'all' || partnerFilter !== 'all'
    const activeFilterCount = (typeFilter !== 'all' ? 1 : 0) + (partnerFilter !== 'all' ? 1 : 0)

    const filterButtonClass = (active: boolean) =>
        cn(
            'cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 lg:py-1.5 lg:text-xs',
            active ? 'bg-primary text-bg shadow-card' : 'text-text-muted hover:bg-card-hover hover:text-text',
        )

    const FilterContent = ({ onClose }: { onClose?: () => void }) => (
        <div className="space-y-4">
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-text">
                    <Filter className="h-4 w-4" />
                    타입
                </div>
                <div className="flex flex-wrap gap-2">
                    {typeOptions.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                                onTypeFilterChange(option.value)
                            }}
                            className={filterButtonClass(typeFilter === option.value)}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-text">
                    <Crown className="h-4 w-4" />
                    파트너
                </div>
                <div className="flex flex-wrap gap-2">
                    {partnerOptions.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                                onPartnerFilterChange(option.value)
                            }}
                            className={filterButtonClass(partnerFilter === option.value)}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {onClose && (
                <div className="flex gap-2 pt-2">
                    {hasActiveFilters && (
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                                onClearFilters()
                            }}
                        >
                            초기화
                        </Button>
                    )}
                    <Button className="flex-1" onClick={onClose}>
                        적용
                    </Button>
                </div>
            )}
        </div>
    )

    return (
        <div className={cn('space-y-3', className)}>
            <div className="lg:hidden">
                <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
                    <DialogTrigger asChild>
                        <Button
                            variant="outline"
                            className="h-11 gap-2 rounded-xl border-border bg-card-hover text-text hover:bg-card-hover/80"
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                            필터
                            {activeFilterCount > 0 && (
                                <Badge variant="default" className="ml-1 h-5 min-w-5 bg-primary px-1.5 text-bg">
                                    {activeFilterCount}
                                </Badge>
                            )}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="!top-auto !bottom-0 !translate-y-0 rounded-t-2xl rounded-b-none data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom sm:!top-[50%] sm:!bottom-auto sm:!translate-y-[-50%] sm:rounded-lg">
                        <DialogHeader>
                            <DialogTitle>필터</DialogTitle>
                            <DialogDescription>스트리머 타입과 파트너 여부로 목록을 좁힙니다.</DialogDescription>
                        </DialogHeader>
                        <FilterContent onClose={() => setMobileOpen(false)} />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="hidden lg:block">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 rounded-2xl border border-border bg-card/80 p-1.5 shadow-card">
                        <div className="flex shrink-0 items-center gap-2 px-2 text-sm font-medium text-text-muted">
                            <Filter className="h-4 w-4" />
                            <span>필터</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <div className="flex items-center rounded-xl bg-bg-secondary p-1">
                                {typeOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => onTypeFilterChange(option.value)}
                                        className={cn('whitespace-nowrap', filterButtonClass(typeFilter === option.value))}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center rounded-xl bg-bg-secondary p-1">
                                {partnerOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => onPartnerFilterChange(option.value)}
                                        className={cn('whitespace-nowrap', filterButtonClass(partnerFilter === option.value))}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
