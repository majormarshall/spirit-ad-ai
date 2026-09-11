import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BusinessSettingsForm from '@/components/settings/BusinessSettingsForm'

export const metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: membership } = await supabase
    .from('business_members')
    .select('business_id, role, businesses(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (!membership) {
    // No business yet — show create form
    return <BusinessSettingsForm businessId={null} business={null} />
  }

  const business = membership.businesses as Record<string, unknown>
  return <BusinessSettingsForm businessId={membership.business_id} business={business} />
}
