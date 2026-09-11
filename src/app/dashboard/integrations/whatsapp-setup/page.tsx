'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle, Copy, ExternalLink, ArrowLeft } from 'lucide-react'

export default function WhatsAppSetupPage() {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const webhookUrl = 'https://spirit-ad-ai.vercel.app/api/webhooks/whatsapp'
  const verifyToken = 'spirit-webhook-verify-2024'

  function copy(text: string, field: string) {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const steps = [
    {
      number: 1,
      title: 'Go to Meta for Developers',
      content: (
        <div className="space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Open the Meta Developer portal and sign in with your Facebook account.
          </p>
          <a
            href="https://developers.facebook.com/apps"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Open Meta Developer Portal <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      ),
    },
    {
      number: 2,
      title: 'Create or open your app',
      content: (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Click <strong>My Apps</strong> → select your existing app or click <strong>Create App</strong> → choose <strong>Business</strong> type → name it <em>Spirit AD AI</em>.
        </p>
      ),
    },
    {
      number: 3,
      title: 'Add the WhatsApp product',
      content: (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Inside your app dashboard, click <strong>Add Product</strong> → find <strong>WhatsApp</strong> → click <strong>Set up</strong>.
        </p>
      ),
    },
    {
      number: 4,
      title: 'Configure the Webhook',
      content: (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Go to <strong>WhatsApp → Configuration → Webhooks</strong> → click <strong>Edit</strong> and paste these values:
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700">
              <span className="text-xs font-medium text-gray-500 w-28 shrink-0">Callback URL</span>
              <code className="text-xs text-gray-800 dark:text-gray-200 flex-1 truncate">{webhookUrl}</code>
              <button
                onClick={() => copy(webhookUrl, 'url')}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0"
              >
                {copiedField === 'url' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700">
              <span className="text-xs font-medium text-gray-500 w-28 shrink-0">Verify Token</span>
              <code className="text-xs text-gray-800 dark:text-gray-200 flex-1">{verifyToken}</code>
              <button
                onClick={() => copy(verifyToken, 'token')}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0"
              >
                {copiedField === 'token' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Then click <strong>Verify and Save</strong>. ✅
          </p>
        </div>
      ),
    },
    {
      number: 5,
      title: 'Subscribe to messages',
      content: (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Under <strong>Webhook Fields</strong>, find <strong>messages</strong> and click <strong>Subscribe</strong>. This allows the AI to receive and reply to customer messages.
        </p>
      ),
    },
    {
      number: 6,
      title: 'Add your phone number',
      content: (
        <div className="space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Go to <strong>WhatsApp → API Setup</strong>. Under <strong>From</strong>, add your WhatsApp Business phone number (<strong>09037505632</strong> or <strong>07078210834</strong>).
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Copy the <strong>Phone Number ID</strong> and <strong>WhatsApp Business Account ID</strong> shown on that page — you may need them to generate a permanent token.
          </p>
        </div>
      ),
    },
    {
      number: 7,
      title: 'Test it!',
      content: (
        <div className="space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Send a WhatsApp message to your business number. The AI will automatically reply with answers based on your products and FAQs within seconds.
          </p>
          <p className="text-sm font-medium text-green-600 dark:text-green-400">
            🎉 Setup complete! Your AI is now handling WhatsApp messages for Pinnacles Resource Centre Farm.
          </p>
        </div>
      ),
    },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/integrations" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">💬 Connect WhatsApp Business</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            Follow these 7 steps to connect your WhatsApp Business API
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {steps.map((step) => (
          <div key={step.number} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-spirit-600 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                {step.number}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                {step.content}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm text-amber-700 dark:text-amber-400">
        <strong>⚠️ Important:</strong> Your WhatsApp Business Account must be verified by Meta before going live. 
        During testing, you can send messages from your registered test number. 
        Meta reviews typically take 1–3 business days.
      </div>

      <div className="flex gap-3">
        <Link
          href="/dashboard/integrations"
          className="flex-1 text-center px-4 py-2.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-colors"
        >
          ← Back to Integrations
        </Link>
        <a
          href="https://developers.facebook.com/apps"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          Open Meta Portal →
        </a>
      </div>
    </div>
  )
}
