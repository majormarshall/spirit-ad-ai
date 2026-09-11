import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users } from 'lucide-react'
import { formatDate, timeAgo } from '@/lib/utils'

export const metadata = { title: 'Customers' }

export default async function CustomersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: membership } = await supabase
    .from('business_members')
    .select('business_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/dashboard')

  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .eq('business_id', membership.business_id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customers</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{customers?.length ?? 0} customers</p>
      </div>

      {(!customers || customers.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <Users className="w-12 h-12 text-gray-300" />
          <div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">No customers yet</p>
            <p className="text-gray-400 text-sm mt-1">Customers are automatically added when they message you</p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  {['Customer', 'Phone', 'Email', 'Platform', 'First seen', ''].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-spirit-100 dark:bg-spirit-900/30 rounded-full flex items-center justify-center text-spirit-600 font-semibold text-sm flex-shrink-0">
                          {(customer.name ?? customer.phone ?? '?')[0].toUpperCase()}
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{customer.name ?? '—'}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-400">{customer.phone ?? '—'}</td>
                    <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-400">{customer.email ?? '—'}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full capitalize">{customer.platform}</span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-400">{formatDate(customer.created_at)}</td>
                    <td className="px-5 py-3">
                      <Link href={`/dashboard/customers/${customer.id}`}
                        className="text-spirit-600 hover:text-spirit-500 text-sm font-medium">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
