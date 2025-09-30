import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import { ArrowLeftIcon, CalendarIcon, ClockIcon, UserIcon } from '@heroicons/react/24/outline'
import { notFound } from 'next/navigation'
import { getStatusLabel, getStatusColor } from '@/lib/constants/status'

interface OrderDetailPageProps {
  params: {
    id: string
  }
}

export default async function GuestOrderDetailPage({ params }: OrderDetailPageProps) {
  const supabase = await createClient()

  // Get order details
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      *,
      categories (name, description),
      profiles!orders_created_by_fkey (name, email)
    `)
    .eq('id', params.id)
    .single()

  if (orderError || !order) {
    notFound()
  }

  // Get order tasks if this is a task-based order
  const { data: tasks = [] } = await supabase
    .from('order_tasks')
    .select('*')
    .eq('order_id', params.id)
    .order('task_order')

  // Calculate progress
  const isTaskBased = order.is_task_based
  const tasksList = tasks || []
  
  let progressPercentage = 0
  if (isTaskBased && tasksList.length > 0) {
    const totalProgress = tasksList.reduce((sum, task) => sum + (task.progress || 0), 0)
    progressPercentage = totalProgress / tasksList.length
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800'
      case 'HIGH':
        return 'bg-orange-100 text-orange-800'
      case 'NORMAL':
        return 'bg-blue-100 text-blue-800'
      case 'LOW':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" asChild className="mr-4">
                <Link href="/guest/dashboard">
                  <ArrowLeftIcon className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{order.title}</h1>
                <div className="flex items-center space-x-4 mt-1">
                  <Badge variant={getStatusColor(order.status) as any}>
                    {getStatusLabel(order.status)}
                  </Badge>
                  {order.priority && (
                    <Badge className={getPriorityColor(order.priority)}>
                      {order.priority}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Timeline Button - only show if has tasks */}
              {isTaskBased && tasksList.length > 0 && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/guest/orders/${params.id}/gantt`}>
                    📊 Timeline
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Information */}
            <Card>
              <CardHeader>
                <CardTitle>Informasi Pesanan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.description && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Deskripsi</h4>
                    <p className="text-gray-600">{order.description}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {order.categories?.name && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Kategori</h4>
                      <Badge variant="outline">{order.categories.name}</Badge>
                    </div>
                  )}
                  {order.value_idr && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Nilai Order</h4>
                      <p className="text-lg font-semibold text-green-700">
                        {formatCurrency(order.value_idr)}
                      </p>
                    </div>
                  )}
                </div>

                {order.customer_name && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Nama Pelanggan</h4>
                    <p className="text-gray-600">{order.customer_name}</p>
                  </div>
                )}

                {order.customer_contact && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Kontak Pelanggan</h4>
                    <p className="text-gray-600">{order.customer_contact}</p>
                  </div>
                )}

                {order.notes && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Catatan</h4>
                    <p className="text-gray-600">{order.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Progress Tracking */}
            {isTaskBased && tasksList.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Progress Tasks</CardTitle>
                  <CardDescription>
                    {tasksList.length} tasks - Progress rata-rata {Math.round(progressPercentage)}%
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Progress value={progressPercentage} className="w-full" />
                  
                  <div className="space-y-3 mt-6">
                    {tasksList.map((task: any, index: number) => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{task.name}</p>
                            {task.pic && (
                              <p className="text-sm text-gray-600">PIC: {task.pic}</p>
                            )}
                            {task.duration_days && (
                              <p className="text-xs text-gray-500">Durasi: {task.duration_days} hari</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">{task.progress}%</p>
                            <Progress value={task.progress} className="w-20 h-2" />
                          </div>
                          {task.is_milestone && (
                            <Badge variant="secondary" className="text-xs">Milestone</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">Dibuat</p>
                    <p className="text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                {order.estimated_start_date && (
                  <div className="flex items-center space-x-3">
                    <CalendarIcon className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium text-gray-900">Mulai Estimasi</p>
                      <p className="text-sm text-gray-600">
                        {new Date(order.estimated_start_date).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {order.estimated_end_date && (
                  <div className="flex items-center space-x-3">
                    <ClockIcon className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium text-gray-900">Target Selesai</p>
                      <p className="text-sm text-gray-600">
                        {new Date(order.estimated_end_date).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}
                
                {isTaskBased && order.total_duration_days && (
                  <div className="flex items-center space-x-3">
                    <ClockIcon className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="font-medium text-gray-900">Total Durasi</p>
                      <p className="text-sm text-gray-600">
                        {order.total_duration_days} hari kerja
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Team */}
            <Card>
              <CardHeader>
                <CardTitle>Tim</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">Dibuat oleh</p>
                    <p className="text-sm text-gray-600">{order.profiles?.name || 'Unknown'}</p>
                  </div>
                </div>
                
                {isTaskBased && tasksList.length > 0 && (
                  <div className="mt-4">
                    <p className="font-medium text-gray-900 mb-2">PIC Tasks:</p>
                    <div className="flex flex-wrap gap-1">
                      {[...new Set(tasksList.map((t: any) => t.pic).filter(Boolean))].map((pic: string) => (
                        <Badge key={pic} variant="outline">{pic}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}