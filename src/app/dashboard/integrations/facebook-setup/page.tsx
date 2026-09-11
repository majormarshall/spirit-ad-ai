'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle, Copy, ExternalLink, ArrowLeft, AlertCircle } from 'lucide-react'

export default function FacebookSetupPage() {
  const [appId, setAppId] = useState('')
  const [appSecret, setAppSecret] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const callbackUrl = 'https://spirit-ad-ai.vercel.app/api/integrations/facebook/callback'

  function copy(text: string, field: string) {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  async function saveCredentials(e: React.FormEvent) {
    e.preventDefault()
    if (!appId || !appSecret) { setError('Both App ID and App Secret are required'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/integrations/facebook/save-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
      })
      if (!res.ok) throw new Error(await res.text())
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const steps = [
    {
      number: 1,
      title: 'Open Meta for Developers',
      content: (
        <div className="space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">Sign in with your Facebook account and go to your apps.</p>
          <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
            Open Meta Developer Portal <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      ),
    },
    {
      number: 2,
      title: 'Create or select your app',
      content: (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Click <strong>My Apps</strong> → <strong>Create App</strong> (if you don't have one) → choose <strong>Business</strong> → name it <em>Spirit AD AI</em>. Or open your existing app.
        </p>
      ),
    },
    {
      number: 3,
      title: 'Add Facebook Login & Instagram products',
      content: (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          In your app → click <strong>Add Product</strong>:<br />
          → Add <strong>Facebook Login for Business</strong><br />
          → Add <strong>Instagram</strong> (for Instagram publishing)
        </p>
      ),
    },
    {
      number: 4,
      title: 'Set the OAuth redirect URI',
      content: (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Go to <strong>Facebook Login for Business → Settings → Client OAuth Settings</strong> and add this as a <strong>Valid OAuth Redirect URI</strong>:
          </p>
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700">
            <code className="text-xs text-gray-800 dark:text-gray-200 flex-1 break-all">{callbackUrl}</code>
            <button onClick={() => copy(callbackUrl, 'callback')} className="text-gray-400 hover:text-gray-600 shrink-0">
              {copiedField === 'callback' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Click <strong>Save Changes</strong>.</p>
        </div>
      ),
    },
    {
      number: 5,
      title: 'Get your App ID and App Secret',
      content: (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Go to <strong>App Settings → Basic</strong>. You'll see your <strong>App ID</strong> at the top, and click <strong>Show</strong> next to <strong>App Secret</strong> to reveal it. Copy both below.
        </p>
      ),
    },
    {
      number: 6,
      title: 'Enter your credentials',
      content: (
        <form onSubmit={saveCredentials} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Meta App ID</label>
            <input
              type="text"
              value={appId}
              onChange={e => setAppId(e.target.value)}
              placeholder="e.g. 1234567890123456"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-spirit-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Meta App Secret</label>
            <input
              type="password"
              value={appSecret}
              onChange={e => setAppSecret(e.target.value)}
              placeholder="Paste your app secret here"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-spirit-500"
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
          {saved ? (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium">
              <CheckCircle className="w-4 h-4" /> Credentials saved! Click Connect below.
            </div>
          ) : (
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-spirit-600 hover:bg-spirit-700 disabled:bg-spirit-400 text-white text-sm font-semibold rounded-lg transition-colors">
              {saving ? 'Saving...' : 'Save Credentials'}
            </button>
          )}
        </form>
      ),
    },
    {
      number: 7,
      title: 'Connect Facebook & Instagram',
      content: (
        <div className="space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            After saving your credentials, click the button below to authorise Spirit AD AI to post on your behalf.
          </p>
          <a href="/api/integrations/facebook/connect"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
            📘 Connect Facebook & Instagram
          </a>
          <p className="text-xs text-gray-400 mt-1">
            You'll be redirected to Facebook, shown a permission screen, then returned here automatically.
          </p>
        </div>
      ),
    },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/integrations" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📘 Connect Facebook & Instagram</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Connect your pages to publish AI-generated content automatically</p>
        </div>
      </div>

      <div className="space-y-4">
        {steps.map((step) => (
          <div key={step.number} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">{step.number}</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                {step.content}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-400">
        <strong>📋 Permissions needed:</strong> pages_show_list, pages_read_engagement, pages_manage_posts, instagram_basic, instagram_content_publish
      </div>

      <Link href="/dashboard/integrations"
        className="block text-center px-4 py-2.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-colors">
        ← Back to Integrations
      </Link>
    </div>
  )
}
