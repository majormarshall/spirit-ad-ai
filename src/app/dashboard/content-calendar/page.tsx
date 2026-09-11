import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Plus, Sparkles } from 'lucide-react'
import { formatDateTime, getStatusColor } from '@/lib/utils'
import { startOfMonth, endOfMonth, format, eachDayOfInterval, isSameDay, parseISO } from 'date-fns'

export const metadata = { title: 'Content Calendar' }

export default async function ContentCalendarPage({ searchParams }: { searchParams: { month?: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: membership } = await supabase
    .from('business_members')
    .select('business_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/dashboard')

  // Determine month
  const monthParam = searchParams.month
  const viewDate = monthParam ? new Date(monthParam + '-01') : new Date()
  const monthStart = startOfMonth(viewDate)
  const monthEnd = endOfMonth(viewDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id, title, status, platform, scheduled_time, published_time, headline')
    .eq('business_id', membership.business_id)
    .gte('scheduled_time', monthStart.toISOString())
    .lte('scheduled_time', monthEnd.toISOString())
    .order('scheduled_time', { ascending: true })

  const prevMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1)
  const nextMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1)

  function getCampaignsForDay(day: Date) {
    return (campaigns ?? []).filter(c => c.scheduled_time && isSameDay(parseISO(c.scheduled_time), day))
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const firstDayOfWeek = monthStart.getDay()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Content Calendar</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{format(viewDate, 'MMMM yyyy')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/content-calendar?month=${format(prevMonth, 'yyyy-MM')}`}
            className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            ← Prev
          </Link>
          <Link href={`/dashboard/content-calendar?month=${format(nextMonth, 'yyyy-MM')}`}
            className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Next →
          </Link>
          <Link href="/dashboard/campaigns/generate"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-spirit-600 hover:bg-spirit-700 text-white text-sm font-semibold rounded-lg transition-colors">
            <Sparkles className="w-4 h-4" /> Generate
          </Link>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-800">
          {dayNames.map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7">
          {/* Empty cells before first day */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[100px] border-b border-r border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/50" />
          ))}

          {days.map((day) => {
            const dayCampaigns = getCampaignsForDay(day)
            const isToday = isSameDay(day, new Date())
            return (
              <div key={day.toISOString()}
                className={`min-h-[100px] border-b border-r border-gray-100 dark:border-gray-800 p-1.5 ${isToday ? 'bg-spirit-50 dark:bg-spirit-900/10' : ''}`}>
                <p className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                  isToday ? 'bg-spirit-600 text-white' : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {format(day, 'd')}
                </p>
                <div className="space-y-0.5">
                  {dayCampaigns.slice(0, 3).map(c => (
                    <Link key={c.id} href={`/dashboard/campaigns/${c.id}`}
                      className={`block text-xs px-1.5 py-0.5 rounded truncate ${getStatusColor(c.status)}`}
                      title={c.headline ?? c.title}>
                      {c.headline ?? c.title}
                    </Link>
                  ))}
                  {dayCampaigns.length > 3 && (
                    <p className="text-xs text-gray-400 px-1">+{dayCampaigns.length - 3} more</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {[
          { status: 'draft', label: 'Draft' },
          { status: 'pending_approval', label: 'Pending Approval' },
          { status: 'approved', label: 'Approved' },
          { status: 'scheduled', label: 'Scheduled' },
          { status: 'published', label: 'Published' },
          { status: 'failed', label: 'Failed' },
        ].map(item => (
          <span key={item.status} className={`px-2 py-0.5 rounded-full font-medium ${getStatusColor(item.status)}`}>
            {item.label}
          </span>
        ))}
      </div>
    </div>
  )
}
