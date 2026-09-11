'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Sparkles, Loader2, ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'

const PLATFORMS = ['all', 'facebook', 'instagram', 'whatsapp'] as const
const CONTENT_TYPES = [
  'product_promotion',
  'educational_content',
  'business_update',
  'seasonal_promotion',
  'special_offer',
  'engagement_post',
  'availability_announcement',
  'behind_the_scenes',
] as const

interface GeneratedCampaign {
  id: string
  title: string
  headline: string
  caption: string
  callToAction: string
  hashtags: string[]
  imagePrompt: string
  marketingAngle: string
  selectedProductId: string | null
}

export default function GenerateCampaignPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<GeneratedCampaign | null>(null)
  const [form, setForm] = useState({
    platform: 'all' as typeof PLATFORMS[number],
    contentType: 'product_promotion' as typeof CONTENT_TYPES[number],
    specificProduct: '',
  })

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    setGenerating(true)
    setResult(null)
    try {
      const res = await fetch('/api/ai/generate-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Generation failed')
      setResult(data)
      toast.success('Campaign generated successfully!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate campaign')
    } finally {
      setGenerating(false)
    }
  }

  async function handleSave(status: 'draft' | 'pending_approval') {
    if (!result) return
    setLoading(true)
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...result, status, platform: form.platform }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed')
      toast.success(status === 'draft' ? 'Saved as draft' : 'Submitted for approval')
      router.push('/dashboard/campaigns')
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/campaigns" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Generate Advert</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">AI will read your business data and create content</p>
        </div>
      </div>

      {/* Settings form */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-5">
        <h2 className="font-semibold text-gray-900 dark:text-white">Campaign Settings</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Platform</label>
            <select value={form.platform} onChange={e => setForm(p => ({ ...p, platform: e.target.value as typeof PLATFORMS[number] }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-spirit-500">
              {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content Type</label>
            <select value={form.contentType} onChange={e => setForm(p => ({ ...p, contentType: e.target.value as typeof CONTENT_TYPES[number] }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-spirit-500">
              {CONTENT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Focus on specific product <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input value={form.specificProduct} onChange={e => setForm(p => ({ ...p, specificProduct: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-spirit-500"
            placeholder="e.g. Eggs, Tomatoes — leave blank for AI to choose" />
        </div>

        <button onClick={handleGenerate} disabled={generating}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-spirit-600 hover:bg-spirit-700 disabled:bg-spirit-400 text-white font-semibold rounded-lg transition-colors">
          {generating ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generating with AI...</>
          ) : (
            <><Sparkles className="w-4 h-4" /> Generate Today&apos;s Advert</>
          )}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-spirit-200 dark:border-spirit-800 p-6 space-y-5 animate-fade-in">
          <div className="flex items-center gap-2 text-spirit-600">
            <CheckCircle className="w-5 h-5" />
            <h2 className="font-semibold">Generated Campaign</h2>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Headline</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{result.headline}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Caption</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{result.caption}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Call to Action</p>
              <p className="text-sm font-medium text-spirit-600">{result.callToAction}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Hashtags</p>
              <div className="flex flex-wrap gap-1">
                {result.hashtags.map(h => (
                  <span key={h} className="text-xs px-2 py-0.5 bg-spirit-50 dark:bg-spirit-900/20 text-spirit-700 dark:text-spirit-400 rounded-full">{h.startsWith('#') ? h : `#${h}`}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Image Prompt (for DALL-E)</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">{result.imagePrompt}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Marketing Angle</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 italic">{result.marketingAngle}</p>
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            <button onClick={() => handleSave('pending_approval')} disabled={loading}
              className="flex-1 py-2.5 px-4 bg-spirit-600 hover:bg-spirit-700 disabled:bg-spirit-400 text-white font-semibold rounded-lg transition-colors text-sm">
              {loading ? 'Saving...' : 'Submit for Approval'}
            </button>
            <button onClick={() => handleSave('draft')} disabled={loading}
              className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm">
              Save as Draft
            </button>
            <button onClick={handleGenerate} disabled={generating}
              className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm">
              Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
