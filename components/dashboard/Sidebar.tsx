'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BarChart2, MessageSquare, Bot, Settings, LogOut, Zap } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/supabase/types'

type Props = {
  profile: (Profile & { org?: { name: string; plan: string } | null }) | null
  org: { name: string; plan: string } | null
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: Zap, exact: true },
  { href: '/dashboard/analytics', label: 'Analíticas', icon: BarChart2 },
  { href: '/dashboard/conversations', label: 'Conversaciones', icon: MessageSquare },
  { href: '/dashboard/agents', label: 'Agentes', icon: Bot },
  { href: '/dashboard/settings', label: 'Configuración', icon: Settings },
]

export default function Sidebar({ profile, org }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-60 bg-white border-r border-slate-200 flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-900 text-sm">AgentHub</span>
        </div>
      </div>

      {/* Org info */}
      {org && (
        <div className="px-5 py-3 border-b border-slate-100">
          <p className="text-xs text-slate-500 truncate">{org.name}</p>
          <span className={cn(
            'text-xs font-medium px-1.5 py-0.5 rounded-full',
            org.plan === 'free' && 'bg-slate-100 text-slate-600',
            org.plan === 'pro' && 'bg-blue-100 text-blue-700',
            org.plan === 'enterprise' && 'bg-purple-100 text-purple-700',
          )}>
            {org.plan.toUpperCase()}
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-slate-100">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-7 h-7 bg-slate-200 rounded-full flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-slate-600">
              {profile?.full_name?.[0]?.toUpperCase() ?? '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-900 truncate">{profile?.full_name ?? 'Usuario'}</p>
            <p className="text-xs text-slate-400 truncate">{profile?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
