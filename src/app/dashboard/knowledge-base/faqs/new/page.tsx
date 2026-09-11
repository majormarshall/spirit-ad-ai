import FAQForm from '@/components/knowledge/FAQForm'
import Link from 'next/link'

export const metadata = { title: 'Add FAQ' }

export default function NewFAQPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/knowledge-base" className="text-spirit-600 hover:text-spirit-500 text-sm">← Knowledge Base</Link>
        <span className="text-gray-400">/</span>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Add FAQ</h1>
      </div>
      <FAQForm />
    </div>
  )
}
