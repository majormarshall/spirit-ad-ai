import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: campaignId } = await params
  return handleAction(campaignId, 'approve')
}

async function handleAction(campaignId: string, action: 'approve' | 'reject') {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.redirect(new URL('/auth/login', process.env.NEXT_PUBLIC_APP_URL!))

    const admin = createAdminClient()
    const { data: campaign } = await admin
      .from('campaigns')
      .select('business_id, status')
      .eq('id', campaignId)
      .single()

    if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Verify member
    const { data: membership } = await supabase
      .from('business_members')
      .select('role')
      .eq('business_id', campaign.business_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await admin.from('campaigns').update({
      status: action === 'approve' ? 'approved' : 'cancelled',
      approved_by: action === 'approve' ? user.id : null,
      approved_at: action === 'approve' ? new Date().toISOString() : null,
    }).eq('id', campaignId)

    await admin.from('audit_logs').insert({
      business_id: campaign.business_id,
      user_id: user.id,
      actor: 'user',
      action: action === 'approve' ? 'approve_campaign' : 'reject_campaign',
      description: `Campaign ${campaignId} ${action}d`,
      result: 'success',
    })

    return NextResponse.redirect(new URL('/dashboard/campaigns', process.env.NEXT_PUBLIC_APP_URL!))
  } catch (err) {
    console.error('[campaign-approve]', err)
    return NextResponse.redirect(new URL('/dashboard/campaigns', process.env.NEXT_PUBLIC_APP_URL!))
  }
}
