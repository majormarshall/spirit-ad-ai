'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'

interface Props {
  businessId?: string
  faq?: {
    id: string
    question: string
    answer: string
    category: string
    is_active: boolean
  }
}

export default function FAQForm({ businessId, faq }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    question: faq?.question ?? '',
    answer: faq?.answer ?? '',
    category: faq?.category ?? 'general',
    is_active: faq?.is_active ?? true,
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    try {
      if (!businessId && !faq) {
        // Get businessId from server
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')
        const { data: m } = await supabase.from('business_members').select('business_id').eq('user_id', user.id).single()
        if (!m) throw new Error('No business found')
        const bid = m.business_id
        const { error } = await supabase.from('faqs').insert({ ...form, business_id: bid })
        if (error) throw error
      } else if (faq?.id) {
        const { error } = await supabase.from('faqs').update(form).eq('id', faq.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('faqs').insert({ ...form, business_id: businessId })
        if (error) throw error
      }
      toast.success(faq ? 'FAQ updated' : 'FAQ created')
      router.push('/dashboard/knowledge-base')
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-spirit-500 text-sm'

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Question *</label>
        <input required name="question" value={form.question} onChange={handleChange} className={inputClass}
          placeholder="e.g. How much is a crate of eggs?" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Answer *</label>
        <textarea required name="answer" value={form.answer} onChange={handleChange} rows={4}
          className={inputClass + ' resize-none'} placeholder="The accurate answer. Do not guess — only enter verified information." />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
        <select name="category" value={form.category} onChange={handleChange} className={inputClass}>
          {['general', 'products', 'pricing', 'delivery', 'location', 'hours', 'orders', 'bulk', 'contact'].map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="faq_active" checked={form.is_active}
          onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
          className="w-4 h-4 text-spirit-600 rounded border-gray-300 focus:ring-spirit-500" />
        <label htmlFor="faq_active" className="text-sm text-gray-700 dark:text-gray-300">Active (AI will use this FAQ)</label>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading}
          className="flex-1 py-2.5 px-4 bg-spirit-600 hover:bg-spirit-700 disabled:bg-spirit-400 text-white font-semibold rounded-lg transition-colors text-sm">
          {loading ? 'Saving...' : (faq ? 'Update FAQ' : 'Add FAQ')}
        </button>
        <Link href="/dashboard/knowledge-base"
          className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm text-center">
          Cancel
        </Link>
      </div>
    </form>
  )
}
