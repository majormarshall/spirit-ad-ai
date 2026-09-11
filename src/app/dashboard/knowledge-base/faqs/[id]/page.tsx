import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import FAQForm from '@/components/knowledge/FAQForm'
import Link from 'next/link'

export const metadata = { title: 'Edit FAQ' }

export default async function EditFAQPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: membership } = await supabase
    .from('business_members')
    .select('business_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/dashboard')

  const { data: faq } = await supabase
    .from('faqs')
    .select('*')
    .eq('id', params.id)
    .eq('business_id', membership.business_id)
    .single()

  if (!faq) notFound()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/knowledge-base" className="text-spirit-600 hover:text-spirit-500 text-sm">← Knowledge Base</Link>
        <span className="text-gray-400">/</span>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Edit FAQ</h1>
      </div>
      <FAQForm businessId={membership.business_id} faq={faq} />
    </div>
  )
}
