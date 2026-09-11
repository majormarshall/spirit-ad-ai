import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'

export const metadata = { title: 'Orders' }

export default async function OrdersPage({ searchParams }: { searchParams: { status?: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: membership } = await supabase
    .from('business_members')
    .select('business_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/dashboard')

  let query = supabase
    .from('orders')
    .select('*, customers(name, phone)')
    .eq('business_id', membership.business_id)
    .order('created_at', { ascending: false })

  if (searchParams.status) query = query.eq('status', searchParams.status)
  const { data: orders } = await query

  const statuses = ['pending', 'confirmed', 'processing', 'ready', 'delivered', 'cancelled']

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orders</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{orders?.length ?? 0} orders</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Link href="/dashboard/orders"
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!searchParams.status ? 'bg-spirit-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'}`}>
          All
        </Link>
        {statuses.map(s => (
          <Link key={s} href={`/dashboard/orders?status=${s}`}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${searchParams.status === s ? 'bg-spirit-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'}`}>
            {s}
          </Link>
        ))}
      </div>

      {(!orders || orders.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <ShoppingCart className="w-12 h-12 text-gray-300" />
          <div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">No orders yet</p>
            <p className="text-gray-400 text-sm mt-1">Orders are created when customers express purchase intent</p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  {['Order', 'Customer', 'Amount', 'Delivery', 'Status', 'Date', ''].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {orders.map((order) => {
                  const customer = order.customers as { name?: string; phone?: string } | null
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-5 py-3 text-xs text-gray-400 font-mono">{order.id.slice(0, 8)}…</td>
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{customer?.name ?? customer?.phone ?? '—'}</p>
                      </td>
                      <td className="px-5 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {order.total_amount ? formatCurrency(order.total_amount) : '—'}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                        {order.delivery_address ?? '—'}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-400">{formatDate(order.created_at)}</td>
                      <td className="px-5 py-3">
                        <Link href={`/dashboard/orders/${order.id}`}
                          className="text-spirit-600 hover:text-spirit-500 text-sm font-medium">View</Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
