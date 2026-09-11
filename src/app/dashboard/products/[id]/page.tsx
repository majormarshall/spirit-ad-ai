import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ProductForm from '@/components/products/ProductForm'

export const metadata = { title: 'Edit Product' }

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: membership } = await supabase
    .from('business_members')
    .select('business_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/dashboard')

  const { data: product } = await supabase
    .from('products')
    .select('*, product_inventory(*)')
    .eq('id', params.id)
    .eq('business_id', membership.business_id)
    .single()

  if (!product) notFound()

  return <ProductForm businessId={membership.business_id} product={product} />
}
