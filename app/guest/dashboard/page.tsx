import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { EyeIcon, HomeIcon } from '@heroicons/react/24/outline'

export default async function GuestDashboard() {
  const supabase = await createClient()

  // Get all orders (public view - no authentication required)
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id, title, client_name, value_idr, status, 
      created_at,
      categories(name)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching orders:', error)
  }

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

  // Calculate stats
  const totalOrders = ordersList.length
  const approvedOrders = ordersList.filter(o => o.status === 'APPROVED').length
  const pendingOrders = ordersList.filter(o => o.status === 'PENDING_APPROVAL').length
  const rejectedOrders = ordersList.filter(o => o.status === 'REJECTED').length

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow border-b">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                🌐 Guest Mode - Dashboard Publik
              </h1>
              <p className="text-slate-600">
                Melihat semua perkembangan order tanpa login
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button asChild variant="outline">
                <Link href="/guest/gantt">
                  📊 Buat Gantt Chart
                </Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/login">
                  <HomeIcon className="h-4 w-4 mr-2" />
                  Login
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="text-2xl font-bold text-slate-900">{totalOrders}</div>
            <div className="text-sm text-slate-600">Total Order</div>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="text-2xl font-bold text-green-600">{approvedOrders}</div>
            <div className="text-sm text-slate-600">Approved</div>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="text-2xl font-bold text-yellow-600">{pendingOrders}</div>
            <div className="text-sm text-slate-600">Pending</div>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="text-2xl font-bold text-red-600">{rejectedOrders}</div>
            <div className="text-sm text-slate-600">Rejected</div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-slate-900">📋 Semua Perkembangan Order</h2>
            <p className="text-sm text-slate-600">Akses publik untuk melihat status order (read-only)</p>
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
                      Lihat
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
                            ID: {order.id.slice(0, 8)}
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
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/guest/order/${order.id}`}>
                            <EyeIcon className="h-4 w-4" />
                          </Link>
                        </Button>
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
              <p className="text-slate-500 mb-4">Data order akan muncul di sini</p>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="text-blue-400 text-xl mr-3">ℹ️</div>
            <div>
              <h4 className="text-blue-800 font-medium">Mode Guest</h4>
              <p className="text-blue-700 text-sm">
                Anda dapat melihat semua data order dan perkembangannya tanpa perlu login. 
                Untuk fitur lengkap seperti membuat order baru atau approval, silakan <Link href="/login" className="underline font-medium">login</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}