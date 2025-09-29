import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CalendarIcon, ClockIcon } from '@heroicons/react/24/outline'

interface PublicSharePageProps {
  params: {
    shareCode: string
  }
}

export default async function PublicSharePage({ params }: PublicSharePageProps) {
  const supabase = await createClient()

  // Get order by share code
  const { data: shareData, error: shareError } = await supabase
    .from('public_order_shares')
    .select(`
      order_id,
      orders (
        id,
        title,
        description,
        status,
        eta,
        created_at,
        priority,
        customer_name,
        categories (name),
        process_templates (name, estimated_duration)
      )
    `)
    .eq('share_code', params.shareCode)
    .single()

  if (shareError || !shareData || !shareData.orders) {
    notFound()
  }

  const order = shareData.orders as any

  // Get order steps
  const { data: steps = [] } = await supabase
    .from('order_steps')
    .select('id, name, description, status, step_order, estimated_hours')
    .eq('order_id', order.id)
    .order('step_order')

  // Calculate progress
  const stepsList = steps || []
  const completedSteps = stepsList.filter(step => step.status === 'COMPLETED').length
  const progressPercentage = stepsList.length > 0 ? (completedSteps / stepsList.length) * 100 : 0

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

  const isOverdue = order.eta && new Date(order.eta) < new Date() && order.status !== 'COMPLETED'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Status Pesanan
            </h1>
            <p className="text-gray-600">
              Lacak progress pesanan Anda secara real-time
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Order Overview */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">{order.title}</CardTitle>
                {order.customer_name && (
                  <CardDescription className="mt-1">
                    Untuk: {order.customer_name}
                  </CardDescription>
                )}
              </div>
              <div className="flex flex-col items-end space-y-2">
                <Badge variant={getStatusColor(order.status)}>
                  {getStatusText(order.status)}
                </Badge>
                <Badge className={getPriorityColor(order.priority)}>
                  Prioritas {order.priority}
                </Badge>
                {isOverdue && (
                  <Badge variant="destructive">TERLAMBAT</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.description && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Deskripsi</h4>
                <p className="text-gray-600">{order.description}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Dibuat</p>
                  <p className="text-sm text-gray-600">
                    {new Date(order.created_at).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              
              {order.eta && (
                <div className="flex items-center space-x-3">
                  <ClockIcon className={`h-5 w-5 ${isOverdue ? 'text-red-500' : 'text-blue-500'}`} />
                  <div>
                    <p className="font-medium text-gray-900">
                      Estimasi Selesai {isOverdue && <span className="text-red-600">(Terlambat)</span>}
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-gray-900">Kategori</p>
                <Badge variant="outline">{order.categories?.name}</Badge>
              </div>
              <div>
                <p className="font-medium text-gray-900">Template Proses</p>
                <p className="text-sm text-gray-600">{order.process_templates?.name}</p>
              </div>
            </div>
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
          <CardContent className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
              <Progress value={progressPercentage} className="w-full h-3" />
              <div className="flex justify-between text-sm text-gray-600">
                <span>0%</span>
                <span className="font-medium">{Math.round(progressPercentage)}%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Steps List */}
            <div className="space-y-4">
              {stepsList.map((step: any, index: number) => (
                <div key={step.id} className="flex items-start space-x-4">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    step.status === 'COMPLETED' ? 'bg-green-100 text-green-800 border-2 border-green-300' :
                    step.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800 border-2 border-blue-300' :
                    'bg-gray-100 text-gray-800 border-2 border-gray-300'
                  }`}>
                    {step.status === 'COMPLETED' ? '✓' : index + 1}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`font-medium ${
                        step.status === 'COMPLETED' ? 'text-green-800' :
                        step.status === 'IN_PROGRESS' ? 'text-blue-800' :
                        'text-gray-800'
                      }`}>
                        {step.name}
                      </p>
                      <Badge variant={
                        step.status === 'COMPLETED' ? 'default' :
                        step.status === 'IN_PROGRESS' ? 'secondary' :
                        'outline'
                      }>
                        {step.status === 'COMPLETED' ? 'Selesai' :
                         step.status === 'IN_PROGRESS' ? 'Sedang Dikerjakan' :
                         'Menunggu'}
                      </Badge>
                    </div>
                    
                    {step.description && (
                      <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                    )}
                    
                    {step.estimated_hours && (
                      <p className="text-xs text-gray-500 mt-1">
                        Estimasi: {step.estimated_hours} jam
                      </p>
                    )}
                  </div>
                </div>
              ))}
              
              {stepsList.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>Belum ada tahapan proses yang didefinisikan</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Halaman ini akan update secara otomatis seiring progress pesanan</p>
          <p className="mt-1">Untuk informasi lebih lanjut, silakan hubungi tim kami</p>
        </div>
      </div>
    </div>
  )
}