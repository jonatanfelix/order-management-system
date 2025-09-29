import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { PlusIcon, EyeIcon, CalendarIcon } from '@heroicons/react/24/outline'
import { Suspense } from 'react'

interface OrdersPageProps {
  searchParams: {
    filter?: string
    search?: string
  }
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrdersList searchParams={searchParams} />
    </Suspense>
  )
}

async function OrdersList({ searchParams }: OrdersPageProps) {
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

  // Build query based on user role
  let ordersQuery = supabase
    .from('orders')
    .select(`
      id,
      title,
      description,
      status,
      eta,
      created_at,
      categories (name),
      profiles!orders_input_staff_id_fkey (full_name)
    `)

  // Apply role-based filtering
  if (profile.role === 'INPUT_STAFF') {
    ordersQuery = ordersQuery.eq('input_staff_id', user.id)
  }

  // Apply status filter
  if (searchParams.filter) {
    switch (searchParams.filter) {
      case 'pending':
        ordersQuery = ordersQuery.eq('status', 'PENDING')
        break
      case 'in-progress':
        ordersQuery = ordersQuery.eq('status', 'IN_PROGRESS')
        break
      case 'approved':
        ordersQuery = ordersQuery.eq('status', 'APPROVED')
        break
      case 'completed':
        ordersQuery = ordersQuery.eq('status', 'COMPLETED')
        break
    }
  }

  // Apply search filter
  if (searchParams.search) {
    ordersQuery = ordersQuery.or(`title.ilike.%${searchParams.search}%,description.ilike.%${searchParams.search}%`)
  }

  const { data: orders = [] } = await ordersQuery.order('created_at', { ascending: false })

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Daftar Pesanan</h1>
              <p className="text-gray-600">Kelola semua pesanan Anda</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button asChild>
                <Link href="/orders/new">
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Buat Pesanan Baru
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard">
                  Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter & Pencarian</CardTitle>
            <CardDescription>
              Filter pesanan berdasarkan status atau cari berdasarkan judul
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col md:flex-row gap-4" method="GET">
              <div className="flex-1">
                <Input
                  placeholder="Cari pesanan..."
                  name="search"
                  defaultValue={searchParams.search || ''}
                />
              </div>
              <div className="w-full md:w-48">
                <Select name="filter" defaultValue={searchParams.filter || 'all'}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="pending">Menunggu Persetujuan</SelectItem>
                    <SelectItem value="approved">Disetujui</SelectItem>
                    <SelectItem value="in-progress">Dalam Proses</SelectItem>
                    <SelectItem value="completed">Selesai</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit">Filter</Button>
            </form>
          </CardContent>
        </Card>

        {/* Orders List */}
        {(orders && orders.length > 0) ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {orders.map((order: any) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {order.title}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {order.description?.length > 100 
                          ? `${order.description.substring(0, 100)}...`
                          : order.description
                        }
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusColor(order.status)}>
                      {getStatusText(order.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Kategori:</span>
                      <Badge variant="outline">
                        {order.categories?.name || 'N/A'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Input Staff:</span>
                      <span>{order.profiles?.full_name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Dibuat:</span>
                      <div className="flex items-center">
                        <CalendarIcon className="mr-1 h-4 w-4" />
                        {new Date(order.created_at).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                    {order.eta && (
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>ETA:</span>
                        <div className="flex items-center">
                          <CalendarIcon className="mr-1 h-4 w-4" />
                          {new Date(order.eta).toLocaleDateString('id-ID')}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end mt-4">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/orders/${order.id}`}>
                        <EyeIcon className="mr-2 h-4 w-4" />
                        Lihat Detail
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-gray-500">
                <p className="text-lg font-medium mb-2">Tidak ada pesanan ditemukan</p>
                <p className="mb-4">
                  {searchParams.search || searchParams.filter 
                    ? 'Coba ubah filter pencarian Anda'
                    : 'Belum ada pesanan yang dibuat'
                  }
                </p>
                <Button asChild>
                  <Link href="/orders/new">
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Buat Pesanan Pertama
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}