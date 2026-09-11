'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Send, UserCheck, Bot, User, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { timeAgo, getStatusColor } from '@/lib/utils'
import type { Tables } from '@/lib/supabase/types'

type ConversationType = Tables<'conversations'> & { customers: Tables<'customers'> | null }
type MessageType = Tables<'messages'>

interface Props {
  conversation: ConversationType
  messages: MessageType[]
  userId: string
}

export default function ConversationView({ conversation: initial, messages: initialMessages, userId }: Props) {
  const supabase = createClient()
  const [conversation, setConversation] = useState(initial)
  const [messages, setMessages] = useState(initialMessages)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const customer = conversation.customers

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`conversation-${conversation.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversation.id}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as MessageType])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversation.id, supabase])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleTakeOver() {
    const { error } = await supabase
      .from('conversations')
      .update({ status: 'assigned', assigned_to: userId, ai_enabled: false })
      .eq('id', conversation.id)

    if (error) {
      toast.error('Failed to take over conversation')
    } else {
      setConversation(prev => ({ ...prev, status: 'assigned', ai_enabled: false }))
      toast.success('You have taken over this conversation. AI is paused.')
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim()) return
    setSending(true)

    const { error } = await supabase.from('messages').insert({
      conversation_id: conversation.id,
      sender_type: 'human',
      sender_id: userId,
      message: newMessage.trim(),
      message_type: 'text',
    })

    if (error) {
      toast.error('Failed to send message')
    } else {
      setNewMessage('')
      // Also send via WhatsApp API
      await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversation.id,
          message: newMessage.trim(),
          to: customer?.phone,
        }),
      })
    }
    setSending(false)
  }

  function getSenderIcon(senderType: string) {
    if (senderType === 'customer') return <User className="w-4 h-4" />
    if (senderType === 'ai') return <Bot className="w-4 h-4" />
    return <UserCheck className="w-4 h-4" />
  }

  function getSenderColor(senderType: string) {
    if (senderType === 'customer') return 'bg-gray-100 dark:bg-gray-800'
    if (senderType === 'ai') return 'bg-spirit-50 dark:bg-spirit-900/20 ml-auto'
    return 'bg-blue-50 dark:bg-blue-900/20 ml-auto'
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800 mb-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/messages" className="text-spirit-600 hover:text-spirit-500 text-sm">← Back</Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {customer?.name ?? customer?.phone ?? 'Unknown Customer'}
              </h2>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(conversation.status)}`}>
                {conversation.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-gray-400">{customer?.phone} · {conversation.platform}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {conversation.ai_enabled && (
            <span className="flex items-center gap-1 text-xs text-spirit-600 bg-spirit-50 dark:bg-spirit-900/20 px-2 py-1 rounded-full">
              <Bot className="w-3 h-3" /> AI Active
            </span>
          )}
          {(conversation.status === 'needs_human' || conversation.status === 'open') && (
            <button
              onClick={handleTakeOver}
              className="flex items-center gap-1 px-3 py-1.5 bg-spirit-600 hover:bg-spirit-700 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <UserCheck className="w-3 h-3" /> Take Over
            </button>
          )}
        </div>
      </div>

      {/* Needs human alert */}
      {conversation.status === 'needs_human' && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4 text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          This conversation needs human attention. Click &quot;Take Over&quot; to respond manually.
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.sender_type !== 'customer' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.sender_type === 'customer' ? 'bg-gray-200 dark:bg-gray-700 text-gray-600' :
              msg.sender_type === 'ai' ? 'bg-spirit-100 dark:bg-spirit-900/40 text-spirit-600' :
              'bg-blue-100 dark:bg-blue-900/40 text-blue-600'
            }`}>
              {getSenderIcon(msg.sender_type)}
            </div>
            <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${getSenderColor(msg.sender_type)}`}>
              <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{msg.message}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-400">{timeAgo(msg.created_at)}</span>
                {msg.ai_confidence != null && (
                  <span className={`text-xs ${msg.ai_confidence < 60 ? 'text-orange-400' : 'text-gray-400'}`}>
                    {msg.ai_confidence}% confidence
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Reply box */}
      {(conversation.status === 'assigned' || conversation.assigned_to === userId) && (
        <form onSubmit={handleSend} className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
          <input
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Type your reply..."
            className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-spirit-500 text-sm"
          />
          <button type="submit" disabled={sending || !newMessage.trim()}
            className="px-4 py-2.5 bg-spirit-600 hover:bg-spirit-700 disabled:bg-spirit-400 text-white rounded-xl transition-colors">
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  )
}
