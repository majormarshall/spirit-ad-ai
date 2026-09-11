import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Step 1: Redirect user to Facebook OAuth
export async function GET() {
  const appId = process.env.META_APP_ID
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const scopes = process.env.META_SCOPES ?? 'pages_show_list,pages_read_engagement,pages_manage_posts'

  if (!appId) {
    return NextResponse.json({ error: 'META_APP_ID not configured' }, { status: 500 })
  }

  const redirectUri = `${appUrl}/api/integrations/facebook/callback`
  const state = crypto.randomUUID()

  const oauthUrl = new URL('https://www.facebook.com/v19.0/dialog/oauth')
  oauthUrl.searchParams.set('client_id', appId)
  oauthUrl.searchParams.set('redirect_uri', redirectUri)
  oauthUrl.searchParams.set('scope', scopes)
  oauthUrl.searchParams.set('state', state)
  oauthUrl.searchParams.set('response_type', 'code')

  return NextResponse.redirect(oauthUrl.toString())
}
