import { FolderOpen, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ConfirmModal } from '../components/ConfirmModal'
import { ListEmpty, ListError, ListLoading } from '../components/ListState'
import { ModalOverlay } from '../components/ModalOverlay'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { inputClass, panelClass } from '../constants/styles'
import { useAdminToast, useCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from '../hooks'
import type { CategoryItem, CreateCategoryRequest } from '../types'
import { getErrorMessage } from '../utils/error'

interface CategoryFormValues {
    name: string
    backgroundImageUrl: string
    isActive: boolean
}

interface CategoryFormModalProps {
    initialValues: CategoryFormValues
    pending: boolean
    title: string
    submitLabel: string
    onClose: () => void
    onSubmit: (values: CategoryFormValues) => Promise<void>
}

const checkboxClass =
    'h-4 w-4 rounded border-border bg-card accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'

function CategoryFormModal({ initialValues, pending, title, submitLabel, onClose, onSubmit }: CategoryFormModalProps) {
    const [values, setValues] = useState(initialValues)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit() {
        if (values.name.trim().length === 0) {
            setError('카테고리명은 필수입니다.')
            return
        }
        setError(null)
        await onSubmit(values)
    }

    return (
        <ModalOverlay ariaLabel={title} size="lg" disabled={pending} onClose={onClose}>
            <div className="border-b border-border px-5 py-4 sm:px-6">
                <p className="mb-1 font-mono text-[10px] font-semibold tracking-[0.12em] text-text-dim">CATEGORY RECORD</p>
                <h2 className="text-lg font-[650] tracking-[-0.02em] text-text">{title}</h2>
                <p className="mt-1 text-xs text-text-muted">카테고리 이름, 이미지와 활성 상태를 관리합니다.</p>
            </div>
            <div className="space-y-5 px-5 py-5 sm:px-6">
                <label className="block space-y-1.5 text-xs font-semibold text-text-muted">
                    카테고리명 <span className="text-[var(--color-danger)]">*</span>
                    <input
                        autoFocus
                        value={values.name}
                        onChange={(event) => setValues((previous) => ({ ...previous, name: event.target.value }))}
                        className={inputClass}
                        aria-invalid={error !== null}
                    />
                </label>
                <label className="block space-y-1.5 text-xs font-semibold text-text-muted">
                    배경 이미지 URL
                    <input
                        type="url"
                        value={values.backgroundImageUrl}
                        onChange={(event) => setValues((previous) => ({ ...previous, backgroundImageUrl: event.target.value }))}
                        className={inputClass}
                        placeholder="https://..."
                    />
                </label>
                <label className="flex min-h-10 cursor-pointer items-center gap-2 rounded-md border border-border bg-card/40 px-3 text-sm text-text">
                    <input
                        type="checkbox"
                        checked={values.isActive}
                        onChange={(event) => setValues((previous) => ({ ...previous, isActive: event.target.checked }))}
                        className={checkboxClass}
                    />
                    활성화
                </label>
                {error !== null && (
                    <p role="alert" className="text-xs text-[var(--color-danger)]">
                        {error}
                    </p>
                )}
            </div>
            <div className="flex gap-2 border-t border-border bg-bg px-5 py-4 sm:justify-end sm:px-6">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={pending}
                    className="min-w-0 flex-1 sm:flex-none sm:px-6"
                >
                    취소
                </Button>
                <Button type="button" onClick={() => void handleSubmit()} loading={pending} className="min-w-0 flex-1 sm:flex-none sm:px-6">
                    {pending ? '저장 중...' : submitLabel}
                </Button>
            </div>
        </ModalOverlay>
    )
}

function toFormValues(category?: CategoryItem): CategoryFormValues {
    return {
        name: category?.name ?? '',
        backgroundImageUrl: category?.backgroundImageUrl ?? '',
        isActive: category?.isActive ?? true,
    }
}

function toPayload(values: CategoryFormValues): CreateCategoryRequest {
    const backgroundImageUrl = values.backgroundImageUrl.trim()
    return {
        name: values.name.trim(),
        backgroundImageUrl: backgroundImageUrl.length > 0 ? backgroundImageUrl : null,
        isActive: values.isActive,
    }
}

export default function CategoryManagePage() {
    const { addToast } = useAdminToast()
    const { data: categories = [], isLoading, isError, refetch } = useCategories()
    const createMutation = useCreateCategory()
    const updateMutation = useUpdateCategory()
    const deleteMutation = useDeleteCategory()
    const [search, setSearch] = useState('')
    const [creating, setCreating] = useState(false)
    const [editing, setEditing] = useState<CategoryItem | null>(null)
    const [deleting, setDeleting] = useState<CategoryItem | null>(null)
    const filteredCategories = useMemo(
        () => categories.filter((category) => category.name.toLowerCase().includes(search.trim().toLowerCase())),
        [categories, search],
    )

    async function create(values: CategoryFormValues) {
        try {
            await createMutation.mutateAsync(toPayload(values))
            addToast({ message: '카테고리가 추가되었습니다.', variant: 'success' })
            setCreating(false)
        } catch (error) {
            const message = getErrorMessage(error)
            if (message !== null) addToast({ message, variant: 'error' })
        }
    }

    async function update(values: CategoryFormValues) {
        if (editing === null) return
        try {
            await updateMutation.mutateAsync({ id: editing.id, body: toPayload(values) })
            addToast({ message: '카테고리가 수정되었습니다.', variant: 'success' })
            setEditing(null)
        } catch (error) {
            const message = getErrorMessage(error)
            if (message !== null) addToast({ message, variant: 'error' })
        }
    }

    async function remove() {
        if (deleting === null) return
        try {
            await deleteMutation.mutateAsync(deleting.id)
            addToast({ message: '카테고리가 삭제되었습니다.', variant: 'success' })
            setDeleting(null)
        } catch (error) {
            const message = getErrorMessage(error)
            if (message !== null) addToast({ message, variant: 'error' })
        }
    }

    return (
        <>
            <header className="mb-6 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                    <p className="mb-2 font-mono text-[11px] font-semibold tracking-[0.12em] text-text-dim">CONTENT TAXONOMY</p>
                    <h1 className="text-2xl font-[650] tracking-[-0.025em] text-text">카테고리 관리</h1>
                    <p className="mt-1.5 text-sm text-text-muted">방송 카테고리와 웹 노출용 이미지를 관리합니다.</p>
                </div>
                <Button
                    type="button"
                    size="lg"
                    leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}
                    onClick={() => setCreating(true)}
                    className="w-full sm:w-auto"
                >
                    카테고리 추가
                </Button>
            </header>

            <section className={panelClass} aria-label="카테고리 목록">
                <div className="border-b border-border p-4 sm:p-5">
                    <label htmlFor="category-search" className="sr-only">
                        카테고리명 검색
                    </label>
                    <div className="relative w-full sm:max-w-sm">
                        <Search
                            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim"
                            aria-hidden="true"
                        />
                        <input
                            id="category-search"
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            className={`${inputClass} pl-9`}
                            placeholder="카테고리명 검색"
                        />
                    </div>
                </div>

                {isLoading && <ListLoading />}
                {isError && <ListError message="카테고리를 불러오는 중 오류가 발생했습니다." onRetry={() => void refetch()} />}
                {!isLoading && !isError && filteredCategories.length === 0 && <ListEmpty message="표시할 카테고리가 없습니다." />}
                {!isLoading && !isError && filteredCategories.length > 0 && (
                    <ul className="divide-y divide-border">
                        {filteredCategories.map((category) => (
                            <li
                                key={category.id}
                                className="grid min-w-0 grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 sm:px-5"
                            >
                                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md border border-border bg-card text-text-dim">
                                    {category.backgroundImageUrl !== null ? (
                                        <img src={category.backgroundImageUrl} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <FolderOpen className="h-5 w-5" aria-hidden="true" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                                        <p className="truncate text-sm font-semibold text-text">{category.name}</p>
                                        <Badge variant={category.isActive ? 'primary' : 'outline'} size="sm">
                                            {category.isActive ? '활성' : '비활성'}
                                        </Badge>
                                    </div>
                                    <p className="mt-1 text-xs text-text-dim">
                                        {category.backgroundImageUrl !== null ? '배경 이미지 연결됨' : '배경 이미지 없음'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setEditing(category)}
                                        aria-label={`${category.name} 수정`}
                                    >
                                        <Pencil className="h-4 w-4" aria-hidden="true" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setDeleting(category)}
                                        className="text-[var(--color-danger)] hover:border-live/30 hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]"
                                        aria-label={`${category.name} 삭제`}
                                    >
                                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {creating && (
                <CategoryFormModal
                    initialValues={toFormValues()}
                    pending={createMutation.isPending}
                    title="카테고리 추가"
                    submitLabel="추가"
                    onClose={() => setCreating(false)}
                    onSubmit={create}
                />
            )}
            {editing !== null && (
                <CategoryFormModal
                    initialValues={toFormValues(editing)}
                    pending={updateMutation.isPending}
                    title="카테고리 수정"
                    submitLabel="저장"
                    onClose={() => setEditing(null)}
                    onSubmit={update}
                />
            )}
            {deleting !== null && (
                <ConfirmModal
                    title="카테고리 삭제"
                    message="카테고리를 삭제하시겠습니까?"
                    itemName={deleting.name}
                    pending={deleteMutation.isPending}
                    onClose={() => setDeleting(null)}
                    onConfirm={() => void remove()}
                />
            )}
        </>
    )
}
