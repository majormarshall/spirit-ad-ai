import Link from 'next/link'

export default function VerifyEmailPage() {
  return (
    <div className="text-center">
      <div className="text-5xl mb-4">📬</div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Verify your email</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        We sent a verification link to your email address. Click the link to activate your account.
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Already verified?{' '}
        <Link href="/auth/login" className="text-spirit-600 hover:text-spirit-500 font-medium">Sign in</Link>
      </p>
    </div>
  )
}
