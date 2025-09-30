import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { signIn } from '@/lib/actions/auth'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-2xl border-2 border-slate-200">
        <CardHeader className="space-y-1 bg-slate-50 rounded-t-lg">
          <CardTitle className="text-3xl text-center font-bold text-slate-800">🖨️ Order Management</CardTitle>
          <CardDescription className="text-center text-slate-600 font-medium">
            Masuk ke sistem order management
          </CardDescription>
        </CardHeader>
        <CardContent className="bg-white p-6">
          <form action={signIn} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold text-slate-700">
                📧 Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="email@example.com"
                className="border-2 border-slate-300 focus:border-blue-500 text-slate-800"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-semibold text-slate-700">
                🔒 Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                className="border-2 border-slate-300 focus:border-blue-500 text-slate-800"
                required
              />
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3">
              🚀 Masuk ke Sistem
            </Button>
          </form>
          
          {/* Guest Mode Button */}
          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">atau</span>
              </div>
            </div>
            <Button asChild variant="outline" className="w-full mt-4 border-2 border-green-300 text-green-700 hover:bg-green-50">
              <Link href="/guest/dashboard">
                🌐 Mode Guest - Lihat Dashboard Tanpa Login
              </Link>
            </Button>
          </div>
          
          <div className="mt-6 text-center">
            <div className="text-sm text-slate-600">
              Belum punya akun?{' '}
              <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline">
                Daftar di sini
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}