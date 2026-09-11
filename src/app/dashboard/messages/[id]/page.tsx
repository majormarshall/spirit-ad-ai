import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ConversationView from '@/components/messages/ConversationView'

export default async function ConversationPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: membership } = await supabase
    .from('business_members')
    .select('business_id, role')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/dashboard')

  const { data: conversation } = await supabase
    .from('conversations')
    .select('*, customers(*)')
    .eq('id', params.id)
    .eq('business_id', membership.business_id)
    .single()

  if (!conversation) notFound()

  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', params.id)
    .order('created_at', { ascending: true })

  return (
    <ConversationView
      conversation={conversation}
      messages={messages ?? []}
      userId={user.id}
    />
  )
}
