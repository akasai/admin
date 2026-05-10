import type { LucideIcon } from 'lucide-react'
import { CalendarDays, ExternalLink, FlaskConical, FolderOpen, Image, Layers, LayoutList, LogOut, Megaphone, PanelLeftClose, PanelLeftOpen, Radio, Search, Tag, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
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
  const [ sidebarCollapsed, setSidebarCollapsed ] = useState(() => localStorage.getItem('admin-sidebar-collapsed') === 'true')

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

  return (
    <AdminToastProvider>
      <div className="dark flex min-h-screen bg-[#0e0e10]">
        <aside
          className={cn(
            'flex flex-col border-r border-gray-300 bg-white transition-all duration-200 dark:border-[#3a3a44] dark:bg-[#1a1a23]',
            sidebarCollapsed ? 'w-14' : 'w-56',
          )}
        >
          <div
            className={cn(
              'flex h-14 items-center border-b border-gray-300 dark:border-[#3a3a44]',
              sidebarCollapsed ? 'justify-center px-0' : 'justify-between px-5',
            )}
          >
            {!sidebarCollapsed && <span className="text-sm font-bold text-gray-900 dark:text-[#efeff1]">어드민</span>}
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
                onClick={handleToggleSidebar}
                title={sidebarCollapsed ? '사이드바 열기' : '사이드바 닫기'}
                className="cursor-pointer rounded-md p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-[#adadb8] dark:hover:bg-[#2e2e38] dark:hover:text-[#efeff1]"
              >
                {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <nav className="flex flex-1 flex-col px-3 py-3">
            <div className="space-y-4">
              {NAV_SECTIONS.map((section) => (
                <div key={section.title}>
                  {!sidebarCollapsed && (
                    <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-[#848494]">{section.title}</p>
                  )}
                  <div className="space-y-0.5">
                    {section.items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        title={sidebarCollapsed ? item.label : undefined}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition',
                            sidebarCollapsed ? 'justify-center' : 'gap-2',
                            isActive
                              ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-[#adadb8] dark:hover:bg-[#2e2e38] dark:hover:text-[#efeff1]',
                          )
                        }
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!sidebarCollapsed && <span>{item.label}</span>}
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
              title={sidebarCollapsed ? '로그아웃' : undefined}
              className={cn(
                'flex w-full cursor-pointer items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:text-[#adadb8] dark:hover:bg-[#2e2e38] dark:hover:text-[#efeff1]',
                sidebarCollapsed ? 'justify-center' : 'gap-2',
              )}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && <span>로그아웃</span>}
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
        </main>
      </div>
    </AdminToastProvider>
  )
}
