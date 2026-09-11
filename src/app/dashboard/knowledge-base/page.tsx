import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Plus, HelpCircle, FileText } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export const metadata = { title: 'Knowledge Base' }

export default async function KnowledgeBasePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: membership } = await supabase
    .from('business_members')
    .select('business_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/dashboard')

  const [{ data: faqs }, { data: docs }] = await Promise.all([
    supabase.from('faqs').select('*').eq('business_id', membership.business_id).order('created_at', { ascending: false }),
    supabase.from('knowledge_documents').select('*').eq('business_id', membership.business_id).order('created_at', { ascending: false }),
  ])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Knowledge Base</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            The AI uses this information to answer customer questions accurately
          </p>
        </div>
      </div>

      {/* FAQs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-spirit-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">FAQs</h2>
            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">{faqs?.length ?? 0}</span>
          </div>
          <Link href="/dashboard/knowledge-base/faqs/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-spirit-600 hover:bg-spirit-700 text-white text-sm font-medium rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Add FAQ
          </Link>
        </div>
        {(!faqs || faqs.length === 0) ? (
          <div className="text-center py-10 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <HelpCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No FAQs yet. Add common questions customers ask.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {faqs.map((faq) => (
              <div key={faq.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {!faq.is_active && (
                        <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">Inactive</span>
                      )}
                      {faq.category && (
                        <span className="text-xs bg-spirit-50 dark:bg-spirit-900/20 text-spirit-600 px-2 py-0.5 rounded-full capitalize">{faq.category}</span>
                      )}
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white">Q: {faq.question}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">A: {faq.answer}</p>
                  </div>
                  <Link href={`/dashboard/knowledge-base/faqs/${faq.id}`}
                    className="text-spirit-600 hover:text-spirit-500 text-sm font-medium flex-shrink-0">Edit</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Documents */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-spirit-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Documents</h2>
            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">{docs?.length ?? 0}</span>
          </div>
          <Link href="/dashboard/knowledge-base/documents/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-spirit-600 hover:bg-spirit-700 text-white text-sm font-medium rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Add Document
          </Link>
        </div>
        {(!docs || docs.length === 0) ? (
          <div className="text-center py-10 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No documents yet. Add business policies, delivery info, etc.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {docs.map((doc) => (
              <Link key={doc.id} href={`/dashboard/knowledge-base/documents/${doc.id}`}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 hover:border-spirit-300 dark:hover:border-spirit-700 transition-colors">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-spirit-600 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{doc.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{doc.document_type} · {formatDate(doc.created_at)}</p>
                    {doc.content && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{doc.content}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
