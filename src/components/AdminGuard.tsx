import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useAdminAuth } from '../hooks'
import { adminApiGet } from '../lib/apiClient'
import AdminLoginPage from '../pages/AdminLoginPage'
import type { AdminSession } from '../types/crawlerReview'

interface AdminGuardProps {
    children: ReactNode
}

export function AdminGuard({ children }: AdminGuardProps) {
    const { apiKey, isAuthenticated, logout } = useAdminAuth()
    const [authError, setAuthError] = useState('')
    const { isLoading, isError } = useQuery({
        queryKey: ['admin', 'session', apiKey],
        queryFn: () => adminApiGet<AdminSession>('/admin/session'),
        enabled: isAuthenticated,
        retry: false,
        refetchOnWindowFocus: false,
    })

    useEffect(() => {
        if (!isError) return
        setAuthError('API 키가 유효하지 않습니다.')
        logout()
    }, [isError, logout])

    if (!isAuthenticated || isError) {
        return <AdminLoginPage initialError={authError} />
    }

    if (isLoading) {
        return (
            <div className="dark flex min-h-screen items-center justify-center bg-bg px-6 text-text">
                <div role="status" aria-live="polite" className="flex flex-col items-center gap-4 text-center">
                    <span className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" aria-hidden="true" />
                    <div>
                        <p className="text-sm font-semibold">관리자 권한 확인 중</p>
                        <p className="mt-1 text-xs text-text-dim">안전한 작업 공간을 준비하고 있습니다.</p>
                    </div>
                </div>
            </div>
        )
    }

    return <>{children}</>
}
