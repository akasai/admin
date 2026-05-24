import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminGuard } from '../components'
import { AdminLayout } from '../components'

const BroadcastSchedulePage = lazy(() => import('../pages/BroadcastSchedulePage'))
const StreamersPage = lazy(() => import('../pages/StreamersPage'))
const AffiliationManagePage = lazy(() => import('../pages/AffiliationManagePage'))
const CategoryManagePage = lazy(() => import('../pages/CategoryManagePage'))
const MenuManagePage = lazy(() => import('../pages/MenuManagePage'))
const DiscoveryPage = lazy(() => import('../pages/DiscoveryPage'))
const BannerManagePage = lazy(() => import('../pages/BannerManagePage'))
const NoticeManagePage = lazy(() => import('../pages/NoticeManagePage'))
const BroadcastCrawlPage = lazy(() => import('../pages/BroadcastCrawlPage'))
const CrawlGroupManagePage = lazy(() => import('../pages/CrawlGroupManagePage'))
const StagingManagePage = lazy(() => import('../pages/StagingManagePage'))
const PinnedEventManagePage = lazy(() => import('../pages/PinnedEventManagePage'))

export default function AdminRoutes() {
    return (
        <AdminGuard>
            <AdminLayout>
                <Suspense fallback={null}>
                    <Routes>
                        <Route path="schedule" element={<BroadcastSchedulePage />} />
                        <Route path="streamers" element={<StreamersPage />} />
                        <Route path="affiliations" element={<AffiliationManagePage />} />
                        <Route path="categories" element={<CategoryManagePage />} />
                        <Route path="banners" element={<BannerManagePage />} />
                        <Route path="notices" element={<NoticeManagePage />} />
                        <Route path="menus" element={<MenuManagePage />} />
                        <Route path="discovery" element={<DiscoveryPage />} />
                        <Route path="broadcast-crawl" element={<BroadcastCrawlPage />} />
                        <Route path="crawl-groups" element={<CrawlGroupManagePage />} />
                        <Route path="staging" element={<StagingManagePage />} />
                        <Route path="pinned-events" element={<PinnedEventManagePage />} />
                        <Route path="*" element={<Navigate to="schedule" replace />} />
                    </Routes>
                </Suspense>
            </AdminLayout>
        </AdminGuard>
    )
}
