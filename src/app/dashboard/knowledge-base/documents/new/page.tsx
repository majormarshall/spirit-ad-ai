import DocumentForm from '@/components/knowledge/DocumentForm'
import Link from 'next/link'
export const metadata = { title: 'Add Document' }
export default function NewDocumentPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/knowledge-base" className="text-spirit-600 hover:text-spirit-500 text-sm">← Knowledge Base</Link>
        <span className="text-gray-400">/</span>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Add Document</h1>
      </div>
      <DocumentForm />
    </div>
  )
}
