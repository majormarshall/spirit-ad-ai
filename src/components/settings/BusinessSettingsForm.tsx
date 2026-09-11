'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Building2, Phone, Globe, MapPin, Clock, Mic, Users } from 'lucide-react'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function BusinessSettingsForm({
  businessId,
  business,
}: {
  businessId: string | null
  business: Record<string, unknown> | null
}) {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)

  const openingHours = (business?.opening_hours as Record<string, string>) ?? {}

  const [form, setForm] = useState({
    name: String(business?.name ?? ''),
    description: String(business?.description ?? ''),
    email: String(business?.email ?? ''),
    phone: String(business?.phone ?? ''),
    phone2: String(business?.phone2 ?? ''),
    website: String(business?.website ?? ''),
    address: String(business?.address ?? ''),
    city: String(business?.city ?? ''),
    state: String(business?.state ?? ''),
    country: String(business?.country ?? 'Nigeria'),
    brand_voice: String(business?.brand_voice ?? ''),
    target_audience: String(business?.target_audience ?? ''),
    currency: String(business?.currency ?? 'NGN'),
    currency_symbol: String(business?.currency_symbol ?? '₦'),
  })

  const [hours, setHours] = useState<Record<string, string>>(
    DAYS.reduce((acc, day) => ({ ...acc, [day]: openingHours[day] ?? '' }), {})
  )

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const payload = { ...form, opening_hours: hours }

      if (businessId) {
        const { error } = await supabase.from('businesses').update(payload).eq('id', businessId)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('businesses')
          .insert({ ...payload, owner_id: user.id })
          .select('id')
          .single()
        if (error) throw error
        // AI permissions are auto-created by trigger; redirect to dashboard
        router.push('/dashboard')
        router.refresh()
      }

      toast.success('Business settings saved')
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const fieldClass = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-spirit-500 text-sm'
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'

  function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-5 h-5 text-spirit-600" />
          <h2 className="font-semibold text-gray-900 dark:text-white">{title}</h2>
        </div>
        {children}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {businessId ? 'Business Settings' : 'Create Your Business'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
          This information is used by the AI — keep it accurate and up to date
        </p>
      </div>

      <Section icon={Building2} title="Business Information">
        <div>
          <label className={labelClass}>Business Name *</label>
          <input name="name" required value={form.name} onChange={handleChange} className={fieldClass} placeholder="Pinnacles Resource Centre Farm" />
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={3}
            className={fieldClass + ' resize-none'} placeholder="What does your business do?" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} className={fieldClass} placeholder="info@example.com" />
          </div>
          <div>
            <label className={labelClass}>Website</label>
            <input name="website" value={form.website} onChange={handleChange} className={fieldClass} placeholder="https://example.com" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Currency</label>
            <select name="currency" value={form.currency} onChange={handleChange} className={fieldClass}>
              <option value="NGN">NGN (Nigerian Naira)</option>
              <option value="USD">USD (US Dollar)</option>
              <option value="GBP">GBP (British Pound)</option>
              <option value="GHS">GHS (Ghanaian Cedi)</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Currency Symbol</label>
            <input name="currency_symbol" value={form.currency_symbol} onChange={handleChange} className={fieldClass} placeholder="₦" />
          </div>
        </div>
      </Section>

      <Section icon={Phone} title="Contact">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Primary Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange} className={fieldClass} placeholder="09037505632" />
          </div>
          <div>
            <label className={labelClass}>Secondary Phone</label>
            <input name="phone2" value={form.phone2} onChange={handleChange} className={fieldClass} placeholder="07078210834" />
          </div>
        </div>
      </Section>

      <Section icon={MapPin} title="Location">
        <div>
          <label className={labelClass}>Address</label>
          <input name="address" value={form.address} onChange={handleChange} className={fieldClass} placeholder="Street address" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>City</label>
            <input name="city" value={form.city} onChange={handleChange} className={fieldClass} placeholder="Offa" />
          </div>
          <div>
            <label className={labelClass}>State</label>
            <input name="state" value={form.state} onChange={handleChange} className={fieldClass} placeholder="Kwara State" />
          </div>
          <div>
            <label className={labelClass}>Country</label>
            <input name="country" value={form.country} onChange={handleChange} className={fieldClass} placeholder="Nigeria" />
          </div>
        </div>
      </Section>

      <Section icon={Clock} title="Opening Hours">
        <div className="space-y-2">
          {DAYS.map(day => (
            <div key={day} className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-400 w-24 flex-shrink-0">{day}</span>
              <input
                value={hours[day]}
                onChange={e => setHours(prev => ({ ...prev, [day]: e.target.value }))}
                className={fieldClass}
                placeholder="e.g. 8:00 AM – 6:00 PM or Closed"
              />
            </div>
          ))}
        </div>
      </Section>

      <Section icon={Mic} title="Brand Voice">
        <div>
          <label className={labelClass}>Brand Voice</label>
          <textarea name="brand_voice" value={form.brand_voice} onChange={handleChange} rows={2}
            className={fieldClass + ' resize-none'}
            placeholder="e.g. Friendly, professional, trustworthy, community-focused" />
          <p className="text-xs text-gray-400 mt-1">The AI uses this to match your tone in all generated content</p>
        </div>
      </Section>

      <Section icon={Users} title="Target Audience">
        <div>
          <label className={labelClass}>Target Audience</label>
          <textarea name="target_audience" value={form.target_audience} onChange={handleChange} rows={2}
            className={fieldClass + ' resize-none'}
            placeholder="e.g. Households, restaurants, and food vendors in Offa and surrounding areas" />
        </div>
      </Section>

      <button type="submit" disabled={saving}
        className="w-full py-3 px-4 bg-spirit-600 hover:bg-spirit-700 disabled:bg-spirit-400 text-white font-semibold rounded-xl transition-colors">
        {saving ? 'Saving...' : (businessId ? 'Save Settings' : 'Create Business')}
      </button>
    </form>
  )
}
