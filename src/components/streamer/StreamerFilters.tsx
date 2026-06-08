import { useState } from 'react'
import { Crown, Filter, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/shadcn/ui/button'
import { Badge } from '@/components/shadcn/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/shadcn/ui/dialog'

export type StreamerTypeFilter = 'all' | 'cam' | 'vtuber' | 'hybrid'
export type PartnerFilter = 'all' | 'partner' | 'non-partner'

interface StreamerFiltersProps {
    typeFilter: StreamerTypeFilter
    partnerFilter: PartnerFilter
    onTypeFilterChange: (filter: StreamerTypeFilter) => void
    onPartnerFilterChange: (filter: PartnerFilter) => void
    onClearFilters: () => void
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
}: StreamerFiltersProps) {
    const [mobileOpen, setMobileOpen] = useState(false)
    const hasActiveFilters = typeFilter !== 'all' || partnerFilter !== 'all'
    const activeFilterCount = (typeFilter !== 'all' ? 1 : 0) + (partnerFilter !== 'all' ? 1 : 0)

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
                            className={`cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                typeFilter === option.value
                                    ? 'bg-primary text-white'
                                    : 'bg-card-hover text-text-muted hover:text-text'
                            }`}
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
                            className={`cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                partnerFilter === option.value
                                    ? 'bg-primary text-white'
                                    : 'bg-card-hover text-text-muted hover:text-text'
                            }`}
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
        <div className="space-y-3">
            <div className="lg:hidden">
                <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="gap-2">
                            <SlidersHorizontal className="h-4 w-4" />
                            필터
                            {activeFilterCount > 0 && (
                                <Badge variant="default" className="ml-1 h-5 min-w-5 px-1.5">
                                    {activeFilterCount}
                                </Badge>
                            )}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="!top-auto !bottom-0 !translate-y-0 rounded-t-2xl rounded-b-none data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom sm:!top-[50%] sm:!bottom-auto sm:!translate-y-[-50%] sm:rounded-lg">
                        <DialogHeader>
                            <DialogTitle>필터</DialogTitle>
                        </DialogHeader>
                        <FilterContent onClose={() => setMobileOpen(false)} />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="hidden lg:block">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex shrink-0 items-center gap-2 text-sm text-text-muted">
                            <Filter className="h-4 w-4" />
                            <span>필터</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center rounded-lg border border-border bg-card p-1">
                                {typeOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => onTypeFilterChange(option.value)}
                                        className={`cursor-pointer whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                                            typeFilter === option.value
                                                ? 'bg-primary text-white'
                                                : 'text-text-muted hover:bg-card-hover hover:text-text'
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center rounded-lg border border-border bg-card p-1">
                                {partnerOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => onPartnerFilterChange(option.value)}
                                        className={`cursor-pointer whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                                            partnerFilter === option.value
                                                ? 'bg-primary text-white'
                                                : 'text-text-muted hover:bg-card-hover hover:text-text'
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {hasActiveFilters && (
                <div className="hidden items-center gap-2 lg:flex">
                    <div className="flex flex-wrap items-center gap-1.5">
                        {typeFilter !== 'all' && (
                            <Badge variant="secondary" className="gap-1 pl-2 pr-1">
                                {typeOptions.find((o) => o.value === typeFilter)?.label}
                                <button
                                    type="button"
                                    onClick={() => onTypeFilterChange('all')}
                                    className="cursor-pointer rounded-full p-0.5 hover:bg-card-hover"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        )}
                        {partnerFilter !== 'all' && (
                            <Badge variant="secondary" className="gap-1 pl-2 pr-1">
                                {partnerOptions.find((o) => o.value === partnerFilter)?.label}
                                <button
                                    type="button"
                                    onClick={() => onPartnerFilterChange('all')}
                                    className="cursor-pointer rounded-full p-0.5 hover:bg-card-hover"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearFilters}
                        className="h-7 cursor-pointer px-2 text-xs text-text-muted hover:text-text"
                    >
                        초기화
                    </Button>
                </div>
            )}
        </div>
    )
}
