import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BarChart3 } from 'lucide-react'
import AnalyticsCharts from '@/components/analytics/AnalyticsCharts'

export const metadata = { title: 'Analytics' }

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: membership } = await supabase
    .from('business_members')
    .select('business_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/dashboard')

  const businessId = membership.business_id

  const [
    { count: totalCampaigns },
    { count: publishedPosts },
    { count: scheduledPosts },
    { count: totalConversations },
    { count: aiResponses },
    { count: humanHandoffs },
    { count: leadsCount },
    { count: ordersCount },
    { data: snapshots },
  ] = await Promise.all([
    supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('business_id', businessId),
    supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('business_id', businessId).eq('status', 'published'),
    supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('business_id', businessId).eq('status', 'scheduled'),
    supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('business_id', businessId),
    supabase.from('messages').select('*', { count: 'exact', head: true }).eq('ai_generated', true),
    supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('business_id', businessId).eq('status', 'needs_human'),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('business_id', businessId),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('business_id', businessId),
    supabase.from('analytics_snapshots').select('*').eq('business_id', businessId).order('metric_date', { ascending: true }).limit(30),
  ])

  const stats = [
    { label: 'Total Campaigns', value: totalCampaigns ?? 0 },
    { label: 'Published Posts', value: publishedPosts ?? 0 },
    { label: 'Scheduled Posts', value: scheduledPosts ?? 0 },
    { label: 'Conversations', value: totalConversations ?? 0 },
    { label: 'AI Responses', value: aiResponses ?? 0 },
    { label: 'Human Handoffs', value: humanHandoffs ?? 0 },
    { label: 'Leads Detected', value: leadsCount ?? 0 },
    { label: 'Orders Created', value: ordersCount ?? 0 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Platform performance overview</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value.toLocaleString()}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <AnalyticsCharts snapshots={snapshots ?? []} />
    </div>
  )
}
