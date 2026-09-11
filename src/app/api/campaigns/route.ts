import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { title, headline, caption, callToAction, hashtags, imagePrompt, contentType, selectedProductId, platform, status } = body

    const { data: membership } = await supabase
      .from('business_members')
      .select('business_id')
      .eq('user_id', user.id)
      .single()

    if (!membership) return NextResponse.json({ error: 'No business found' }, { status: 404 })

    const businessId = membership.business_id

    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        business_id: businessId,
        title: title ?? headline ?? 'AI Campaign',
        headline: headline ?? null,
        caption: caption ?? null,
        call_to_action: callToAction ?? null,
        hashtags: hashtags ?? null,
        image_prompt: imagePrompt ?? null,
        content_type: contentType ?? null,
        product_id: selectedProductId ?? null,
        platform: platform ?? 'all',
        status: status ?? 'draft',
        ai_generated: true,
      })
      .select('id')
      .single()

    if (error) throw error

    return NextResponse.json({ id: data?.id, success: true })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
