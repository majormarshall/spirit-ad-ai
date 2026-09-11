import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plug, CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

export const metadata = { title: 'Integrations' }

const PLATFORMS = [
  {
    id: 'facebook',
    name: 'Facebook',
    icon: '📘',
    description: 'Connect your Facebook Page to publish posts and view analytics',
    features: ['Publish posts', 'View page analytics', 'Schedule content'],
    oauthPath: '/api/integrations/facebook/connect',
    docsPath: 'https://developers.facebook.com/docs/',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '📷',
    description: 'Connect your Instagram Business account for publishing and analytics',
    features: ['Publish photos/videos', 'Instagram Insights', 'Schedule content'],
    oauthPath: '/api/integrations/instagram/connect',
    docsPath: 'https://developers.facebook.com/docs/instagram-api/',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    icon: '💬',
    description: 'Connect the WhatsApp Business API for customer messaging',
    features: ['Receive messages', 'AI auto-replies', 'Lead detection'],
    oauthPath: '/dashboard/integrations/whatsapp-setup',
    docsPath: 'https://developers.facebook.com/docs/whatsapp/',
  },
]

export default async function IntegrationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: membership } = await supabase
    .from('business_members')
    .select('business_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/dashboard')

  const { data: integrations } = await supabase
    .from('integrations')
    .select('*')
    .eq('business_id', membership.business_id)

  const integrationMap = Object.fromEntries(
    (integrations ?? []).map(i => [i.platform, i])
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Integrations</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
          Connect your social media accounts. OAuth is used — we never store your passwords.
        </p>
      </div>

      <div className="grid gap-5">
        {PLATFORMS.map(platform => {
          const integration = integrationMap[platform.id]
          const isConnected = integration?.status === 'connected'
          const isError = integration?.status === 'error' || integration?.status === 'expired'

          return (
            <div key={platform.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{platform.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{platform.name}</h3>
                      {isConnected && (
                        <span className="flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">
                          <CheckCircle className="w-3 h-3" /> Connected
                        </span>
                      )}
                      {isError && (
                        <span className="flex items-center gap-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">
                          <AlertCircle className="w-3 h-3" /> {integration.status}
                        </span>
                      )}
                      {!integration && (
                        <span className="flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                          <XCircle className="w-3 h-3" /> Not connected
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{platform.description}</p>
                    <ul className="flex flex-wrap gap-2">
                      {platform.features.map(f => (
                        <li key={f} className="text-xs bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700">
                          {f}
                        </li>
                      ))}
                    </ul>
                    {isConnected && integration.account_name && (
                      <p className="text-xs text-gray-400 mt-3">
                        Connected as: <span className="font-medium text-gray-600 dark:text-gray-300">{integration.account_name}</span>
                        {integration.last_synced_at && ` · Last synced ${formatDateTime(integration.last_synced_at)}`}
                      </p>
                    )}
                    {isError && integration.error_message && (
                      <p className="text-xs text-red-500 mt-2">{integration.error_message}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a href={platform.docsPath} target="_blank" rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" title="Documentation">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  {isConnected ? (
                    <Link
                      href={`/api/integrations/${platform.id}/disconnect`}
                      className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      Disconnect
                    </Link>
                  ) : (
                    <Link
                      href={platform.oauthPath}
                      className="px-4 py-2 text-sm font-semibold text-white bg-spirit-600 hover:bg-spirit-700 rounded-lg transition-colors"
                    >
                      Connect
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-400">
        <strong>🔒 Security note:</strong> All connections use official OAuth. We never request your passwords.
        You can disconnect any integration at any time. OAuth tokens are stored securely.
      </div>
    </div>
  )
}
