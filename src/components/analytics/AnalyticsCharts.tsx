'use client'

import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import type { Tables } from '@/lib/supabase/types'

type Snapshot = Tables<'analytics_snapshots'>

export default function AnalyticsCharts({ snapshots }: { snapshots: Snapshot[] }) {
  if (snapshots.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-10 text-center">
        <p className="text-gray-400 text-sm">Analytics data will appear here as your platform collects activity. Check back after some campaigns have been published.</p>
      </div>
    )
  }

  const data = snapshots.map(s => ({
    date: s.metric_date,
    Campaigns: s.campaigns_total,
    Published: s.posts_published,
    Conversations: s.conversations,
    'AI Responses': s.ai_responses,
    Leads: s.leads_detected,
    Orders: s.orders_created,
    'Human Handoffs': s.human_handoffs,
  }))

  const chartClass = 'bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className={chartClass}>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Campaign Performance</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Campaigns" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Published" fill="#16a34a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className={chartClass}>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Customer Conversations</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="Conversations" stroke="#6366f1" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="AI Responses" stroke="#22c55e" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Human Handoffs" stroke="#ef4444" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className={chartClass}>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Leads & Orders</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Leads" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className={chartClass}>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">AI vs Human Responses</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="AI Responses" stroke="#22c55e" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Human Handoffs" stroke="#ef4444" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
