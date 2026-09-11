import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Send a human reply via WhatsApp
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { conversationId, message, to } = await request.json()
    if (!conversationId || !message) {
      return NextResponse.json({ error: 'conversationId and message required' }, { status: 400 })
    }

    // Verify member has access to this conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .select('business_id, platform')
      .eq('id', conversationId)
      .single()

    if (!conversation) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })

    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

    if (accessToken && phoneNumberId && to && conversation.platform === 'whatsapp') {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to,
            type: 'text',
            text: { body: message },
          }),
        }
      )
      if (!res.ok) {
        const err = await res.json()
        console.error('[send-message]', err)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
