import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, Plus, Filter } from 'lucide-react'
import { formatDateTime, getStatusColor } from '@/lib/utils'

export const metadata = { title: 'Campaigns' }

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
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
    .from('campaigns')
    .select('*, products(name)')
    .eq('business_id', membership.business_id)
    .order('created_at', { ascending: false })

  if (searchParams.status) {
    query = query.eq('status', searchParams.status)
  }

  const { data: campaigns } = await query

  const statuses = ['draft','pending_approval','approved','scheduled','published','failed','cancelled']

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Campaigns</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{campaigns?.length ?? 0} campaigns</p>
        </div>
        <Link
          href="/dashboard/campaigns/generate"
          className="inline-flex items-center gap-2 px-4 py-2 bg-spirit-600 hover:bg-spirit-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          Generate Advert
        </Link>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        <Link
          href="/dashboard/campaigns"
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!searchParams.status ? 'bg-spirit-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
        >
          All
        </Link>
        {statuses.map(s => (
          <Link
            key={s}
            href={`/dashboard/campaigns?status=${s}`}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${searchParams.status === s ? 'bg-spirit-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            {s.replace('_', ' ')}
          </Link>
        ))}
      </div>

      {(!campaigns || campaigns.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <Sparkles className="w-12 h-12 text-gray-300" />
          <div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">No campaigns yet</p>
            <p className="text-gray-400 text-sm mt-1">Generate your first AI-powered advert</p>
          </div>
          <Link href="/dashboard/campaigns/generate" className="px-4 py-2 bg-spirit-600 hover:bg-spirit-700 text-white text-sm font-semibold rounded-lg transition-colors">
            Generate Advert
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign) => {
            const product = campaign.products as { name?: string } | null
            return (
              <div key={campaign.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{campaign.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(campaign.status)}`}>
                        {campaign.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium capitalize">
                        {campaign.platform}
                      </span>
                    </div>
                    {campaign.headline && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 font-medium">{campaign.headline}</p>
                    )}
                    {campaign.caption && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{campaign.caption}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                      {product?.name && <span>Product: {product.name}</span>}
                      <span>{formatDateTime(campaign.created_at)}</span>
                      {campaign.scheduled_time && <span>Scheduled: {formatDateTime(campaign.scheduled_time)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {campaign.status === 'pending_approval' && (
                      <>
                        <ApproveButton campaignId={campaign.id} />
                        <RejectButton campaignId={campaign.id} />
                      </>
                    )}
                    <Link
                      href={`/dashboard/campaigns/${campaign.id}`}
                      className="px-3 py-1.5 text-xs font-medium text-spirit-600 hover:text-spirit-500 border border-spirit-200 dark:border-spirit-800 rounded-lg transition-colors"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Inline client actions — wrapped in server component for simplicity
// In production these call API routes
function ApproveButton({ campaignId }: { campaignId: string }) {
  return (
    <Link
      href={`/api/campaigns/${campaignId}/approve`}
      className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
    >
      Approve
    </Link>
  )
}

function RejectButton({ campaignId }: { campaignId: string }) {
  return (
    <Link
      href={`/api/campaigns/${campaignId}/reject`}
      className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
    >
      Reject
    </Link>
  )
}
