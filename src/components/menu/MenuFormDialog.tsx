import { Button } from '@/components/shadcn/ui/button'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/shadcn/ui/dialog'
import { Input } from '@/components/shadcn/ui/input'
import { Label } from '@/components/shadcn/ui/label'
import { Switch } from '@/components/shadcn/ui/switch'
import type { MenuFormData } from './types'

function isExternalUrl(path: string): boolean {
    return path.startsWith('https://') || path.startsWith('http://')
}

function isSlugPath(path: string): boolean {
    return path.startsWith('/')
}

interface MenuFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    formData: MenuFormData
    onFormDataChange: (data: MenuFormData) => void
    onSubmit: () => void
    isEditing: boolean
}

export function MenuFormDialog({
    open,
    onOpenChange,
    formData,
    onFormDataChange,
    onSubmit,
    isEditing,
}: MenuFormDialogProps) {
    const handlePathChange = (path: string) => {
        const isExternal = isExternalUrl(path)
        onFormDataChange({ ...formData, path, is_external: isExternal })
    }

    const pathError = formData.is_external && isSlugPath(formData.path)
        ? '외부 링크는 https://로 시작해야 합니다.'
        : null

    const canSubmit = !pathError && formData.title.trim() && formData.path.trim()

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEditing ? '메뉴 수정' : '메뉴 추가'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">메뉴명 *</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => onFormDataChange({ ...formData, title: e.target.value })}
                            placeholder="예: 방송 일정"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="path">경로 *</Label>
                        <Input
                            id="path"
                            value={formData.path}
                            onChange={(e) => handlePathChange(e.target.value)}
                            placeholder="예: /schedule 또는 https://example.com"
                            className={pathError ? 'border-red-500' : ''}
                        />
                        {pathError && <p className="text-sm text-red-500">{pathError}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="group">그룹</Label>
                        <Input
                            id="group"
                            value={formData.group}
                            onChange={(e) => onFormDataChange({ ...formData, group: e.target.value })}
                            placeholder="예: 일정"
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="is_external">외부 링크</Label>
                        <Switch
                            id="is_external"
                            checked={formData.is_external}
                            onCheckedChange={(checked) => onFormDataChange({ ...formData, is_external: checked })}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="is_visible">공개</Label>
                        <Switch
                            id="is_visible"
                            checked={formData.is_visible}
                            onCheckedChange={(checked) => onFormDataChange({ ...formData, is_visible: checked })}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        취소
                    </Button>
                    <Button onClick={onSubmit} disabled={!canSubmit}>
                        {isEditing ? '수정' : '추가'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
