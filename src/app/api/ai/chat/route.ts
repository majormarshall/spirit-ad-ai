import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAIProvider } from '@/lib/ai'
import type { Tables } from '@/lib/supabase/types'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { message, messages: history } = await request.json()
    if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 })

    const { data: membership } = await supabase
      .from('business_members')
      .select('business_id, businesses(*)')
      .eq('user_id', user.id)
      .single() as { data: { business_id: string; businesses: Tables<'businesses'> | null } | null; error: unknown }

    if (!membership) return NextResponse.json({ error: 'No business found' }, { status: 404 })

    const businessId = membership.business_id
    const business = membership.businesses

    const { data: productsRaw } = await supabase
      .from('products')
      .select('id, name, description, price, unit, currency, product_inventory(availability_status)')
      .eq('business_id', businessId)
      .eq('is_active', true)

    const { data: faqsRaw } = await supabase
      .from('faqs')
      .select('question, answer, category')
      .eq('business_id', businessId)
      .eq('is_active', true)

    const { data: docsRaw } = await supabase
      .from('knowledge_documents')
      .select('title, content')
      .eq('business_id', businessId)
      .limit(5)

    const openingHours = (business?.opening_hours as Record<string, string>) ?? {}

    const ai = getAIProvider()
    const result = await ai.chat({
      messages: (history ?? []) as Array<{ role: 'user' | 'assistant'; content: string }>,
      userMessage: message,
      businessContext: {
        businessName: business?.name ?? '',
        businessDescription: business?.description ?? null,
        phone: business?.phone ?? null,
        phone2: business?.phone2 ?? null,
        website: business?.website ?? null,
        address: business?.address ?? null,
        city: business?.city ?? null,
        state: business?.state ?? null,
        openingHours,
        currencySymbol: business?.currency_symbol ?? '₦',
        products: (productsRaw ?? []).map(p => {
          const inv = Array.isArray(p.product_inventory) ? p.product_inventory[0] : p.product_inventory
          return {
            name: p.name,
            price: p.price,
            unit: p.unit,
            currencySymbol: '₦',
            availability_status: (inv as { availability_status?: string } | null)?.availability_status ?? 'available',
            description: p.description,
          }
        }),
        faqs: (faqsRaw ?? []).map(f => ({
          question: f.question,
          answer: f.answer,
          category: f.category,
        })),
        knowledgeDocs: (docsRaw ?? []).map(d => ({
          title: d.title,
          content: d.content,
        })),
      },
    })

    return NextResponse.json(result)
  } catch (err: unknown) {
    console.error('[ai-chat]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
