import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import { ArrowLeftIcon, CalendarIcon, ClockIcon, UserIcon, ShareIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { submitForApproval, approveRejectOrder } from '@/lib/actions/orders'

interface OrderDetailPageProps {
  params: {
    id: string
  }
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
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

  // Get order details
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      *,
      categories (name, description),
      profiles!orders_input_staff_id_fkey (full_name, email),
      profiles!orders_approval_staff_id_fkey (full_name, email),
      process_templates (name, estimated_duration)
    `)
    .eq('id', params.id)
    .single()

  if (orderError || !order) {
    notFound()
  }

  // Check if user has permission to view this order
  if (profile.role === 'INPUT_STAFF' && order.input_staff_id !== user.id) {
    redirect('/orders')
  }

  // Get order steps
  const { data: steps = [] } = await supabase
    .from('order_steps')
    .select('*')
    .eq('order_id', params.id)
    .order('step_order')

  // Get order adjustments
  const { data: adjustments = [] } = await supabase
    .from('order_adjustments')
    .select(`
      *,
      profiles (full_name)
    `)
    .eq('order_id', params.id)
    .order('created_at', { ascending: false })

  // Get public share if exists
  const { data: publicShare } = await supabase
    .from('public_order_shares')
    .select('share_code')
    .eq('order_id', params.id)
    .single()

  // Calculate progress
  const stepsList = steps || []
  const completedSteps = stepsList.filter(step => step.status === 'COMPLETED').length
  const progressPercentage = stepsList.length > 0 ? (completedSteps / stepsList.length) * 100 : 0

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'default'
      case 'APPROVED':
        return 'secondary'
      case 'IN_PROGRESS':
        return 'outline'
      case 'PENDING':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Menunggu Persetujuan'
      case 'APPROVED':
        return 'Disetujui'
      case 'IN_PROGRESS':
        return 'Dalam Proses'
      case 'COMPLETED':
        return 'Selesai'
      default:
        return status
    }
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

  const canApprove = (profile.role === 'ADMIN' || profile.role === 'APPROVAL_STAFF') && order.status === 'PENDING'
  const canSubmitForApproval = profile.role === 'INPUT_STAFF' && order.input_staff_id === user.id && order.status === 'DRAFT'
  const isOverdue = order.eta && new Date(order.eta) < new Date() && order.status !== 'COMPLETED'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" asChild className="mr-4">
                <Link href="/orders">
                  <ArrowLeftIcon className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{order.title}</h1>
                <div className="flex items-center space-x-4 mt-1">
                  <Badge variant={getStatusColor(order.status)}>
                    {getStatusText(order.status)}
                  </Badge>
                  <Badge className={getPriorityColor(order.priority)}>
                    {order.priority}
                  </Badge>
                  {isOverdue && (
                    <Badge variant="destructive">TERLAMBAT</Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Gantt Chart Button */}
              <Button variant="outline" size="sm" asChild>
                <Link href={`/orders/${params.id}/gantt`}>
                  📊 Timeline
                </Link>
              </Button>
              
              {publicShare && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/share/${publicShare.share_code}`} target="_blank">
                    <ShareIcon className="mr-2 h-4 w-4" />
                    Link Publik
                  </Link>
                </Button>
              )}
              
              {canSubmitForApproval && (
                <form action={async () => {
                  'use server'
                  await submitForApproval(order.id)
                }}>
                  <Button type="submit">
                    Kirim untuk Persetujuan
                  </Button>
                </form>
              )}
              
              {canApprove && (
                <div className="flex space-x-2">
                  <form action={async () => {
                    'use server'
                    await approveRejectOrder(order.id, 'APPROVED')
                  }}>
                    <Button type="submit" size="sm">
                      <CheckCircleIcon className="mr-2 h-4 w-4" />
                      Setujui
                    </Button>
                  </form>
                  <form action={async () => {
                    'use server'
                    await approveRejectOrder(order.id, 'REJECTED')
                  }}>
                    <Button type="submit" variant="destructive" size="sm">
                      <XCircleIcon className="mr-2 h-4 w-4" />
                      Tolak
                    </Button>
                  </form>
                </div>
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
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Kategori</h4>
                    <Badge variant="outline">{order.categories?.name}</Badge>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Template</h4>
                    <p className="text-gray-600">{order.process_templates?.name}</p>
                  </div>
                </div>

                {(order.customer_name || order.customer_contact) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <Card>
              <CardHeader>
                <CardTitle>Progress Pengerjaan</CardTitle>
                <CardDescription>
                {completedSteps} dari {stepsList.length} tahap selesai ({Math.round(progressPercentage)}%)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={progressPercentage} className="w-full" />
                
                <div className="space-y-3">
                  {stepsList.map((step: any, index: number) => (
                    <div key={step.id} className="flex items-center space-x-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        step.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{step.name}</p>
                        {step.description && (
                          <p className="text-sm text-gray-600">{step.description}</p>
                        )}
                        {step.estimated_hours && (
                          <p className="text-xs text-gray-500">Estimasi: {step.estimated_hours} jam</p>
                        )}
                      </div>
                      <Badge variant={
                        step.status === 'COMPLETED' ? 'default' :
                        step.status === 'IN_PROGRESS' ? 'secondary' :
                        'outline'
                      }>
                        {step.status === 'COMPLETED' ? 'Selesai' :
                         step.status === 'IN_PROGRESS' ? 'Proses' :
                         'Menunggu'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Adjustments History */}
            {(adjustments && adjustments.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle>Riwayat Penyesuaian</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {adjustments.map((adjustment: any) => (
                      <div key={adjustment.id} className="border-l-4 border-blue-200 pl-4 py-2">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900">{adjustment.reason}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(adjustment.created_at).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                        {adjustment.description && (
                          <p className="text-sm text-gray-600 mt-1">{adjustment.description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          oleh {adjustment.profiles?.full_name}
                        </p>
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

                {order.eta && (
                  <div className="flex items-center space-x-3">
                    <ClockIcon className={`h-5 w-5 ${isOverdue ? 'text-red-500' : 'text-blue-500'}`} />
                    <div>
                      <p className="font-medium text-gray-900">
                        ETA {isOverdue && <span className="text-red-600">(Terlambat)</span>}
                      </p>
                      <p className={`text-sm ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                        {new Date(order.eta).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {order.approved_at && (
                  <div className="flex items-center space-x-3">
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium text-gray-900">Disetujui</p>
                      <p className="text-sm text-gray-600">
                        {new Date(order.approved_at).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
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
                    <p className="font-medium text-gray-900">Input Staff</p>
                    <p className="text-sm text-gray-600">{order.profiles?.full_name}</p>
                  </div>
                </div>

                {order.profiles && (
                  <div className="flex items-center space-x-3">
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium text-gray-900">Approval Staff</p>
                      <p className="text-sm text-gray-600">{order.profiles?.full_name}</p>
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