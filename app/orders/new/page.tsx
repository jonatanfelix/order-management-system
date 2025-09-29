import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { createOrder } from '@/lib/actions/orders'

export default async function NewOrderPage() {
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

  // Get categories
  const { data: categories = [] } = await supabase
    .from('categories')
    .select('id, name, description')
    .order('name')

  // Get templates for each category
  const { data: templates = [] } = await supabase
    .from('templates')
    .select('id, name, code, category_id, description')
    .order('name')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Button variant="ghost" size="sm" asChild className="mr-4">
              <Link href="/orders">
                <ArrowLeftIcon className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Buat Pesanan Baru</h1>
              <p className="text-gray-600">Isi detail pesanan dan pilih template proses</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Detail Pesanan</CardTitle>
            <CardDescription>
              Masukkan informasi lengkap tentang pesanan yang akan dibuat
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createOrder} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Judul Pesanan *</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Contoh: Cetak Banner 3x2m untuk Event XYZ"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi Detail</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Jelaskan detail pesanan, spesifikasi, dan persyaratan khusus..."
                  rows={4}
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Kategori *</Label>
                <Select name="category_id" required>
                  <SelectTrigger className="bg-white border-2 border-slate-300">
                    <SelectValue placeholder="Pilih kategori pesanan" />
                  </SelectTrigger>
                  <SelectContent className="bg-white shadow-lg">
                    {(categories || []).map((category: any) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="p-2 rounded-md bg-slate-50 border border-slate-200">
                          <div className="font-semibold text-slate-800">{category.name}</div>
                          {category.description && (
                            <div className="text-xs text-slate-600">{category.description}</div>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Template */}
              <div className="space-y-2">
                <Label htmlFor="template">Template Proses *</Label>
                <Select name="template_id" required>
                  <SelectTrigger className="bg-white border-2 border-slate-300">
                    <SelectValue placeholder="Pilih template proses" />
                  </SelectTrigger>
                  <SelectContent className="bg-white shadow-lg">
                    {(templates || []).map((template: any) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="p-2 rounded-md bg-slate-50 border border-slate-200">
                          <div className="font-semibold text-slate-800">{template.name}</div>
                          <div className="text-xs text-slate-600">
                            {template.code} - {template.description || 'Template proses standar'}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer_name">Nama Pelanggan</Label>
                  <Input
                    id="customer_name"
                    name="customer_name"
                    placeholder="Nama pelanggan"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer_contact">Kontak Pelanggan</Label>
                  <Input
                    id="customer_contact"
                    name="customer_contact"
                    placeholder="Email atau nomor telepon"
                  />
                </div>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label htmlFor="priority">Prioritas</Label>
                <Select name="priority" defaultValue="NORMAL">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Rendah</SelectItem>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="HIGH">Tinggi</SelectItem>
                    <SelectItem value="URGENT">Mendesak</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Catatan Tambahan</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Catatan khusus atau instruksi tambahan..."
                  rows={3}
                />
              </div>

              {/* Submit Actions */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button type="submit" className="flex-1">
                  Buat Pesanan
                </Button>
                <Button type="button" variant="outline" asChild className="flex-1">
                  <Link href="/orders">
                    Batal
                  </Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Help Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Tips Membuat Pesanan</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-2">
            <p>• <strong>Judul:</strong> Gunakan judul yang jelas dan deskriptif</p>
            <p>• <strong>Kategori:</strong> Pilih kategori yang paling sesuai dengan jenis pesanan</p>
            <p>• <strong>Template:</strong> Template akan menentukan tahapan proses dan estimasi waktu</p>
            <p>• <strong>Deskripsi:</strong> Sertakan semua detail penting untuk menghindari revisi</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}