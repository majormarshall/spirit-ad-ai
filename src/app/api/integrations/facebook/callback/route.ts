import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Step 2: Handle Facebook OAuth callback — exchange code for token
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=facebook_auth_failed`)
  }

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

    // Exchange code for token
    const tokenRes = await fetch('https://graph.facebook.com/v19.0/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.META_APP_ID!,
        client_secret: process.env.META_APP_SECRET!,
        redirect_uri: `${appUrl}/api/integrations/facebook/callback`,
        code,
      }),
    })

    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) throw new Error('No access token returned')

    // Get long-lived token
    const llRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.META_APP_ID}&client_secret=${process.env.META_APP_SECRET}&fb_exchange_token=${tokenData.access_token}`
    )
    const llData = await llRes.json()
    const longLivedToken = llData.access_token ?? tokenData.access_token

    // Get user's pages
    const pagesRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${longLivedToken}`
    )
    const pagesData = await pagesRes.json()
    const firstPage = pagesData.data?.[0]

    const admin = createAdminClient()
    await admin.from('integrations').upsert({
      business_id: membership.business_id,
      platform: 'facebook',
      status: 'connected',
      access_token: longLivedToken,
      page_id: firstPage?.id ?? null,
      page_name: firstPage?.name ?? null,
      account_name: firstPage?.name ?? null,
      metadata: { pages: pagesData.data ?? [] },
      last_synced_at: new Date().toISOString(),
    }, { onConflict: 'business_id,platform' })

    await admin.from('audit_logs').insert({
      business_id: membership.business_id,
      user_id: user.id,
      actor: 'user',
      action: 'connect_facebook',
      description: `Connected Facebook Page: ${firstPage?.name ?? 'Unknown'}`,
      result: 'success',
    })

    return NextResponse.redirect(`${appUrl}/dashboard/integrations?success=facebook`)
  } catch (err) {
    console.error('[facebook-callback]', err)
    return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=facebook_callback_failed`)
  }
}
