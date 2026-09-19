import { Check, ChevronDown, Search } from 'lucide-react'
import { Popover } from 'radix-ui'
import { useId, useMemo, useRef, useState } from 'react'
import { inputClass } from '../../constants/styles'
import { cn } from '../../lib/cn'

const CATEGORY_SEARCH_RESULT_LIMIT = 20

interface CategorySearchPickerProps {
    categories: { id: number; name: string }[]
    selectedId: string
    onChange: (categoryId: string) => void
    disabled?: boolean
    placeholder?: string
}

export function CategorySearchPicker({
    categories,
    selectedId,
    onChange,
    disabled = false,
    placeholder = '검색하여 선택',
}: CategorySearchPickerProps) {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const fieldId = useId()
    const resultStatusId = useId()
    const searchInputRef = useRef<HTMLInputElement>(null)
    const selectedCategory = categories.find((category) => String(category.id) === selectedId)
    const selectedName = selectedCategory?.name ?? (selectedId.length > 0 ? `카테고리 #${selectedId}` : '선택 안 함')
    const searchResults = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase()
        const matches =
            normalizedQuery.length === 0
                ? categories
                : categories.filter((category) => category.name.toLowerCase().includes(normalizedQuery))
        return { total: matches.length, items: matches.slice(0, CATEGORY_SEARCH_RESULT_LIMIT) }
    }, [categories, query])
    const resultStatus = !open
        ? ''
        : searchResults.total === 0
          ? '검색 결과가 없습니다.'
          : searchResults.total > CATEGORY_SEARCH_RESULT_LIMIT
            ? `${searchResults.total}개 중 ${CATEGORY_SEARCH_RESULT_LIMIT}개 표시 · 검색으로 좁혀 주세요.`
            : `${searchResults.total}개`

    function selectCategory(categoryId: string) {
        onChange(categoryId)
        setOpen(false)
        setQuery('')
    }

    return (
        <div className="min-w-0">
            <label htmlFor={fieldId} className="mb-1.5 block text-xs font-semibold text-text-muted">
                카테고리
            </label>
            <Popover.Root
                open={open}
                onOpenChange={(nextOpen) => {
                    if (disabled) return
                    setOpen(nextOpen)
                    if (!nextOpen) setQuery('')
                }}
            >
                <Popover.Trigger asChild>
                    <button
                        id={fieldId}
                        type="button"
                        disabled={disabled}
                        aria-label={`카테고리: ${selectedName}`}
                        className={cn(
                            inputClass,
                            'flex h-10 cursor-pointer items-center gap-2 py-0 text-left active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60',
                        )}
                    >
                        <span className={cn('min-w-0 flex-1 truncate', selectedId.length === 0 && 'text-text-dim')}>
                            {selectedId.length > 0 ? selectedName : placeholder}
                        </span>
                        <ChevronDown className="h-4 w-4 shrink-0 text-text-dim" aria-hidden="true" />
                    </button>
                </Popover.Trigger>
                <Popover.Portal>
                    <Popover.Content
                        aria-label="카테고리 선택"
                        align="start"
                        sideOffset={8}
                        collisionPadding={16}
                        onOpenAutoFocus={(event) => {
                            event.preventDefault()
                            searchInputRef.current?.focus()
                        }}
                        className="z-[70] flex max-h-[var(--radix-popover-content-available-height)] w-[var(--radix-popover-trigger-width)] flex-col overflow-hidden rounded-lg border border-border bg-bg-secondary text-text shadow-modal-center outline-none"
                    >
                        <div className="shrink-0 border-b border-border p-2">
                            <label className="relative block">
                                <span className="sr-only">카테고리 검색</span>
                                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-text-dim" aria-hidden="true" />
                                <input
                                    ref={searchInputRef}
                                    type="search"
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                    className={cn(inputClass, 'pl-9')}
                                    placeholder="카테고리 이름 검색"
                                    aria-describedby={resultStatusId}
                                />
                            </label>
                        </div>
                        <p aria-hidden="true" className="shrink-0 px-3 py-2 text-[11px] text-text-muted">
                            {resultStatus}
                        </p>
                        <ul aria-label="카테고리 검색 결과" className="min-h-0 max-h-40 overflow-y-auto overscroll-contain">
                            {searchResults.items.map((category) => (
                                <li key={category.id}>
                                    <button
                                        type="button"
                                        aria-pressed={String(category.id) === selectedId}
                                        onClick={() => selectCategory(String(category.id))}
                                        className="flex min-h-10 w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-card-hover active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                                    >
                                        <span className="min-w-0 flex-1 truncate">{category.name}</span>
                                        {String(category.id) === selectedId && (
                                            <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                                        )}
                                    </button>
                                </li>
                            ))}
                        </ul>
                        {selectedId.length > 0 && (
                            <button
                                type="button"
                                onClick={() => selectCategory('')}
                                className="min-h-10 w-full shrink-0 cursor-pointer border-t border-border px-3 text-left text-xs font-semibold text-text-muted hover:bg-card-hover active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                            >
                                선택 해제
                            </button>
                        )}
                    </Popover.Content>
                </Popover.Portal>
            </Popover.Root>
            <p id={resultStatusId} role="status" aria-live="polite" aria-atomic="true" className="sr-only">
                {resultStatus}
            </p>
        </div>
    )
}
