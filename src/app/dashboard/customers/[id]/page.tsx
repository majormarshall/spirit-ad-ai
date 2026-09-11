import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDate, formatDateTime, getStatusColor, timeAgo } from '@/lib/utils'
import { Users, MessageSquare, ShoppingCart, Target } from 'lucide-react'

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: membership } = await supabase
    .from('business_members')
    .select('business_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/dashboard')

  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', params.id)
    .eq('business_id', membership.business_id)
    .single()

  if (!customer) notFound()

  const [{ data: conversations }, { data: orders }, { data: leads }] = await Promise.all([
    supabase.from('conversations').select('id, status, last_message, last_message_at, platform').eq('customer_id', params.id).order('updated_at', { ascending: false }),
    supabase.from('orders').select('id, status, total_amount, created_at').eq('customer_id', params.id).order('created_at', { ascending: false }),
    supabase.from('leads').select('id, status, lead_type, lead_score, created_at').eq('customer_id', params.id).order('created_at', { ascending: false }),
  ])

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/customers" className="text-spirit-600 hover:text-spirit-500 text-sm">← Customers</Link>
        <span className="text-gray-400">/</span>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{customer.name ?? customer.phone ?? 'Customer'}</h1>
      </div>

      {/* Profile */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-spirit-100 dark:bg-spirit-900/30 rounded-full flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6 text-spirit-600" />
          </div>
          <div className="grid grid-cols-2 gap-4 flex-1">
            {[
              { label: 'Name', value: customer.name },
              { label: 'Phone', value: customer.phone },
              { label: 'Email', value: customer.email },
              { label: 'Platform', value: customer.platform },
              { label: 'City', value: customer.city },
              { label: 'First seen', value: formatDate(customer.created_at) },
            ].map(({ label, value }) => value ? (
              <div key={label}>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">{label}</p>
                <p className="text-sm text-gray-900 dark:text-white mt-0.5 capitalize">{value}</p>
              </div>
            ) : null)}
          </div>
        </div>
      </div>

      {/* Conversations */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 dark:border-gray-800">
          <MessageSquare className="w-4 h-4 text-spirit-600" />
          <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Conversations ({conversations?.length ?? 0})</h2>
        </div>
        {conversations?.map(c => (
          <Link key={c.id} href={`/dashboard/messages/${c.id}`}
            className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 last:border-0 transition-colors">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{c.last_message ?? 'No messages'}</p>
              <p className="text-xs text-gray-400">{c.platform} · {c.last_message_at ? timeAgo(c.last_message_at) : ''}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${getStatusColor(c.status)}`}>{c.status.replace('_', ' ')}</span>
          </Link>
        ))}
        {!conversations?.length && <p className="px-5 py-4 text-sm text-gray-400">No conversations</p>}
      </div>

      {/* Orders */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 dark:border-gray-800">
          <ShoppingCart className="w-4 h-4 text-spirit-600" />
          <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Orders ({orders?.length ?? 0})</h2>
        </div>
        {orders?.map(o => (
          <Link key={o.id} href={`/dashboard/orders/${o.id}`}
            className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 last:border-0 transition-colors">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">₦{o.total_amount?.toLocaleString() ?? '—'}</p>
              <p className="text-xs text-gray-400">{formatDate(o.created_at)}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${getStatusColor(o.status)}`}>{o.status}</span>
          </Link>
        ))}
        {!orders?.length && <p className="px-5 py-4 text-sm text-gray-400">No orders</p>}
      </div>

      {/* Leads */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 dark:border-gray-800">
          <Target className="w-4 h-4 text-spirit-600" />
          <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Leads ({leads?.length ?? 0})</h2>
        </div>
        {leads?.map(l => (
          <div key={l.id} className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300 capitalize">{l.lead_type.replace('_', ' ')} · Score: {l.lead_score}</p>
              <p className="text-xs text-gray-400">{formatDate(l.created_at)}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${getStatusColor(l.status)}`}>{l.status}</span>
          </div>
        ))}
        {!leads?.length && <p className="px-5 py-4 text-sm text-gray-400">No leads</p>}
      </div>
    </div>
  )
}
