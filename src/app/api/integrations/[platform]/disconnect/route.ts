import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(_: Request, { params }: { params: Promise<{ platform: string }> }) {
  const { platform } = await params
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.redirect(`${appUrl}/auth/login`)

    const { data: membership } = await supabase
      .from('business_members')
      .select('business_id')
      .eq('user_id', user.id)
      .single()

    if (!membership) return NextResponse.redirect(`${appUrl}/dashboard`)

    const admin = createAdminClient()
    await admin.from('integrations').upsert({
      business_id: membership.business_id,
      platform: platform as 'facebook' | 'instagram' | 'whatsapp',
      status: 'disconnected',
      access_token: null,
      refresh_token: null,
      page_id: null,
      page_name: null,
      account_id: null,
      account_name: null,
    }, { onConflict: 'business_id,platform' })

    await admin.from('audit_logs').insert({
      business_id: membership.business_id,
      user_id: user.id,
      actor: 'user',
      action: `disconnect_${platform}`,
      description: `Disconnected ${platform} integration`,
      result: 'success',
    })

    return NextResponse.redirect(`${appUrl}/dashboard/integrations?disconnected=${platform}`)
  } catch (err) {
    console.error('[disconnect]', err)
    return NextResponse.redirect(`${appUrl}/dashboard/integrations`)
  }
}
