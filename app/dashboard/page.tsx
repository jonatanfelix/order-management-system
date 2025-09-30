import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { PlusIcon, EyeIcon } from '@heroicons/react/24/outline'

export default async function Dashboard() {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  // Get orders with more details
  let ordersQuery = supabase
    .from('orders')
    .select(`
      id, title, client_name, value_idr, status, 
      created_at, eta_at,
      categories(name),
      templates(name, code)
    `)
    .order('created_at', { ascending: false })

  // Input staff can only see their own orders
  if (profile.role === 'INPUTER') {
    ordersQuery = ordersQuery.eq('created_by', user.id)
  }

  const { data: orders } = await ordersQuery
  const ordersList = orders || []

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT': return <Badge variant="secondary">Draft</Badge>
      case 'PENDING_APPROVAL': return <Badge variant="outline">Pending</Badge>
      case 'APPROVED': return <Badge variant="default">Approved</Badge>
      case 'REJECTED': return <Badge variant="destructive">Rejected</Badge>
      default: return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow border-b">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                📊 Dashboard - Order Management
              </h1>
              <p className="text-slate-600">
                Halo {profile.name} ({profile.role})
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button asChild>
                <Link href="/orders/new">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Buat Order
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/guest/dashboard">
                  🌐 Guest Mode
                </Link>
              </Button>
              <form action="/auth/signout" method="post">
                <Button variant="ghost" type="submit">
                  Keluar
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg border shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-slate-900">Daftar Order</h2>
            <p className="text-sm text-slate-600">Total: {ordersList.length} order</p>
          </div>
          
          {ordersList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Kategori
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Nilai
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {ordersList.map((order: any, index: number) => (
                    <tr key={order.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            {order.title || `Order #${order.id.slice(0, 8)}`}
                          </div>
                          <div className="text-xs text-slate-500">
                            {order.templates?.code || 'No Template'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {order.client_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {order.categories?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {order.value_idr ? formatCurrency(order.value_idr) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {new Date(order.created_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`/orders/${order.id}`}>
                              <EyeIcon className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/orders/${order.id}/gantt`}>
                              📊
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-slate-400 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Belum ada order</h3>
              <p className="text-slate-500 mb-4">Mulai dengan membuat order pertama Anda</p>
              <Button asChild>
                <Link href="/orders/new">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Buat Order Pertama
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}