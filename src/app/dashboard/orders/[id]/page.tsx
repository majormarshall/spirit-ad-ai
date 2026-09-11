import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatDateTime, getStatusColor } from '@/lib/utils'

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: membership } = await supabase
    .from('business_members')
    .select('business_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/dashboard')

  const { data: order } = await supabase
    .from('orders')
    .select('*, customers(*), order_items(*, products(name, unit))')
    .eq('id', params.id)
    .eq('business_id', membership.business_id)
    .single()

  if (!order) notFound()

  const customer = order.customers as Record<string, string | null> | null
  const items = Array.isArray(order.order_items) ? order.order_items : []

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/orders" className="text-spirit-600 hover:text-spirit-500 text-sm">← Orders</Link>
        <span className="text-gray-400">/</span>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Order Details</h1>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${getStatusColor(order.status)}`}>
          {order.status}
        </span>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Customer</p>
            <p className="text-sm text-gray-900 dark:text-white font-medium mt-1">{customer?.name ?? '—'}</p>
            <p className="text-xs text-gray-400">{customer?.phone}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Order Date</p>
            <p className="text-sm text-gray-900 dark:text-white mt-1">{formatDateTime(order.created_at)}</p>
          </div>
          {order.delivery_address && (
            <div className="col-span-2">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Delivery Address</p>
              <p className="text-sm text-gray-900 dark:text-white mt-1">{order.delivery_address}</p>
            </div>
          )}
          {order.notes && (
            <div className="col-span-2">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Notes</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{order.notes}</p>
            </div>
          )}
        </div>
      </div>

      {items.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Order Items</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                {['Product', 'Qty', 'Unit Price', 'Total'].map(h => (
                  <th key={h} className="text-left px-5 py-2 text-xs font-semibold text-gray-400 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {items.map((item: Record<string, unknown>, i: number) => {
                const product = item.products as { name?: string; unit?: string } | null
                return (
                  <tr key={String(item.id ?? i)}>
                    <td className="px-5 py-3 text-sm text-gray-900 dark:text-white">{product?.name ?? '—'}</td>
                    <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-400">{String(item.quantity ?? '')} {product?.unit}</td>
                    <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-400">{formatCurrency(Number(item.unit_price))}</td>
                    <td className="px-5 py-3 text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(Number(item.total_price))}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200 dark:border-gray-800">
                <td colSpan={3} className="px-5 py-3 text-sm font-semibold text-gray-900 dark:text-white text-right">Total</td>
                <td className="px-5 py-3 text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(order.total_amount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Status update */}
      <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />
    </div>
  )
}

function OrderStatusUpdater({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const transitions: Record<string, string[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['processing', 'cancelled'],
    processing: ['ready', 'cancelled'],
    ready: ['delivered'],
    delivered: [],
    cancelled: [],
  }
  const next = transitions[currentStatus] ?? []
  if (next.length === 0) return null

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
      <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Update Status</p>
      <div className="flex gap-2 flex-wrap">
        {next.map(status => (
          <form key={status} action={`/api/orders/${orderId}/status`} method="POST">
            <input type="hidden" name="status" value={status} />
            <button type="submit"
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                status === 'cancelled'
                  ? 'border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                  : 'bg-spirit-600 hover:bg-spirit-700 text-white'
              }`}>
              Mark as {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          </form>
        ))}
      </div>
    </div>
  )
}
