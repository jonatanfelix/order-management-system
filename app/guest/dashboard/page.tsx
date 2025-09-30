'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { EyeIcon, HomeIcon, Calendar, User, DollarSign, TrendingUp, LayoutGrid, List } from 'lucide-react'
import { OrderDetailModal } from '@/components/order-detail-modal'

export default function GuestDashboard() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  useEffect(() => {
    async function fetchOrders() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, title, client_name, value_idr, status, 
          created_at, is_task_based, total_duration_days,
          estimated_start_date, estimated_end_date,
          categories(name),
          order_tasks(
            id, name, pic, duration_days, progress, is_milestone
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching orders:', error)
      }
      setOrders(data || [])
      setLoading(false)
    }
    fetchOrders()
  }, [])

  const ordersList = orders

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
              <div className="flex items-center gap-2 bg-white border rounded-lg p-1">
                <Button 
                  variant={viewMode === 'cards' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                  className="gap-1"
                >
                  <LayoutGrid className="h-4 w-4" />
                  Cards
                </Button>
                <Button 
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="gap-1"
                >
                  <List className="h-4 w-4" />
                  Table
                </Button>
              </div>
              <Button asChild variant="outline">
                <Link href="/guest/gantt">
                  📊 Gantt Chart
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

        {/* Content */}
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">📋 Semua Perkembangan Order</h2>
            <p className="text-sm text-slate-600">Akses publik untuk melihat status order (read-only)</p>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-slate-600 mt-4">Memuat data...</p>
            </div>
          ) : ordersList.length > 0 ? (
            <>
              {viewMode === 'cards' ? (
                /* Card View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {ordersList.map((order: any) => (
                    <Card 
                      key={order.id}
                      className="hover:shadow-xl transition-all cursor-pointer border-2 hover:border-blue-300 bg-white"
                      onClick={() => {
                        setSelectedOrder(order)
                        setIsDetailOpen(true)
                      }}
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
                          {getStatusBadge(order.status)}
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
                            <span className="text-slate-600">{order.client_name || 'No client'}</span>
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

                        {/* View Button */}
                        <Button 
                          variant="outline" 
                          className="w-full gap-2"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedOrder(order)
                            setIsDetailOpen(true)
                          }}
                        >
                          <EyeIcon className="h-4 w-4" />
                          Lihat Detail
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                /* Table View */
                <div className="bg-white rounded-lg border shadow">
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
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => {
                                  setSelectedOrder(order)
                                  setIsDetailOpen(true)
                                }}
                              >
                                <EyeIcon className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border">
              <div className="text-slate-400 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Belum ada order</h3>
              <p className="text-slate-500 mb-4">Data order akan muncul di sini</p>
            </div>
          )}
        </div>

        {/* Order Detail Modal */}
        <OrderDetailModal
          order={selectedOrder}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
        />

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