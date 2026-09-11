'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
      })
      if (error) throw error
      setSent(true)
      toast.success('Reset link sent! Check your email.')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send reset link'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="text-5xl mb-4">📧</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Check your email</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">We sent a password reset link to <strong>{email}</strong></p>
        <Link href="/auth/login" className="text-spirit-600 hover:text-spirit-500 font-medium">Back to login</Link>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Reset password</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">Enter your email to receive a reset link</p>
      <form onSubmit={handleReset} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email address</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-spirit-500 focus:border-transparent"
            placeholder="you@example.com" />
        </div>
        <button type="submit" disabled={loading}
          className="w-full py-2.5 px-4 bg-spirit-600 hover:bg-spirit-700 disabled:bg-spirit-400 text-white font-semibold rounded-lg transition-colors">
          {loading ? 'Sending...' : 'Send reset link'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm">
        <Link href="/auth/login" className="text-spirit-600 hover:text-spirit-500 font-medium">Back to login</Link>
      </p>
    </div>
  )
}
