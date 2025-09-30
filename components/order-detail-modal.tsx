'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X, Calendar, User, Package, DollarSign, FileText, CheckCircle2, Clock, Target } from 'lucide-react'

interface OrderDetailModalProps {
  order: any
  isOpen: boolean
  onClose: () => void
}

export function OrderDetailModal({ order, isOpen, onClose }: OrderDetailModalProps) {
  if (!order) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      'DRAFT': { label: 'Draft', variant: 'secondary' },
      'PENDING_APPROVAL': { label: 'Pending', variant: 'outline' },
      'APPROVED': { label: 'Approved', variant: 'default' },
      'REJECTED': { label: 'Rejected', variant: 'destructive' },
    }
    const config = statusConfig[status] || { label: status, variant: 'secondary' }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-slate-900 mb-2">
                {order.title || `Order #${order.id?.slice(0, 8)}`}
              </DialogTitle>
              <div className="flex items-center gap-2">
                {getStatusBadge(order.status)}
                <span className="text-sm text-slate-500">
                  ID: {order.id?.slice(0, 8)}
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Main Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <User className="h-4 w-4" />
                <span className="font-medium">Client</span>
              </div>
              <p className="text-slate-900 font-semibold pl-6">
                {order.client_name || '-'}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Package className="h-4 w-4" />
                <span className="font-medium">Kategori</span>
              </div>
              <p className="text-slate-900 font-semibold pl-6">
                {order.categories?.name || '-'}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <DollarSign className="h-4 w-4" />
                <span className="font-medium">Nilai Order</span>
              </div>
              <p className="text-slate-900 font-bold text-lg pl-6">
                {order.value_idr ? formatCurrency(order.value_idr) : '-'}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Tanggal Dibuat</span>
              </div>
              <p className="text-slate-900 font-semibold pl-6">
                {order.created_at ? new Date(order.created_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                }) : '-'}
              </p>
            </div>
          </div>

          {/* Task-Based Info */}
          {order.is_task_based && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Order Berbasis Task</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-blue-700">Total Durasi</p>
                  <p className="text-lg font-bold text-blue-900">
                    {order.total_duration_days || 0} hari
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-700">Mulai (Est.)</p>
                  <p className="text-sm font-semibold text-blue-900">
                    {order.estimated_start_date 
                      ? new Date(order.estimated_start_date).toLocaleDateString('id-ID')
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-700">Selesai (Est.)</p>
                  <p className="text-sm font-semibold text-blue-900">
                    {order.estimated_end_date 
                      ? new Date(order.estimated_end_date).toLocaleDateString('id-ID')
                      : '-'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tasks Table (if available) */}
          {order.order_tasks && order.order_tasks.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Daftar Task ({order.order_tasks.length})
              </h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-slate-600">Task</th>
                      <th className="px-4 py-2 text-left font-medium text-slate-600">PIC</th>
                      <th className="px-4 py-2 text-left font-medium text-slate-600">Durasi</th>
                      <th className="px-4 py-2 text-left font-medium text-slate-600">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {order.order_tasks.map((task: any, index: number) => (
                      <tr key={task.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {task.is_milestone && (
                              <span className="text-yellow-500">🎯</span>
                            )}
                            <span className="font-medium text-slate-900">{task.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {task.pic || '-'}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {task.duration_days} hari
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-500 transition-all"
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-slate-600 w-10">
                              {task.progress}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-600" />
                Catatan
              </h3>
              <p className="text-slate-700 bg-slate-50 rounded-lg p-3 border">
                {order.notes}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}