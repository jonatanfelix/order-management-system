import { createClient } from '@/utils/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { HomeIcon, Calendar, User, DollarSign, TrendingUp } from 'lucide-react'
import { getStatusLabel, getStatusColor } from '@/lib/constants/status'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function GuestDashboard() {
  const supabase = await createClient()
  
  // Fetch all orders (guest can see all for demo/public dashboard)
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id, title, customer_name, value_idr, status, 
      created_at, is_task_based, total_duration_days,
      estimated_start_date, estimated_end_date,
      categories(name),
      order_tasks(
        id, name, pic, duration_days, progress, is_milestone
      )
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  const ordersList = orders || []

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
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

        {/* Content */}
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">📋 Semua Perkembangan Order</h2>
            <p className="text-sm text-slate-600">Akses publik untuk melihat status order (read-only)</p>
          </div>
          
          {ordersList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ordersList.map((order: any) => (
                <Link key={order.id} href={`/guest/orders/${order.id}`}>
                  <Card 
                    className="hover:shadow-xl transition-all border-2 hover:border-blue-300 bg-white cursor-pointer"
                  >
                  <div className="p-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-slate-900 mb-1 line-clamp-2">
                          {order.title || `Order #${order.id.slice(0, 8)}`}
                        </h3>
                        <p className="text-xs text-slate-500">ID: {order.id.slice(0, 8)}</p>
                      </div>
                      <Badge variant={getStatusColor(order.status) as any}>
                        {getStatusLabel(order.status)}
                      </Badge>
                    </div>

                    {/* Task Badge */}
                    {order.is_task_based && (
                      <div className="bg-blue-50 px-3 py-1.5 rounded-full text-xs font-medium text-blue-700 inline-flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Task-Based Order
                      </div>
                    )}

                    {/* Info Grid */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-600">{order.customer_name || 'No client'}</span>
                      </div>
                      
                      {order.categories?.name && (
                        <div className="flex items-center gap-2 text-sm">
                          <div className="h-4 w-4 text-slate-400">📦</div>
                          <span className="text-slate-600">{order.categories.name}</span>
                        </div>
                      )}

                      {order.value_idr && (
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="font-semibold text-green-700">
                            {formatCurrency(order.value_idr)}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-600">
                          {new Date(order.created_at).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar (for task-based orders) */}
                    {order.order_tasks && order.order_tasks.length > 0 && (
                      <div className="pt-3 border-t">
                        <div className="flex justify-between text-xs text-slate-600 mb-2">
                          <span>{order.order_tasks.length} tasks</span>
                          <span>
                            {Math.round(
                              order.order_tasks.reduce((sum: number, t: any) => sum + t.progress, 0) / 
                              order.order_tasks.length
                            )}% complete
                          </span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all"
                            style={{ 
                              width: `${order.order_tasks.reduce((sum: number, t: any) => sum + t.progress, 0) / order.order_tasks.length}%` 
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <div className="text-center py-12">
                <div className="text-gray-500">
                  <p className="text-lg font-medium mb-2">Tidak ada order ditemukan</p>
                  <p className="mb-4">Belum ada order yang dibuat</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}