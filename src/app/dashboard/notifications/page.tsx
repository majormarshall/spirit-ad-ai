import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Bell, CheckCheck } from 'lucide-react'
import { timeAgo } from '@/lib/utils'

export const metadata = { title: 'Notifications' }

const typeIcons: Record<string, string> = {
  human_needed: '🚨',
  new_lead: '🎯',
  new_order: '🛒',
  approval_needed: '⏳',
  publish_failed: '❌',
  account_disconnected: '🔌',
  token_expired: '⚠️',
  new_message: '💬',
}

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: membership } = await supabase
    .from('business_members')
    .select('business_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/dashboard')

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('business_id', membership.business_id)
    .order('created_at', { ascending: false })
    .limit(50)

  // Mark all as read
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('business_id', membership.business_id)
    .eq('is_read', false)

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            {notifications?.filter(n => !n.is_read).length ?? 0} unread
          </p>
        </div>
        <CheckCheck className="w-5 h-5 text-spirit-600" />
      </div>

      {(!notifications || notifications.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <Bell className="w-12 h-12 text-gray-300" />
          <p className="text-gray-500 text-sm">No notifications yet</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
          {notifications.map((notif) => (
            <div key={notif.id}
              className={`flex items-start gap-4 px-5 py-4 ${!notif.is_read ? 'bg-spirit-50/50 dark:bg-spirit-900/10' : ''}`}>
              <span className="text-xl flex-shrink-0 mt-0.5">{typeIcons[notif.type] ?? '🔔'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{notif.title}</p>
                {notif.message && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{notif.message}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">{timeAgo(notif.created_at)}</p>
              </div>
              {notif.link && (
                <Link href={notif.link}
                  className="flex-shrink-0 text-xs text-spirit-600 hover:text-spirit-500 font-medium">
                  View →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
