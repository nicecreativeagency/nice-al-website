'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Archive,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  FileStack,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Search,
  Settings,
  Share2,
  UsersRound,
  X,
  type LucideIcon,
} from 'lucide-react'
import type { Viewer } from '@/lib/dal'
import { signOutAction } from '@/app/hub/actions'
import { CommandPalette } from '@/app/hub/components/command-palette'
import { NotificationCenter } from '@/app/hub/components/notification-center'

type NavigationItem = {
  label: string
  href: string
  icon: LucideIcon
}

const adminNavigation: NavigationItem[] = [
  { label: 'Overview', href: '/hub/dashboard', icon: LayoutDashboard },
  { label: 'Content', href: '/hub/content', icon: FileStack },
  { label: 'Calendar', href: '/hub/calendar', icon: CalendarDays },
  { label: 'Campaigns', href: '/hub/campaigns', icon: Megaphone },
  { label: 'Approvals', href: '/hub/approvals', icon: CheckCircle2 },
  { label: 'Clients', href: '/hub/clients', icon: UsersRound },
  { label: 'Media', href: '/hub/media', icon: FolderOpen },
  { label: 'Social Accounts', href: '/hub/social-accounts', icon: Share2 },
]

const clientNavigation: NavigationItem[] = [
  { label: 'Overview', href: '/hub/dashboard', icon: LayoutDashboard },
  { label: 'Approvals', href: '/hub/approvals', icon: CheckCircle2 },
  { label: 'Calendar', href: '/hub/calendar', icon: CalendarDays },
  { label: 'Published', href: '/hub/published', icon: Archive },
]

export function HubShell({
  viewer,
  children,
}: {
  viewer: Viewer
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isCommandOpen, setIsCommandOpen] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(viewer.unreadNotifications)
  const setCommandOpen = useCallback((open: boolean) => {
    if (open) setIsNotificationOpen(false)
    setIsCommandOpen(open)
  }, [])
  const setNotificationOpen = useCallback((open: boolean) => {
    if (open) setIsCommandOpen(false)
    setIsNotificationOpen(open)
  }, [])

  useEffect(() => {
    setUnreadCount(viewer.unreadNotifications)
  }, [viewer.unreadNotifications])
  const isAdmin = viewer.role !== 'client'
  const navigation = isAdmin ? adminNavigation : clientNavigation
  const initials = viewer.user.name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')

  return (
    <div className="hubApp">
      <header className="hubMobileHeader">
        <Link href="/hub/dashboard" className="hubMobileLogo">
          <Image src="/nice-al-symbol.svg" alt="" width={28} height={28} />
          <span>Social Hub</span>
        </Link>
        <div>
          <button
            aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
            className="hubMobileNotification"
            onClick={() => setNotificationOpen(true)}
            type="button"
          >
            <Bell aria-hidden="true" size={20} />
            {unreadCount ? <small>{Math.min(unreadCount, 99)}</small> : null}
          </button>
          <button
            aria-label="Search Social Hub"
            onClick={() => setIsCommandOpen(true)}
            type="button"
          >
            <Search aria-hidden="true" size={20} />
          </button>
          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={22} aria-hidden="true" />
          </button>
        </div>
      </header>

      {isMobileOpen ? (
        <button
          type="button"
          className="hubSidebarBackdrop"
          onClick={() => setIsMobileOpen(false)}
          aria-label="Close navigation"
        />
      ) : null}

      <aside className={`hubSidebar ${isMobileOpen ? 'isOpen' : ''}`}>
        <div className="hubSidebarTop">
          <Link href="/hub/dashboard" className="hubLogo">
            <Image src="/nice-al-symbol.svg" alt="" width={32} height={32} />
            <div>
              <strong>NICE</strong>
              <span>Social Hub</span>
            </div>
          </Link>
          <button
            type="button"
            className="hubSidebarClose"
            onClick={() => setIsMobileOpen(false)}
            aria-label="Close navigation"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="hubWorkspace">
          <span className="workspaceIcon">
            {isAdmin ? 'N' : viewer.clients[0]?.name.charAt(0) ?? 'C'}
          </span>
          <span>
            <small>{isAdmin ? 'Organization' : 'Client workspace'}</small>
            <strong>
              {isAdmin
                ? viewer.organization.name
                : viewer.clients[0]?.name ?? 'Assigned client'}
            </strong>
          </span>
          <ChevronDown size={15} aria-hidden="true" />
        </div>

        <div className="hubUtilityButtons">
          <button
            className="hubCommandTrigger"
            onClick={() => {
              setIsMobileOpen(false)
              setCommandOpen(true)
            }}
            type="button"
          >
            <Search aria-hidden="true" size={16} />
            <span>Search</span>
            <kbd>Ctrl K</kbd>
          </button>
          <button
            aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
            className="hubNotificationTrigger"
            onClick={() => {
              setIsMobileOpen(false)
              setNotificationOpen(true)
            }}
            type="button"
          >
            <Bell aria-hidden="true" size={16} />
            <span>Notifications</span>
            {unreadCount ? <small>{Math.min(unreadCount, 99)}</small> : null}
          </button>
        </div>

        <nav className="hubNavigation" aria-label="Social Hub navigation">
          <p>Workspace</p>
          {navigation.map((item) => {
            const Icon = item.icon
            const active =
              pathname === item.href ||
              (item.href !== '/hub/dashboard' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? 'active' : ''}
                onClick={() => setIsMobileOpen(false)}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
                {item.label === 'Approvals' && viewer.pendingApprovals > 0 ? (
                  <small>{viewer.pendingApprovals}</small>
                ) : null}
              </Link>
            )
          })}
        </nav>

        <div className="hubSidebarBottom">
          {isAdmin ? (
            <Link
              href="/hub/settings"
              className={pathname.startsWith('/hub/settings') ? 'active' : ''}
              onClick={() => setIsMobileOpen(false)}
            >
              <Settings size={18} aria-hidden="true" />
              Settings
            </Link>
          ) : null}

          <div className="hubUser">
            <span className="hubAvatar">{initials}</span>
            <span>
              <strong>{viewer.user.name}</strong>
              <small>{viewer.role.replace('_', ' ')}</small>
            </span>
            <form action={signOutAction}>
              <button type="submit" aria-label="Sign out">
                <LogOut size={17} aria-hidden="true" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      <main className="hubMain">{children}</main>
      <CommandPalette
        isAdmin={isAdmin}
        navigation={navigation.map(({ label, href }) => ({ label, href }))}
        onOpenChange={setCommandOpen}
        open={isCommandOpen}
      />
      <NotificationCenter
        onOpenChange={setNotificationOpen}
        onUnreadChange={setUnreadCount}
        open={isNotificationOpen}
      />
    </div>
  )
}
