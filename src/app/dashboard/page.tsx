import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Megaphone, MessageSquare, Target, ShoppingCart,
  Package, TrendingUp, Users, Clock, Zap, AlertCircle,
} from 'lucide-react'
import { formatCurrency, timeAgo } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Get primary business
  const { data: membership } = await supabase
    .from('business_members')
    .select('business_id, role, businesses(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (!membership) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
        <div className="text-6xl">🌱</div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome to SPIRIT AD AI</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Let&apos;s set up your business to get started.</p>
          <Link
            href="/dashboard/settings/business/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-spirit-600 hover:bg-spirit-700 text-white font-semibold rounded-lg transition-colors"
          >
            Create Your Business Profile
          </Link>
        </div>
      </div>
    )
  }

  const businessId = membership.business_id

  // Fetch all stats in parallel
  const [
    { count: campaignsTotal },
    { count: pendingApproval },
    { count: conversations },
    { count: needsHuman },
    { count: leadsCount },
    { count: ordersCount },
    { data: recentCampaigns },
    { data: recentConversations },
    { data: aiPerms },
  ] = await Promise.all([
    supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('business_id', businessId),
    supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('business_id', businessId).eq('status', 'pending_approval'),
    supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('business_id', businessId),
    supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('business_id', businessId).eq('status', 'needs_human'),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('business_id', businessId),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('business_id', businessId),
    supabase.from('campaigns').select('id, title, status, platform, created_at').eq('business_id', businessId).order('created_at', { ascending: false }).limit(5),
    supabase.from('conversations').select('id, status, platform, last_message, last_message_at, customers(name)').eq('business_id', businessId).order('updated_at', { ascending: false }).limit(5),
    supabase.from('ai_permissions').select('autopilot_enabled, approval_mode').eq('business_id', businessId).single(),
  ])

  const business = membership.businesses as Record<string, string | null>
  const autopilotOn = aiPerms?.autopilot_enabled ?? false

  const stats = [
    { label: 'Total Campaigns', value: campaignsTotal ?? 0, icon: Megaphone, href: '/dashboard/campaigns', color: 'text-blue-600' },
    { label: 'Pending Approval', value: pendingApproval ?? 0, icon: Clock, href: '/dashboard/campaigns?status=pending_approval', color: 'text-yellow-600' },
    { label: 'Conversations', value: conversations ?? 0, icon: MessageSquare, href: '/dashboard/messages', color: 'text-purple-600' },
    { label: 'Needs Human', value: needsHuman ?? 0, icon: AlertCircle, href: '/dashboard/messages?status=needs_human', color: 'text-red-600' },
    { label: 'Leads', value: leadsCount ?? 0, icon: Target, href: '/dashboard/leads', color: 'text-spirit-600' },
    { label: 'Orders', value: ordersCount ?? 0, icon: ShoppingCart, href: '/dashboard/orders', color: 'text-indigo-600' },
  ]

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    pending_approval: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-blue-100 text-blue-700',
    scheduled: 'bg-purple-100 text-purple-700',
    published: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {business.name ?? 'Dashboard'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            {business.city ? `${business.city}, ${business.state}` : 'AI Marketing Platform'}
          </p>
        </div>

        {/* Autopilot badge */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
          autopilotOn
            ? 'bg-spirit-100 text-spirit-700 dark:bg-spirit-900/30 dark:text-spirit-400'
            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
        }`}>
          <Zap className="w-4 h-4" />
          AI Autopilot {autopilotOn ? '● ACTIVE' : '○ PAUSED'}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 hover:border-spirit-300 dark:hover:border-spirit-700 transition-colors group"
          >
            <div className="flex items-center justify-between mb-3">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <TrendingUp className="w-3 h-3 text-gray-400 group-hover:text-spirit-500 transition-colors" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* Bottom panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Campaigns */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">Recent Campaigns</h2>
            <Link href="/dashboard/campaigns" className="text-sm text-spirit-600 hover:text-spirit-500">View all</Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {recentCampaigns?.length === 0 && (
              <div className="px-5 py-8 text-center">
                <p className="text-gray-400 text-sm">No campaigns yet</p>
                <Link href="/dashboard/campaigns" className="text-spirit-600 text-sm hover:underline mt-1 inline-block">Generate your first campaign →</Link>
              </div>
            )}
            {recentCampaigns?.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.title}</p>
                  <p className="text-xs text-gray-400">{timeAgo(c.created_at)} · {c.platform}</p>
                </div>
                <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[c.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {c.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Conversations */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">Recent Messages</h2>
            <Link href="/dashboard/messages" className="text-sm text-spirit-600 hover:text-spirit-500">View all</Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {recentConversations?.length === 0 && (
              <div className="px-5 py-8 text-center">
                <p className="text-gray-400 text-sm">No conversations yet</p>
                <p className="text-xs text-gray-300 mt-1">Messages will appear here when customers contact you</p>
              </div>
            )}
            {recentConversations?.map((conv) => {
              const customer = conv.customers as { name?: string } | null
              return (
                <Link key={conv.id} href={`/dashboard/messages/${conv.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="w-8 h-8 bg-spirit-100 dark:bg-spirit-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-spirit-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{customer?.name ?? 'Unknown customer'}</p>
                    <p className="text-xs text-gray-400 truncate">{conv.last_message ?? 'No messages'}</p>
                  </div>
                  {conv.status === 'needs_human' && (
                    <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Needs help</span>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Generate Advert', href: '/dashboard/campaigns/generate', icon: '✨' },
          { label: 'Add Product', href: '/dashboard/products/new', icon: '📦' },
          { label: 'Add FAQ', href: '/dashboard/knowledge-base/faqs/new', icon: '💬' },
          { label: 'View Analytics', href: '/dashboard/analytics', icon: '📊' },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-spirit-300 dark:hover:border-spirit-700 transition-colors"
          >
            <span className="text-xl">{action.icon}</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
