import type { LucideIcon } from 'lucide-react'
import {
    CalendarDays,
    ExternalLink,
    FlaskConical,
    FolderOpen,
    Image,
    Layers,
    LayoutList,
    LogOut,
    Megaphone,
    Menu,
    PanelLeftClose,
    PanelLeftOpen,
    Pin,
    Radio,
    Search,
    Tag,
    Users,
    X,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../hooks'
import { cn } from '../lib/cn'
import { AdminToastProvider } from './AdminToastProvider'
interface SidebarContextValue {
    collapsed: boolean
}

const SidebarContext = createContext<SidebarContextValue>({ collapsed: false })

export function useSidebarCollapsed(): boolean {
    return useContext(SidebarContext).collapsed
}

interface AdminLayoutProps {
    children: ReactNode
}

interface NavItem {
    to: string
    label: string
    icon: LucideIcon
}

interface NavSection {
    title: string
    items: NavItem[]
}

const NAV_SECTIONS: NavSection[] = [
    {
        title: '관리',
        items: [
            { to: '/schedule', label: '일정 관리', icon: CalendarDays },
            { to: '/streamers', label: '스트리머 관리', icon: Users },
            { to: '/affiliations', label: '소속 관리', icon: Tag },
            { to: '/categories', label: '카테고리 관리', icon: FolderOpen },
            { to: '/banners', label: '배너 관리', icon: Image },
            { to: '/menus', label: '메뉴 관리', icon: LayoutList },
            { to: '/notices', label: '공지 관리', icon: Megaphone },
            { to: '/pinned-events', label: '고정 일정', icon: Pin },
        ],
    },
    {
        title: '운영',
        items: [
            { to: '/discovery', label: '스트리머 크롤링', icon: Search },
            { to: '/broadcast-crawl', label: '방송 크롤링', icon: Radio },
            { to: '/crawl-groups', label: '크롤링 스케줄', icon: Layers },
            { to: '/staging', label: '스테이징', icon: FlaskConical },
        ],
    },
]

export function AdminLayout({ children }: AdminLayoutProps) {
    const { logout } = useAdminAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('admin-sidebar-collapsed') === 'true')
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    useEffect(() => {
        setMobileMenuOpen(false)
    }, [location.pathname])

    useEffect(() => {
        if (!mobileMenuOpen) return
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = previousOverflow
        }
    }, [mobileMenuOpen])

    function handleToggleSidebar() {
        setSidebarCollapsed((prev) => {
            const next = !prev
            localStorage.setItem('admin-sidebar-collapsed', String(next))
            return next
        })
    }

    function handleLogout() {
        logout()
        navigate('/', { replace: true })
    }

    function renderNavContent(isMobile = false) {
        return (
            <>
                <nav className="flex flex-1 flex-col px-3 py-3">
                    <div className="space-y-4">
                        {NAV_SECTIONS.map((section) => (
                            <div key={section.title}>
                                {(!sidebarCollapsed || isMobile) && (
                                    <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-[#848494]">
                                        {section.title}
                                    </p>
                                )}
                                <div className="space-y-0.5">
                                    {section.items.map((item) => (
                                        <NavLink
                                            key={item.to}
                                            to={item.to}
                                            title={!isMobile && sidebarCollapsed ? item.label : undefined}
                                            className={({ isActive }) =>
                                                cn(
                                                    'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition',
                                                    !isMobile && sidebarCollapsed ? 'justify-center' : 'gap-2',
                                                    isActive
                                                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-[#adadb8] dark:hover:bg-[#2e2e38] dark:hover:text-[#efeff1]',
                                                )
                                            }
                                        >
                                            <item.icon className="h-4 w-4 shrink-0" />
                                            {(isMobile || !sidebarCollapsed) && <span>{item.label}</span>}
                                        </NavLink>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </nav>

                <div className="border-t border-gray-300 px-3 py-3 dark:border-[#3a3a44]">
                    <button
                        onClick={handleLogout}
                        title={!isMobile && sidebarCollapsed ? '로그아웃' : undefined}
                        className={cn(
                            'flex w-full cursor-pointer items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:text-[#adadb8] dark:hover:bg-[#2e2e38] dark:hover:text-[#efeff1]',
                            !isMobile && sidebarCollapsed ? 'justify-center' : 'gap-2',
                        )}
                    >
                        <LogOut className="h-4 w-4 shrink-0" />
                        {(isMobile || !sidebarCollapsed) && <span>로그아웃</span>}
                    </button>
                </div>
            </>
        )
    }

    return (
        <SidebarContext.Provider value={{ collapsed: sidebarCollapsed }}>
            <AdminToastProvider>
                <div className="dark min-h-screen bg-[#0e0e10] md:flex">
                    <div
                        className={cn(
                            'fixed inset-0 z-40 bg-black/60 transition-opacity md:hidden',
                            mobileMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                    />

                    <aside
                        className={cn(
                            'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-300 bg-white transition-transform duration-200 dark:border-[#3a3a44] dark:bg-[#1a1a23] md:static md:z-auto md:translate-x-0 md:transition-all',
                            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
                            sidebarCollapsed ? 'md:w-14' : 'md:w-56',
                        )}
                    >
                        <div
                            className={cn(
                                'flex h-14 items-center border-b border-gray-300 dark:border-[#3a3a44]',
                                sidebarCollapsed ? 'justify-center px-0 md:px-0' : 'justify-between px-5',
                            )}
                        >
                            {(mobileMenuOpen || !sidebarCollapsed) && (
                                <span className="text-sm font-bold text-gray-900 dark:text-[#efeff1]">어드민</span>
                            )}
                            <div className="flex items-center gap-1">
                                <a
                                    href="https://ohbang-it.kr"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="사이트 바로가기"
                                    className="cursor-pointer rounded-md p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-[#adadb8] dark:hover:bg-[#2e2e38] dark:hover:text-[#efeff1]"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                                <button
                                    type="button"
                                    onClick={() => setMobileMenuOpen(false)}
                                    title="메뉴 닫기"
                                    className="cursor-pointer rounded-md p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-[#adadb8] dark:hover:bg-[#2e2e38] dark:hover:text-[#efeff1] md:hidden"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleToggleSidebar}
                                    title={sidebarCollapsed ? '사이드바 열기' : '사이드바 닫기'}
                                    className="hidden cursor-pointer rounded-md p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-[#adadb8] dark:hover:bg-[#2e2e38] dark:hover:text-[#efeff1] md:block"
                                >
                                    {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {renderNavContent(mobileMenuOpen)}
                    </aside>

                    <main className="min-h-screen flex-1 overflow-auto">
                        <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-300 bg-white/95 px-4 backdrop-blur dark:border-[#3a3a44] dark:bg-[#1a1a23]/95 md:hidden">
                            <button
                                type="button"
                                onClick={() => setMobileMenuOpen(true)}
                                className="cursor-pointer rounded-md p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-[#adadb8] dark:hover:bg-[#2e2e38] dark:hover:text-[#efeff1]"
                                aria-label="메뉴 열기"
                            >
                                <Menu className="h-5 w-5" />
                            </button>
                            <span className="text-sm font-bold text-gray-900 dark:text-[#efeff1]">어드민</span>
                            <a
                                href="https://ohbang-it.kr"
                                target="_blank"
                                rel="noopener noreferrer"
                                title="사이트 바로가기"
                                className="cursor-pointer rounded-md p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-[#adadb8] dark:hover:bg-[#2e2e38] dark:hover:text-[#efeff1]"
                            >
                                <ExternalLink className="h-4 w-4" />
                            </a>
                        </div>
                        <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8">{children}</div>
                    </main>
                </div>
            </AdminToastProvider>
        </SidebarContext.Provider>
    )
}
