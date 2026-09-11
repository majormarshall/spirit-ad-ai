'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, Send, Loader2, User } from 'lucide-react'
import { toast } from 'sonner'

interface Message {
  role: 'user' | 'assistant'
  content: string
  confidence?: number
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! 👋 I'm your SPIRIT AD AI assistant. I can help you create adverts, check your campaigns, manage products, and answer questions about your business. What would you like to do?",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message,
        confidence: data.confidence,
      }])
    } catch (err: unknown) {
      toast.error('Failed to get AI response')
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble responding right now. Please try again.",
      }])
    } finally {
      setLoading(false)
    }
  }

  const suggestions = [
    'Create an advert for eggs',
    'Show me pending campaigns',
    'Which products are available?',
    'Generate 3 Facebook posts for tomatoes',
  ]

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-spirit-600 rounded-xl flex items-center justify-center">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">AI Assistant</h1>
          <p className="text-xs text-gray-400">Powered by OpenAI · Uses your live business data</p>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto space-y-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'assistant' ? 'bg-spirit-100 dark:bg-spirit-900/40 text-spirit-600' : 'bg-gray-200 dark:bg-gray-700 text-gray-600'
            }`}>
              {msg.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
              msg.role === 'assistant'
                ? 'bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                : 'bg-spirit-600 text-white'
            }`}>
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              {msg.confidence != null && (
                <p className={`text-xs mt-1 ${msg.confidence < 60 ? 'text-orange-400' : 'text-gray-400'}`}>
                  AI Confidence: {msg.confidence}%{msg.confidence < 60 ? ' · Human review suggested' : ''}
                </p>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-spirit-100 dark:bg-spirit-900/40 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-spirit-600" />
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div className="flex gap-2 flex-wrap mt-3">
          {suggestions.map(s => (
            <button key={s} onClick={() => { setInput(s) }}
              className="text-xs px-3 py-1.5 bg-spirit-50 dark:bg-spirit-900/20 text-spirit-700 dark:text-spirit-400 rounded-full border border-spirit-200 dark:border-spirit-800 hover:bg-spirit-100 transition-colors">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 mt-3">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask anything about your business..."
          disabled={loading}
          className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-spirit-500 text-sm"
        />
        <button type="submit" disabled={loading || !input.trim()}
          className="px-4 py-3 bg-spirit-600 hover:bg-spirit-700 disabled:bg-spirit-400 text-white rounded-xl transition-colors">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  )
}
