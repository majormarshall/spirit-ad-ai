import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PermissionsEditor from '@/components/permissions/PermissionsEditor'

export const metadata = { title: 'AI Permissions' }

export default async function PermissionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: membership } = await supabase
    .from('business_members')
    .select('business_id, role')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/dashboard')
  if (!['owner', 'admin'].includes(membership.role)) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Only owners and admins can manage AI permissions.</p>
      </div>
    )
  }

  let { data: aiPerms } = await supabase
    .from('ai_permissions')
    .select('*')
    .eq('business_id', membership.business_id)
    .single()

  // Auto-create default permissions if missing
  if (!aiPerms) {
    const { data: created } = await supabase
      .from('ai_permissions')
      .insert({ business_id: membership.business_id })
      .select('*')
      .single()
    aiPerms = created
  }

  return <PermissionsEditor initialPerms={aiPerms} businessId={membership.business_id} />
}
