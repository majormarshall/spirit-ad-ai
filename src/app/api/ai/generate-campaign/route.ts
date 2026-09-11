import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAIProvider } from '@/lib/ai'
import type { Tables } from '@/lib/supabase/types'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { platform, contentType, specificProduct } = await request.json()

    const { data: membership } = await supabase
      .from('business_members')
      .select('business_id, businesses(*)')
      .eq('user_id', user.id)
      .single() as { data: { business_id: string; businesses: Tables<'businesses'> | null } | null; error: unknown }

    if (!membership) return NextResponse.json({ error: 'No business found' }, { status: 404 })

    const businessId = membership.business_id
    const business = membership.businesses

    // Check AI permission
    const { data: aiPerms } = await supabase
      .from('ai_permissions')
      .select('permissions, autopilot_enabled')
      .eq('business_id', businessId)
      .single()

    const permissions = (aiPerms?.permissions as Record<string, Record<string, boolean>> | null) ?? {}
    if (permissions.marketing?.generate_adverts === false) {
      return NextResponse.json({ error: 'AI does not have permission to generate adverts' }, { status: 403 })
    }

    const { data: productsRaw } = await supabase
      .from('products')
      .select('id, name, description, price, unit, currency, product_inventory(availability_status)')
      .eq('business_id', businessId)
      .eq('is_active', true)

    const { data: previousCampaigns } = await supabase
      .from('campaigns')
      .select('title, content_type, caption, created_at')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(10)

    const mappedProducts = (productsRaw ?? []).map(p => {
      const inv = Array.isArray(p.product_inventory) ? p.product_inventory[0] : p.product_inventory
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        unit: p.unit,
        currency: p.currency,
        availability_status: (inv as { availability_status?: string } | null)?.availability_status ?? 'available',
      }
    })

    const ai = getAIProvider()
    const result = await ai.generateCampaign({
      businessName: business?.name ?? 'Our Business',
      businessDescription: business?.description ?? null,
      brandVoice: business?.brand_voice ?? null,
      targetAudience: business?.target_audience ?? null,
      products: mappedProducts,
      previousCampaigns: (previousCampaigns ?? []) as Array<{ title: string; content_type: string | null; caption: string | null; created_at: string }>,
      contentType,
      platform,
      specificProduct: specificProduct || undefined,
    })

    const admin = createAdminClient()
    await admin.from('audit_logs').insert({
      business_id: businessId,
      user_id: user.id,
      actor: 'ai',
      action: 'generate_campaign',
      description: `Generated ${contentType} campaign for ${platform}`,
      metadata: { contentType, platform, title: result.title } as Record<string, unknown>,
      result: 'success',
    })

    return NextResponse.json(result)
  } catch (err: unknown) {
    console.error('[generate-campaign]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
