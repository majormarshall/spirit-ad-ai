import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Target, Plus } from 'lucide-react'
import { formatDate, getStatusColor } from '@/lib/utils'

export const metadata = { title: 'Leads' }

export default async function LeadsPage({ searchParams }: { searchParams: { status?: string } }) {
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
    .from('leads')
    .select('*, customers(name, phone), products(name)')
    .eq('business_id', membership.business_id)
    .order('created_at', { ascending: false })

  if (searchParams.status) query = query.eq('status', searchParams.status)

  const { data: leads } = await query

  const statuses = ['new', 'contacted', 'negotiating', 'won', 'lost']
  const leadTypeColors: Record<string, string> = {
    standard: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    high_value: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    bulk: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    recurring: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leads</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{leads?.length ?? 0} leads detected</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Link href="/dashboard/leads"
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!searchParams.status ? 'bg-spirit-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
          All
        </Link>
        {statuses.map(s => (
          <Link key={s} href={`/dashboard/leads?status=${s}`}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${searchParams.status === s ? 'bg-spirit-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
            {s}
          </Link>
        ))}
      </div>

      {(!leads || leads.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <Target className="w-12 h-12 text-gray-300" />
          <div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">No leads yet</p>
            <p className="text-gray-400 text-sm mt-1">Leads are automatically detected from WhatsApp conversations</p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  {['Customer', 'Product', 'Quantity', 'Type', 'Score', 'Status', 'Date'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {leads.map((lead) => {
                  const customer = lead.customers as { name?: string; phone?: string } | null
                  const product = lead.products as { name?: string } | null
                  return (
                    <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{customer?.name ?? customer?.phone ?? '—'}</p>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-400">{product?.name ?? '—'}</td>
                      <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-400">{lead.quantity ?? '—'}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${leadTypeColors[lead.lead_type]}`}>
                          {lead.lead_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-12 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div className="bg-spirit-600 h-1.5 rounded-full" style={{ width: `${lead.lead_score}%` }} />
                          </div>
                          <span className="text-xs text-gray-500">{lead.lead_score}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${getStatusColor(lead.status)}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-400">{formatDate(lead.created_at)}</td>
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
