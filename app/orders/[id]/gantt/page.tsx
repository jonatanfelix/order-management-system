import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeftIcon, PrinterIcon } from '@heroicons/react/24/outline'
import { GoogleCalendarTimeline } from '@/components/google-calendar-timeline'
import { TaskStep } from '@/types/task'

export default async function OrderGanttPage({ 
  params 
}: { 
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/login')
  }

  // Get order with tasks
  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      categories(name, description),
      templates(name, code)
    `)
    .eq('id', id)
    .single()

  if (!order) {
    redirect('/orders')
  }

  // Get order tasks for timeline
  const { data: tasks = [] } = await supabase
    .from('order_tasks')
    .select('*')
    .eq('order_id', id)
    .order('task_order')

  // Convert to TaskStep format for GoogleCalendarTimeline
  const taskSteps: TaskStep[] = (tasks || []).map((task: any) => ({
    id: task.id,
    name: task.name,
    startDate: new Date(task.start_date),
    endDate: new Date(task.end_date),
    duration: task.duration_days,
    pic: task.pic || 'TBD',
    quantity: task.quantity,
    unit: task.unit,
    progress: task.progress || 0,
    dependsOn: task.depends_on_tasks || [],
    isMilestone: task.is_milestone || false,
    notes: task.notes
  }))


  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow border-b">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" asChild className="mr-4">
                <Link href={`/orders/${id}`}>
                  <ArrowLeftIcon className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  📊 {order.title}
                </h1>
                <p className="text-sm text-slate-600">
                  Gantt Chart - Timeline Pengerjaan
                </p>
              </div>
            </div>
            <Button size="sm">
              <PrinterIcon className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </div>

      {/* Gantt Chart / Timeline */}
      <div className="p-4 sm:p-6 lg:p-8">
        <Card className="w-full">
          <CardHeader className="pb-4">
            <div className="text-center space-y-2">
              <CardTitle className="text-2xl">
                📊 {order.title} - Timeline
              </CardTitle>
              <p className="text-sm text-slate-600">
                {order.categories?.name} • {order.templates?.name || 'Custom Order'}
              </p>
              <div className="flex items-center justify-center gap-2">
                <Badge variant={order.status === 'APPROVED' ? 'default' : order.status === 'IN_PROGRESS' ? 'secondary' : 'outline'}>
                  {order.status}
                </Badge>
                {order.customer_name && (
                  <Badge variant="outline">👤 {order.customer_name}</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {taskSteps.length > 0 ? (
              <GoogleCalendarTimeline tasks={taskSteps} />
            ) : (
              <div className="text-center py-12 space-y-4">
                <div className="text-6xl">📅</div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Belum Ada Tasks
                  </h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Order ini belum memiliki task timeline. Silakan tambahkan tasks dari halaman order.
                  </p>
                  <Button asChild variant="outline">
                    <Link href={`/orders/${id}`}>
                      ← Kembali ke Order
                    </Link>
                  </Button>
                </div>
              </div>
            )}

            {/* Project Info Summary */}
            {taskSteps.length > 0 && (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">📋 Info Order</h4>
                  <p className="text-sm text-slate-600">ID: {order.id.slice(0, 8)}</p>
                  <p className="text-sm text-slate-600">Kategori: {order.categories?.name}</p>
                  {order.description && (
                    <p className="text-xs text-slate-500 mt-1">{order.description}</p>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">👤 Client</h4>
                  <p className="text-sm text-slate-600">{order.customer_name || 'N/A'}</p>
                  {order.customer_contact && (
                    <p className="text-xs text-slate-500">{order.customer_contact}</p>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">⏱️ Timeline</h4>
                  <p className="text-sm text-slate-600">
                    Mulai: {order.estimated_start_date 
                      ? new Date(order.estimated_start_date).toLocaleDateString('id-ID')
                      : new Date(order.created_at).toLocaleDateString('id-ID')
                    }
                  </p>
                  {order.estimated_end_date && (
                    <p className="text-sm text-slate-600">
                      Target: {new Date(order.estimated_end_date).toLocaleDateString('id-ID')}
                    </p>
                  )}
                  {order.total_duration_days && (
                    <p className="text-xs text-slate-500 mt-1">
                      Durasi: {order.total_duration_days} hari kerja
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}