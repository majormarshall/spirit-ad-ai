import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MessageSquare, AlertCircle } from 'lucide-react'
import { timeAgo, getStatusColor } from '@/lib/utils'

export const metadata = { title: 'Messages' }

export default async function MessagesPage({ searchParams }: { searchParams: { status?: string } }) {
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
    .from('conversations')
    .select('*, customers(name, phone, platform)')
    .eq('business_id', membership.business_id)
    .order('updated_at', { ascending: false })

  if (searchParams.status) {
    query = query.eq('status', searchParams.status)
  }

  const { data: conversations } = await query

  const statuses = ['open', 'needs_human', 'assigned', 'resolved', 'closed']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Messages</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{conversations?.length ?? 0} conversations</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Link href="/dashboard/messages"
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!searchParams.status ? 'bg-spirit-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
          All
        </Link>
        {statuses.map(s => (
          <Link key={s} href={`/dashboard/messages?status=${s}`}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${searchParams.status === s ? 'bg-spirit-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
            {s.replace('_', ' ')}
          </Link>
        ))}
      </div>

      {(!conversations || conversations.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <MessageSquare className="w-12 h-12 text-gray-300" />
          <div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">No conversations yet</p>
            <p className="text-gray-400 text-sm mt-1">Messages will appear here when customers contact you via WhatsApp</p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
          {conversations.map((conv) => {
            const customer = conv.customers as { name?: string; phone?: string; platform?: string } | null
            return (
              <Link key={conv.id} href={`/dashboard/messages/${conv.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="w-10 h-10 bg-spirit-100 dark:bg-spirit-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-5 h-5 text-spirit-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{customer?.name ?? customer?.phone ?? 'Unknown customer'}</p>
                    {conv.status === 'needs_human' && (
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-gray-400 truncate mt-0.5">{conv.last_message ?? 'No messages'}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(conv.status)}`}>
                    {conv.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-gray-400">{conv.last_message_at ? timeAgo(conv.last_message_at) : ''}</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
