'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'

interface Props {
  businessId?: string
  doc?: { id: string; title: string; content: string; document_type: string }
}

export default function DocumentForm({ businessId, doc }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: doc?.title ?? '',
    content: doc?.content ?? '',
    document_type: doc?.document_type ?? 'text',
  })

  const inputClass = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-spirit-500 text-sm'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    try {
      let bid = businessId
      if (!bid) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')
        const { data: m } = await supabase.from('business_members').select('business_id').eq('user_id', user.id).single()
        bid = m?.business_id
      }
      if (doc?.id) {
        const { error } = await supabase.from('knowledge_documents').update(form).eq('id', doc.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('knowledge_documents').insert({ ...form, business_id: bid })
        if (error) throw error
      }
      toast.success(doc ? 'Document updated' : 'Document created')
      router.push('/dashboard/knowledge-base')
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
        <input required name="title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
          className={inputClass} placeholder="e.g. Delivery Policy, Business Info" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
        <select name="document_type" value={form.document_type}
          onChange={e => setForm(p => ({ ...p, document_type: e.target.value }))} className={inputClass}>
          <option value="text">Text</option>
          <option value="policy">Policy</option>
          <option value="faq_set">FAQ Set</option>
          <option value="product_info">Product Info</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content *</label>
        <textarea required name="content" value={form.content}
          onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
          rows={10} className={inputClass + ' resize-y'}
          placeholder="Enter the document content. The AI will use this to answer customer questions." />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading}
          className="flex-1 py-2.5 px-4 bg-spirit-600 hover:bg-spirit-700 disabled:bg-spirit-400 text-white font-semibold rounded-lg transition-colors text-sm">
          {loading ? 'Saving...' : (doc ? 'Update Document' : 'Save Document')}
        </button>
        <Link href="/dashboard/knowledge-base"
          className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm text-center">
          Cancel
        </Link>
      </div>
    </form>
  )
}
