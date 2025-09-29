import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        {/* Hero Section */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-4">
            🖨️ Order Management
          </h1>
          <p className="text-lg md:text-xl text-slate-600 mb-8">
            Sistem manajemen order printing dengan timeline Excel yang powerful
          </p>
        </div>

        {/* Mode Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-2xl">🔐 Mode Login</CardTitle>
              <CardDescription>
                Akses penuh dengan manajemen user, approval, dan database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-slate-600">
                  ✅ Simpan data permanent<br/>
                  ✅ Role management (Admin/Input/Approval)<br/>
                  ✅ Workflow approval<br/>
                  ✅ Audit trail & history
                </div>
                <div className="flex gap-2">
                  <Button asChild className="flex-1">
                    <Link href="/login">
                      🚀 Login
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="flex-1">
                    <Link href="/signup">
                      📝 Daftar
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-2xl">🌐 Mode Guest</CardTitle>
              <CardDescription>
                Buat Gantt Chart timeline tanpa perlu login atau registrasi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-slate-600">
                  ⚡ Langsung pakai tanpa daftar<br/>
                  📋 Format Excel Gantt Chart<br/>
                  🖨️ Atur timeline per bulan<br/>
                  💾 Print & Export hasil
                </div>
                <Button asChild className="w-full" size="lg">
                  <Link href="/guest/gantt">
                    📊 Buat Timeline Sekarang
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Demo Accounts */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg">🔑 Demo Accounts (Mode Login)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <strong>Admin:</strong><br/>
                admin@demo.com / admin123
              </div>
              <div>
                <strong>Input:</strong><br/>
                input@demo.com / input
              </div>
              <div>
                <strong>Approval:</strong><br/>
                approval@demo.com / approval
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold text-slate-800 mb-6">
            🎆 Fitur Unggulan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="p-4 bg-white rounded-lg shadow">
              <div className="text-2xl mb-2">📋</div>
              <strong>Excel Gantt Chart</strong><br/>
              Timeline visual seperti Excel dengan grid yang familiar
            </div>
            <div className="p-4 bg-white rounded-lg shadow">
              <div className="text-2xl mb-2">⚙️</div>
              <strong>Workflow Custom</strong><br/>
              Buat alur kerja sesuai kebutuhan masing-masing
            </div>
            <div className="p-4 bg-white rounded-lg shadow">
              <div className="text-2xl mb-2">👥</div>
              <strong>Multi Role</strong><br/>
              Admin, Input Staff, dan Approver dengan akses berbeda
            </div>
            <div className="p-4 bg-white rounded-lg shadow">
              <div className="text-2xl mb-2">📊</div>
              <strong>Real-time Tracking</strong><br/>
              Monitor progress dan update status secara real-time
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
