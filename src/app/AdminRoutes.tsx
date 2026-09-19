import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminGuard, AdminLayout } from '../components'

const BroadcastSchedulePage = lazy(() => import('../pages/BroadcastSchedulePage'))
const StreamersPage = lazy(() => import('../pages/StreamersPage'))
const CategoryManagePage = lazy(() => import('../pages/CategoryManagePage'))
const CrawlerReviewsPage = lazy(() => import('../pages/CrawlerReviewsPage'))

export default function AdminRoutes() {
    return (
        <AdminGuard>
            <AdminLayout>
                <Suspense
                    fallback={
                        <div role="status" className="flex min-h-[50vh] items-center justify-center text-sm text-text-dim">
                            관리 화면을 불러오는 중입니다.
                        </div>
                    }
                >
                    <Routes>
                        <Route path="schedule" element={<BroadcastSchedulePage />} />
                        <Route path="streamers" element={<StreamersPage />} />
                        <Route path="categories" element={<CategoryManagePage />} />
                        <Route path="crawler/reviews" element={<CrawlerReviewsPage />} />
                        <Route path="*" element={<Navigate to="schedule" replace />} />
                    </Routes>
                </Suspense>
            </AdminLayout>
        </AdminGuard>
    )
}
