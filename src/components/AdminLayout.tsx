import * as Dialog from '@radix-ui/react-dialog'
import type { LucideIcon } from 'lucide-react'
import { CalendarDays, ExternalLink, FolderOpen, LogOut, Menu, PanelLeftClose, PanelLeftOpen, ScanSearch, Users, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../hooks'
import { cn } from '../lib/cn'
import { AdminToastProvider } from './AdminToastProvider'

interface AdminLayoutProps {
    children: ReactNode
}

interface NavItem {
    to: string
    label: string
    icon: LucideIcon
}

interface NavGroup {
    label: string
    items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
    {
        label: '편성 데이터',
        items: [
            { to: '/schedule', label: '일정 관리', icon: CalendarDays },
            { to: '/streamers', label: '스트리머 관리', icon: Users },
            { to: '/categories', label: '카테고리 관리', icon: FolderOpen },
        ],
    },
    {
        label: '운영 검토',
        items: [{ to: '/crawler/reviews', label: '크롤러 검토', icon: ScanSearch }],
    },
]

export function AdminLayout({ children }: AdminLayoutProps) {
    const { logout } = useAdminAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('admin-sidebar-collapsed') === 'true')
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    useEffect(() => setMobileMenuOpen(false), [location.pathname])

    function handleLogout() {
        logout()
        navigate('/', { replace: true })
    }

    function toggleSidebar() {
        setSidebarCollapsed((value) => {
            const next = !value
            localStorage.setItem('admin-sidebar-collapsed', String(next))
            return next
        })
    }

    function navigation(collapsed = false) {
        return (
            <nav aria-label="관리 메뉴" className="flex flex-1 flex-col gap-6 px-3 py-5">
                {NAV_GROUPS.map((group) => (
                    <div key={group.label}>
                        <p className={cn('mb-2 px-3 text-[11px] font-semibold tracking-[0.12em] text-text-dim', collapsed && 'sr-only')}>
                            {group.label}
                        </p>
                        <div className="space-y-1">
                            {group.items.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    title={collapsed ? item.label : undefined}
                                    className={({ isActive }) =>
                                        cn(
                                            'group flex min-h-11 items-center rounded-md border border-transparent px-3 text-sm font-semibold transition-[background-color,color,border-color] duration-[var(--dur-short)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                                            collapsed ? 'justify-center' : 'gap-3',
                                            isActive
                                                ? 'border-primary/25 bg-primary/10 text-primary'
                                                : 'text-text-muted hover:border-border hover:bg-card hover:text-text',
                                        )
                                    }
                                >
                                    <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                                    {!collapsed && <span className="truncate">{item.label}</span>}
                                </NavLink>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>
        )
    }

    function footerActions(collapsed = false) {
        return (
            <div className="space-y-1 border-t border-border px-3 py-4">
                <a
                    href="https://ohbang-it.kr"
                    target="_blank"
                    rel="noopener noreferrer"
                    title={collapsed ? '서비스로 이동' : undefined}
                    className={cn(
                        'flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-text-muted transition-colors duration-[var(--dur-short)] hover:bg-card hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                        collapsed ? 'justify-center' : 'gap-3',
                    )}
                >
                    <ExternalLink className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                    {!collapsed && <span>서비스로 이동</span>}
                </a>
                <button
                    type="button"
                    onClick={handleLogout}
                    title={collapsed ? '로그아웃' : undefined}
                    className={cn(
                        'flex min-h-11 w-full cursor-pointer items-center rounded-md px-3 text-sm font-medium text-text-muted transition-colors duration-[var(--dur-short)] hover:bg-card hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                        collapsed ? 'justify-center' : 'gap-3',
                    )}
                >
                    <LogOut className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                    {!collapsed && <span>로그아웃</span>}
                </button>
            </div>
        )
    }

    const brand = (compact = false) => (
        <div className={cn('min-w-0', compact && 'text-center')}>
            <div className="font-koverwatch text-xl leading-none tracking-[0.08em] text-text">{compact ? 'O' : 'OHBANGIT'}</div>
            {!compact && <p className="mt-1 font-mono text-[10px] font-medium tracking-[0.14em] text-text-dim">ADMIN WORKBENCH</p>}
        </div>
    )

    return (
        <AdminToastProvider>
            <div className="dark min-h-screen bg-bg text-text lg:flex">
                <aside
                    className={cn(
                        'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-bg-secondary lg:flex',
                        sidebarCollapsed ? 'w-[72px]' : 'w-64',
                    )}
                >
                    <div
                        className={cn(
                            'flex min-h-20 items-center border-b border-border',
                            sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-5',
                        )}
                    >
                        {brand(sidebarCollapsed)}
                        {!sidebarCollapsed && (
                            <button
                                type="button"
                                onClick={toggleSidebar}
                                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md text-text-muted transition-colors hover:bg-card hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                aria-label="사이드바 접기"
                            >
                                <PanelLeftClose className="h-[18px] w-[18px]" aria-hidden="true" />
                            </button>
                        )}
                    </div>
                    {navigation(sidebarCollapsed)}
                    {sidebarCollapsed && (
                        <button
                            type="button"
                            onClick={toggleSidebar}
                            className="mx-auto mb-3 flex h-10 w-10 cursor-pointer items-center justify-center rounded-md text-text-muted transition-colors hover:bg-card hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            aria-label="사이드바 펼치기"
                        >
                            <PanelLeftOpen className="h-[18px] w-[18px]" aria-hidden="true" />
                        </button>
                    )}
                    {footerActions(sidebarCollapsed)}
                </aside>

                <Dialog.Root open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                    <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-border bg-bg-secondary/95 px-4 backdrop-blur lg:hidden">
                        <Dialog.Trigger asChild>
                            <button
                                type="button"
                                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-md text-text-muted hover:bg-card hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                aria-label="관리 메뉴 열기"
                            >
                                <Menu className="h-5 w-5" aria-hidden="true" />
                            </button>
                        </Dialog.Trigger>
                        {brand(false)}
                        <a
                            href="https://ohbang-it.kr"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-11 w-11 items-center justify-center rounded-md text-text-muted hover:bg-card hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            aria-label="서비스로 이동"
                        >
                            <ExternalLink className="h-[18px] w-[18px]" aria-hidden="true" />
                        </a>
                    </header>
                    <Dialog.Portal>
                        <Dialog.Overlay className="fixed inset-0 z-40 bg-bg/80 backdrop-blur-sm data-[state=closed]:opacity-0 data-[state=open]:opacity-100" />
                        <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-[min(18rem,calc(100vw-2rem))] flex-col border-r border-border bg-bg-secondary shadow-modal-center focus:outline-none data-[state=closed]:-translate-x-full data-[state=open]:translate-x-0 data-[state=closed]:opacity-0 data-[state=open]:opacity-100">
                            <Dialog.Title className="sr-only">관리 메뉴</Dialog.Title>
                            <div className="flex min-h-20 items-center justify-between border-b border-border px-5">
                                {brand(false)}
                                <Dialog.Close asChild>
                                    <button
                                        type="button"
                                        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md text-text-muted hover:bg-card hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                        aria-label="관리 메뉴 닫기"
                                    >
                                        <X className="h-5 w-5" aria-hidden="true" />
                                    </button>
                                </Dialog.Close>
                            </div>
                            {navigation(false)}
                            {footerActions(false)}
                        </Dialog.Content>
                    </Dialog.Portal>
                </Dialog.Root>

                <main id="main-content" className="min-h-[calc(100vh-4rem)] min-w-0 flex-1 bg-bg lg:min-h-screen">
                    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">{children}</div>
                </main>
            </div>
        </AdminToastProvider>
    )
}
