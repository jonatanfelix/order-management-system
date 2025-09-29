import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ClockIcon, CheckCircleIcon, ExclamationTriangleIcon, PlusIcon } from '@heroicons/react/24/outline'

export default async function Dashboard() {
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

  // Get order statistics based on user role
  let ordersQuery = supabase
    .from('orders')
    .select('id, status, eta, created_at')

  // Input staff can only see their own orders
  if (profile.role === 'INPUT_STAFF') {
    ordersQuery = ordersQuery.eq('input_staff_id', user.id)
  }

  const { data: orders } = await ordersQuery
  const ordersList = orders || []

  // Calculate statistics
  const totalOrders = ordersList.length
  const pendingOrders = ordersList.filter(o => o.status === 'PENDING').length
  const inProgressOrders = ordersList.filter(o => o.status === 'IN_PROGRESS').length
  const approvedOrders = ordersList.filter(o => o.status === 'APPROVED').length
  const overdueOrders = ordersList.filter(o => {
    if (!o.eta || o.status === 'COMPLETED') return false
    return new Date(o.eta) < new Date()
  }).length

  // Get recent orders
  const recentOrders = ordersList
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Selamat datang, {profile.full_name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="capitalize">
                {profile.role.replace('_', ' ')}
              </Badge>
              <form action="/auth/signout" method="post">
                <Button variant="outline" type="submit">
                  Keluar
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ClockIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                Total pesanan
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Menunggu Persetujuan</CardTitle>
              <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingOrders}</div>
              <p className="text-xs text-muted-foreground">
                Perlu disetujui
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dalam Proses</CardTitle>
              <ClockIcon className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{inProgressOrders}</div>
              <p className="text-xs text-muted-foreground">
                Sedang dikerjakan
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Terlambat</CardTitle>
              <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{overdueOrders}</div>
              <p className="text-xs text-muted-foreground">
                Melewati deadline
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Aksi Cepat</CardTitle>
              <CardDescription>
                Akses fitur utama dengan cepat
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/orders/new">
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Buat Pesanan Baru
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/orders">
                  Lihat Semua Pesanan
                </Link>
              </Button>
              {(profile.role === 'ADMIN' || profile.role === 'APPROVAL_STAFF') && (
                <Button variant="outline" asChild className="w-full">
                  <Link href="/orders?filter=pending">
                    Review Persetujuan
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Pesanan Terbaru</CardTitle>
              <CardDescription>
                5 pesanan terbaru yang dibuat
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentOrders.length > 0 ? (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(order.created_at).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={
                          order.status === 'COMPLETED' ? 'default' :
                          order.status === 'APPROVED' ? 'secondary' :
                          order.status === 'IN_PROGRESS' ? 'outline' :
                          'destructive'
                        }>
                          {order.status.replace('_', ' ')}
                        </Badge>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/orders/${order.id}`}>
                            Lihat
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p>Belum ada pesanan</p>
                  <Button asChild className="mt-2">
                    <Link href="/orders/new">
                      Buat Pesanan Pertama
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}