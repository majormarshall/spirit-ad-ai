'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Shield, Zap, Power } from 'lucide-react'
import type { Tables } from '@/lib/supabase/types'

type AIPerms = Tables<'ai_permissions'>

interface PermGroup {
  label: string
  key: string
  perms: { key: string; label: string; risk: 'low' | 'medium' | 'high' }[]
}

const PERM_GROUPS: PermGroup[] = [
  {
    label: 'Marketing',
    key: 'marketing',
    perms: [
      { key: 'generate_adverts', label: 'Generate adverts', risk: 'low' },
      { key: 'generate_images', label: 'Generate images', risk: 'low' },
      { key: 'schedule_posts', label: 'Schedule posts', risk: 'medium' },
      { key: 'publish_automatically', label: 'Publish automatically (no approval)', risk: 'high' },
    ],
  },
  {
    label: 'Facebook',
    key: 'facebook',
    perms: [
      { key: 'publish_posts', label: 'Publish posts', risk: 'medium' },
      { key: 'delete_posts', label: 'Delete posts', risk: 'high' },
    ],
  },
  {
    label: 'Instagram',
    key: 'instagram',
    perms: [
      { key: 'publish_posts', label: 'Publish posts', risk: 'medium' },
      { key: 'delete_posts', label: 'Delete posts', risk: 'high' },
    ],
  },
  {
    label: 'WhatsApp',
    key: 'whatsapp',
    perms: [
      { key: 'read_messages', label: 'Read incoming messages', risk: 'low' },
      { key: 'answer_faqs', label: 'Answer FAQs automatically', risk: 'low' },
      { key: 'detect_leads', label: 'Detect leads', risk: 'low' },
      { key: 'send_bulk', label: 'Send bulk promotional messages', risk: 'high' },
    ],
  },
  {
    label: 'Orders',
    key: 'orders',
    perms: [
      { key: 'create_drafts', label: 'Create order drafts', risk: 'low' },
      { key: 'confirm_orders', label: 'Confirm orders automatically', risk: 'high' },
    ],
  },
  {
    label: 'Business Data',
    key: 'business',
    perms: [
      { key: 'modify_products', label: 'Modify products', risk: 'high' },
      { key: 'modify_prices', label: 'Modify prices', risk: 'high' },
    ],
  },
]

const riskColors = {
  low: 'text-green-600',
  medium: 'text-yellow-600',
  high: 'text-red-600',
}

export default function PermissionsEditor({ initialPerms, businessId }: { initialPerms: AIPerms | null; businessId: string }) {
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [autopilot, setAutopilot] = useState(initialPerms?.autopilot_enabled ?? false)
  const [approvalMode, setApprovalMode] = useState(initialPerms?.approval_mode ?? 'approval')
  const [threshold, setThreshold] = useState(initialPerms?.confidence_threshold ?? 60)
  const [perms, setPerms] = useState<Record<string, Record<string, boolean>>>(
    (initialPerms?.permissions as Record<string, Record<string, boolean>>) ?? {}
  )

  function togglePerm(group: string, key: string) {
    setPerms(prev => ({
      ...prev,
      [group]: {
        ...prev[group],
        [key]: !(prev[group]?.[key] ?? false),
      },
    }))
  }

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase
      .from('ai_permissions')
      .upsert({
        business_id: businessId,
        permissions: perms,
        autopilot_enabled: autopilot,
        approval_mode: approvalMode as 'approval' | 'auto',
        confidence_threshold: threshold,
      }, { onConflict: 'business_id' })

    if (error) {
      toast.error('Failed to save permissions')
    } else {
      toast.success('AI permissions saved')
    }
    setSaving(false)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Permissions</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Control exactly what the AI is allowed to do</p>
      </div>

      {/* Autopilot control */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${autopilot ? 'bg-spirit-100 dark:bg-spirit-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
              <Zap className={`w-5 h-5 ${autopilot ? 'text-spirit-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">AI Autopilot</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Allow AI to run scheduled tasks automatically</p>
            </div>
          </div>
          <button
            onClick={() => setAutopilot(!autopilot)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${autopilot ? 'bg-spirit-600' : 'bg-gray-300 dark:bg-gray-600'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autopilot ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Approval Mode</label>
            <select value={approvalMode} onChange={e => setApprovalMode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-spirit-500 text-sm">
              <option value="approval">Approval Mode (requires human approval)</option>
              <option value="auto">Auto Mode (AI publishes directly)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              AI Confidence Threshold: {threshold}%
            </label>
            <input type="range" min="0" max="100" value={threshold} onChange={e => setThreshold(Number(e.target.value))}
              className="w-full accent-spirit-600" />
            <p className="text-xs text-gray-400 mt-1">Below this, AI escalates to a human</p>
          </div>
        </div>
      </div>

      {/* Permission groups */}
      {PERM_GROUPS.map(group => (
        <div key={group.key} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-spirit-600" />
            <h2 className="font-semibold text-gray-900 dark:text-white">{group.label}</h2>
          </div>
          <div className="space-y-3">
            {group.perms.map(perm => {
              const isEnabled = perms[group.key]?.[perm.key] ?? false
              return (
                <div key={perm.key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{perm.label}</p>
                    <p className={`text-xs font-medium ${riskColors[perm.risk]}`}>
                      {perm.risk === 'high' ? '⚠ High risk' : perm.risk === 'medium' ? '◆ Medium risk' : '✓ Low risk'}
                    </p>
                  </div>
                  <button
                    onClick={() => togglePerm(group.key, perm.key)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${isEnabled ? 'bg-spirit-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <button onClick={handleSave} disabled={saving}
        className="w-full py-3 px-4 bg-spirit-600 hover:bg-spirit-700 disabled:bg-spirit-400 text-white font-semibold rounded-xl transition-colors">
        {saving ? 'Saving...' : 'Save AI Permissions'}
      </button>
    </div>
  )
}
