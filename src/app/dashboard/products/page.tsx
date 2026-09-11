import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { Plus, Package } from 'lucide-react'

export const metadata = { title: 'Products' }

export default async function ProductsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: membership } = await supabase
    .from('business_members')
    .select('business_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/dashboard')

  const { data: products } = await supabase
    .from('products')
    .select('*, product_inventory(*)')
    .eq('business_id', membership.business_id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{products?.length ?? 0} products</p>
        </div>
        <Link
          href="/dashboard/products/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-spirit-600 hover:bg-spirit-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </Link>
      </div>

      {(!products || products.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <Package className="w-12 h-12 text-gray-300" />
          <div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">No products yet</p>
            <p className="text-gray-400 text-sm mt-1">Add your first product to get started</p>
          </div>
          <Link href="/dashboard/products/new" className="px-4 py-2 bg-spirit-600 hover:bg-spirit-700 text-white text-sm font-semibold rounded-lg transition-colors">
            Add Product
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Stock</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Added</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {products.map((product) => {
                  const inventory = Array.isArray(product.product_inventory)
                    ? product.product_inventory[0]
                    : product.product_inventory
                  return (
                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-5 py-3">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                          {product.description && (
                            <p className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{product.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-400">{product.category ?? '—'}</td>
                      <td className="px-5 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(product.price)} / {product.unit}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-400">{inventory?.quantity ?? 0}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(inventory?.availability_status ?? 'available')}`}>
                          {(inventory?.availability_status ?? 'available').replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-400">{formatDate(product.created_at)}</td>
                      <td className="px-5 py-3">
                        <Link href={`/dashboard/products/${product.id}`} className="text-spirit-600 hover:text-spirit-500 text-sm font-medium">
                          Edit
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
