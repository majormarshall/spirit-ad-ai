'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Megaphone, Calendar, Bot, MessageSquare,
  Users, Target, ShoppingCart, Package, BookOpen, BarChart3,
  Plug, Shield, Bell, Settings, ChevronLeft, ChevronRight, Leaf,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard',                  label: 'Dashboard',       icon: LayoutDashboard },
  { href: '/dashboard/campaigns',        label: 'Campaigns',       icon: Megaphone },
  { href: '/dashboard/content-calendar', label: 'Content Calendar',icon: Calendar },
  { href: '/dashboard/ai-assistant',     label: 'AI Assistant',    icon: Bot },
  { href: '/dashboard/messages',         label: 'Messages',        icon: MessageSquare },
  { href: '/dashboard/customers',        label: 'Customers',       icon: Users },
  { href: '/dashboard/leads',            label: 'Leads',           icon: Target },
  { href: '/dashboard/orders',           label: 'Orders',          icon: ShoppingCart },
  { href: '/dashboard/products',         label: 'Products',        icon: Package },
  { href: '/dashboard/knowledge-base',   label: 'Knowledge Base',  icon: BookOpen },
  { href: '/dashboard/analytics',        label: 'Analytics',       icon: BarChart3 },
  { href: '/dashboard/integrations',     label: 'Integrations',    icon: Plug },
  { href: '/dashboard/permissions',      label: 'Permissions',     icon: Shield },
  { href: '/dashboard/notifications',    label: 'Notifications',   icon: Bell },
  { href: '/dashboard/settings',         label: 'Settings',        icon: Settings },
]

export default function Sidebar({ businessName }: { businessName?: string }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'relative flex flex-col bg-gray-900 dark:bg-gray-950 text-white sidebar-transition flex-shrink-0',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-700/50">
        <div className="flex items-center justify-center w-8 h-8 bg-spirit-600 rounded-lg flex-shrink-0">
          <Leaf className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-bold text-sm truncate">SPIRIT AD AI</p>
            {businessName && (
              <p className="text-xs text-gray-400 truncate">{businessName}</p>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-spirit-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center w-full py-3 border-t border-gray-700/50 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  )
}
