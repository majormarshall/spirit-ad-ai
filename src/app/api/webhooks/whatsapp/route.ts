import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAIProvider } from '@/lib/ai'

// Verify WhatsApp webhook
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 })
  }
  return new Response('Forbidden', { status: 403 })
}

// Receive WhatsApp messages
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const admin = createAdminClient()

    // Extract messages from WhatsApp payload
    const entry = body?.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value

    if (!value?.messages) {
      return NextResponse.json({ status: 'ok' }) // Not a message event
    }

    const phoneNumberId = value.metadata?.phone_number_id
    const message = value.messages[0]
    const from = message.from // Customer's WhatsApp number
    const messageText = message.text?.body ?? ''
    const waMessageId = message.id

    // Find integration by phone_number_id
    const { data: integration } = await admin
      .from('integrations')
      .select('business_id')
      .eq('platform', 'whatsapp')
      .eq('status', 'connected')
      .contains('metadata', { phone_number_id: phoneNumberId })
      .single()

    // Fallback: find any active whatsapp integration
    const businessId = integration?.business_id
    if (!businessId) {
      console.warn('[whatsapp-webhook] No matching business for phone_number_id:', phoneNumberId)
      return NextResponse.json({ status: 'ok' })
    }

    // Upsert customer
    const { data: customer } = await admin
      .from('customers')
      .upsert({
        business_id: businessId,
        platform: 'whatsapp',
        platform_user_id: from,
        phone: from,
        name: value.contacts?.[0]?.profile?.name ?? null,
      }, { onConflict: 'business_id,platform,platform_user_id' })
      .select('id')
      .single()

    // Find or create conversation
    let { data: conversation } = await admin
      .from('conversations')
      .select('id, ai_enabled, status')
      .eq('business_id', businessId)
      .eq('platform', 'whatsapp')
      .eq('customer_id', customer?.id)
      .in('status', ['open', 'assigned'])
      .single()

    if (!conversation) {
      const { data: newConv } = await admin
        .from('conversations')
        .insert({
          business_id: businessId,
          customer_id: customer?.id,
          platform: 'whatsapp',
          status: 'open',
          ai_enabled: true,
          last_message: messageText,
          last_message_at: new Date().toISOString(),
        })
        .select('id, ai_enabled, status')
        .single()
      conversation = newConv
    } else {
      await admin.from('conversations').update({
        last_message: messageText,
        last_message_at: new Date().toISOString(),
      }).eq('id', conversation.id)
    }

    if (!conversation) {
      return NextResponse.json({ status: 'ok' })
    }

    // Save incoming message
    await admin.from('messages').insert({
      conversation_id: conversation.id,
      sender_type: 'customer',
      sender_id: from,
      message: messageText,
      message_type: 'text',
      meta_message_id: waMessageId,
    })

    // Check AI permissions
    const { data: aiPerms } = await admin
      .from('ai_permissions')
      .select('permissions, autopilot_enabled, confidence_threshold')
      .eq('business_id', businessId)
      .single()

    const permissions = (aiPerms?.permissions as Record<string, Record<string, boolean>>) ?? {}
    const canAnswer = permissions.whatsapp?.answer_faqs !== false && conversation.ai_enabled

    if (!canAnswer || conversation.status === 'needs_human') {
      // Notify admin
      await admin.from('notifications').insert({
        business_id: businessId,
        type: 'new_message',
        title: 'New WhatsApp message',
        message: `Customer: ${messageText}`,
        link: `/dashboard/messages/${conversation.id}`,
      })
      return NextResponse.json({ status: 'ok' })
    }

    // Get recent message history
    const { data: msgHistory } = await admin
      .from('messages')
      .select('sender_type, message')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: false })
      .limit(10)

    const historyForAI = (msgHistory ?? []).reverse().map(m => ({
      role: m.sender_type === 'customer' ? 'user' as const : 'assistant' as const,
      content: m.message ?? '',
    }))

    // Get business context
    const [
      { data: business },
      { data: products },
      { data: faqs },
      { data: docs },
    ] = await Promise.all([
      admin.from('businesses').select('*').eq('id', businessId).single(),
      admin.from('products').select('*, product_inventory(availability_status)').eq('business_id', businessId).eq('is_active', true),
      admin.from('faqs').select('question, answer, category').eq('business_id', businessId).eq('is_active', true),
      admin.from('knowledge_documents').select('title, content').eq('business_id', businessId).limit(5),
    ])

    const threshold = aiPerms?.confidence_threshold ?? 60

    // Generate AI response
    const ai = getAIProvider()
    const aiResult = await ai.chat({
      messages: historyForAI,
      userMessage: messageText,
      businessContext: {
        businessName: business?.name ?? '',
        businessDescription: business?.description ?? null,
        phone: business?.phone ?? null,
        phone2: business?.phone2 ?? null,
        website: business?.website ?? null,
        address: business?.address ?? null,
        city: business?.city ?? null,
        state: business?.state ?? null,
        openingHours: (business?.opening_hours as Record<string, string>) ?? {},
        currency: business?.currency ?? 'NGN',
        currencySymbol: business?.currency_symbol ?? '₦',
        products: (products ?? []).map(p => {
          const inv = Array.isArray(p.product_inventory) ? p.product_inventory[0] : p.product_inventory
          return {
            name: p.name,
            price: p.price,
            unit: p.unit,
            currency: p.currency,
            currencySymbol: '₦',
            availability_status: inv?.availability_status ?? 'available',
            description: p.description,
          }
        }),
        faqs: (faqs ?? []).map(f => ({ question: f.question, answer: f.answer, category: f.category })),
        knowledgeDocs: (docs ?? []).map(d => ({ title: d.title, content: d.content })),
      },
    })

    // Handle human escalation
    if (aiResult.requiresHuman || aiResult.confidence < threshold) {
      await admin.from('conversations').update({ status: 'needs_human' }).eq('id', conversation.id)
      await admin.from('notifications').insert({
        business_id: businessId,
        type: 'human_needed',
        title: '🚨 Customer needs human support',
        message: `"${messageText}" — AI Confidence: ${aiResult.confidence}%`,
        link: `/dashboard/messages/${conversation.id}`,
      })

      const handoffMsg = "I'll connect you with a member of our team who can assist you. Please hold on. 🙏"
      await sendWhatsAppMessage(from, handoffMsg)
      await admin.from('messages').insert({
        conversation_id: conversation.id,
        sender_type: 'ai',
        message: handoffMsg,
        message_type: 'text',
        ai_generated: true,
        ai_confidence: aiResult.confidence,
      })
      return NextResponse.json({ status: 'ok' })
    }

    // Send AI response
    await sendWhatsAppMessage(from, aiResult.message)
    await admin.from('messages').insert({
      conversation_id: conversation.id,
      sender_type: 'ai',
      message: aiResult.message,
      message_type: 'text',
      ai_generated: true,
      ai_confidence: aiResult.confidence,
    })

    // Detect leads
    if (aiResult.isLead && permissions.whatsapp?.detect_leads !== false) {
      const detectedProductName = aiResult.detectedProducts?.[0]
      let productId: string | null = null
      if (detectedProductName) {
        const { data: prod } = await admin
          .from('products')
          .select('id')
          .eq('business_id', businessId)
          .ilike('name', `%${detectedProductName}%`)
          .single()
        productId = prod?.id ?? null
      }

      await admin.from('leads').insert({
        business_id: businessId,
        customer_id: customer?.id,
        conversation_id: conversation.id,
        product_id: productId,
        quantity: aiResult.detectedQuantity ?? null,
        lead_type: aiResult.leadType ?? 'standard',
        lead_score: aiResult.leadScore ?? 50,
        status: 'new',
        notes: `Detected from WhatsApp: "${messageText}"`,
      })

      await admin.from('notifications').insert({
        business_id: businessId,
        type: 'new_lead',
        title: '🎯 New lead detected',
        message: `${aiResult.leadType?.toUpperCase()} lead — ${detectedProductName ?? 'Unknown product'}`,
        link: `/dashboard/leads`,
      })
    }

    return NextResponse.json({ status: 'ok' })
  } catch (err) {
    console.error('[whatsapp-webhook]', err)
    return NextResponse.json({ status: 'ok' }) // Always 200 to WhatsApp
  }
}

async function sendWhatsAppMessage(to: string, text: string) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

  if (!accessToken || !phoneNumberId) {
    console.warn('[whatsapp] Credentials not configured — skipping send')
    return
  }

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
        text: { body: text },
      }),
    }
  )

  if (!res.ok) {
    const err = await res.json()
    console.error('[whatsapp-send]', err)
  }
}
