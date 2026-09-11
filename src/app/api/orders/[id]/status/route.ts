import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.formData()
    const status = body.get('status') as string

    const validStatuses = ['confirmed', 'processing', 'ready', 'delivered', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: order } = await admin.from('orders').select('business_id').eq('id', id).single()
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data: membership } = await supabase
      .from('business_members')
      .select('role')
      .eq('business_id', order.business_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await admin.from('orders').update({ status }).eq('id', id)

    return NextResponse.redirect(`${appUrl}/dashboard/orders/${id}`)
  } catch (err) {
    console.error('[order-status]', err)
    return NextResponse.redirect(`${appUrl}/dashboard/orders`)
  }
}
