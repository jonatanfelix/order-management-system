import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeftIcon, PrinterIcon } from '@heroicons/react/24/outline'

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

  // Get order with steps
  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      categories(name),
      templates(name, code),
      order_steps(
        id, name_snapshot, type_snapshot, unit_snapshot, 
        order_index, qty, duration_minutes
      )
    `)
    .eq('id', id)
    .single()

  if (!order) {
    redirect('/orders')
  }

  // Calculate weeks for timeline (next 12 weeks)
  const weeks = Array.from({ length: 12 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() + (i * 7))
    return {
      week: i + 1,
      startDate: new Date(date),
      label: `Minggu ${i + 1}`
    }
  })

  // Sample data untuk demo - nanti bisa disesuaikan dengan data real
  const processSteps = [
    { 
      id: 1, 
      name: 'PESAN BAHAN', 
      pic: 'IBU MEINI',
      target: '20 rim',
      weeks: [1, 2, 3, 4, 5] // minggu 1-5
    },
    { 
      id: 2, 
      name: 'POTONG BAHAN', 
      pic: 'PAK ZUL',
      target: '1 kali 200 rim',
      weeks: [6, 7, 8] // minggu 6-8  
    },
    { 
      id: 3, 
      name: 'PROSES PEMBUATAN PLATE', 
      pic: 'LASPEN',
      target: 'sesuai plate selesai',
      weeks: [2, 3] // minggu 2-3
    },
    { 
      id: 4, 
      name: 'PROSES CETAK 1', 
      pic: 'P.FADIL',
      target: '25 rigor 64 pg',
      weeks: [4, 5, 6, 7] // minggu 4-7
    },
    { 
      id: 5, 
      name: 'PROSES CETAK 2', 
      pic: 'SYAM',
      target: '25 rigor 64 pg',
      weeks: [5, 6, 7, 8] // minggu 5-8
    },
    { 
      id: 6, 
      name: 'SUSUN KATERN', 
      pic: 'AGUS',
      target: '',
      weeks: [8, 9, 10] // minggu 8-10
    },
    { 
      id: 7, 
      name: 'JAHIT KAVAL', 
      pic: 'ELYAS',
      target: '',
      weeks: [9, 10] // minggu 9-10
    },
    { 
      id: 8, 
      name: 'POTONG JADI', 
      pic: 'P.ZUL',
      target: '',
      weeks: [10, 11] // minggu 10-11
    },
    { 
      id: 9, 
      name: 'SORTIR PAK', 
      pic: 'NOPY',
      target: '',
      weeks: [11, 12] // minggu 11-12
    },
    { 
      id: 10, 
      name: 'REPING KARDUS', 
      pic: 'AGUS',
      target: '',
      weeks: [12] // minggu 12
    },
    { 
      id: 11, 
      name: 'KIRIM BARANG', 
      pic: 'SOFIR',
      target: '',
      weeks: [12] // minggu 12
    }
  ]

  // Color mapping untuk berbagai tahap
  const getStepColor = (stepName: string) => {
    if (stepName.includes('BAHAN')) return 'bg-red-500'
    if (stepName.includes('CETAK')) return 'bg-green-500'  
    if (stepName.includes('SUSUN')) return 'bg-blue-500'
    if (stepName.includes('JAHIT')) return 'bg-blue-400'
    if (stepName.includes('POTONG')) return 'bg-yellow-500'
    if (stepName.includes('SORTIR')) return 'bg-purple-500'
    if (stepName.includes('KIRIM')) return 'bg-red-400'
    return 'bg-gray-400'
  }

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

      {/* Gantt Chart */}
      <div className="p-4 overflow-x-auto">
        <Card className="w-full min-w-[1200px]">
          <CardHeader className="pb-4">
            <CardTitle className="text-center">
              📋 PROYEK PENGERJAAN BUKU TULIS
            </CardTitle>
            <div className="text-center text-sm text-slate-600">
              Target Realisasi Kerja - {order.categories?.name}
            </div>
          </CardHeader>
          <CardContent>
            {/* Header Table */}
            <div className="grid grid-cols-[50px_200px_120px_120px_repeat(12,_80px)] gap-1 mb-2">
              <div className="bg-yellow-200 border border-black p-2 text-xs font-semibold">No</div>
              <div className="bg-yellow-200 border border-black p-2 text-xs font-semibold">JENIS PEKERJAAN</div>
              <div className="bg-yellow-200 border border-black p-2 text-xs font-semibold">PENANGGUNG JAWAB</div>
              <div className="bg-yellow-200 border border-black p-2 text-xs font-semibold">TARGET REALISASI KERJA</div>
              <div className="col-span-12 grid grid-cols-12 gap-1">
                {weeks.map((week) => (
                  <div key={week.week} className="bg-yellow-200 border border-black p-2 text-xs font-semibold text-center">
                    {week.week}
                  </div>
                ))}
              </div>
            </div>

            {/* Process Rows */}
            {processSteps.map((step, index) => (
              <div key={step.id} className="grid grid-cols-[50px_200px_120px_120px_repeat(12,_80px)] gap-1 mb-1">
                <div className="border border-black p-2 text-xs text-center bg-white">
                  {index + 1}
                </div>
                <div className="border border-black p-2 text-xs font-medium bg-white">
                  {step.name}
                </div>
                <div className="border border-black p-2 text-xs text-center bg-white">
                  {step.pic}
                </div>
                <div className="border border-black p-2 text-xs bg-white">
                  {step.target}
                </div>
                
                {/* Timeline Cells */}
                <div className="col-span-12 grid grid-cols-12 gap-1">
                  {weeks.map((week) => {
                    const isActive = step.weeks.includes(week.week)
                    return (
                      <div 
                        key={`${step.id}-${week.week}`} 
                        className={`border border-black p-2 h-8 ${
                          isActive ? getStepColor(step.name) : 'bg-white'
                        }`}
                      >
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Week Numbers Footer */}
            <div className="grid grid-cols-[50px_200px_120px_120px_repeat(12,_80px)] gap-1 mt-4 pt-4 border-t-2 border-black">
              <div className="col-span-4"></div>
              <div className="col-span-12 grid grid-cols-12 gap-1">
                {weeks.map((week) => (
                  <div key={week.week} className="text-xs text-center font-semibold">
                    {week.startDate.getDate()}/{week.startDate.getMonth() + 1}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="mt-8 p-4 bg-slate-100 rounded-lg">
              <h4 className="font-semibold mb-3">🎨 Keterangan Warna:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 border"></div>
                  <span>Persiapan Bahan</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 border"></div>
                  <span>Proses Cetak</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 border"></div>
                  <span>Assembly</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 border"></div>
                  <span>Finishing</span>
                </div>
              </div>
            </div>

            {/* Project Info */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-semibold">📋 Info Proyek:</h4>
                <p>Order ID: {order.id.slice(0, 8)}</p>
                <p>Kategori: {order.categories?.name}</p>
                <p>Template: {order.templates?.code}</p>
              </div>
              <div>
                <h4 className="font-semibold">👤 Client:</h4>
                <p>{order.client_name}</p>
                <p>Nilai: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(order.value_idr)}</p>
              </div>
              <div>
                <h4 className="font-semibold">⏱️ Timeline:</h4>
                <p>Mulai: {new Date().toLocaleDateString('id-ID')}</p>
                <p>Target: {weeks[11]?.startDate.toLocaleDateString('id-ID')}</p>
                <Badge variant={order.status === 'APPROVED' ? 'default' : 'secondary'}>
                  {order.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}