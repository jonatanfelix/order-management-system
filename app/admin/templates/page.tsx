import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

async function createTemplate(formData: FormData) {
  'use server'
  
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  
  const templateData = {
    name: formData.get('name') as string,
    code: formData.get('code') as string,
    category_id: formData.get('category_id') as string,
    description: formData.get('description') as string,
  }
  
  const { error } = await supabase
    .from('templates')
    .insert([templateData])
    
  if (!error) {
    redirect('/admin/templates')
  }
}

export default async function TemplatesPage() {
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

  if (!profile || profile.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  // Get categories
  const { data: categories = [] } = await supabase
    .from('categories')
    .select('id, name')
    .order('name')

  // Get templates with categories
  const { data: templates = [] } = await supabase
    .from('templates')
    .select(`
      id, name, code, description, is_active, created_at,
      categories!inner(name)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">🛠️ Kelola Template Proses</h1>
              <p className="text-slate-600">Buat dan kelola template proses untuk setiap kategori</p>
            </div>
            <Button asChild>
              <Link href="/admin/templates/new">
                <PlusIcon className="h-4 w-4 mr-2" />
                Buat Template Baru
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Create Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>🚀 Buat Template Cepat</CardTitle>
            <CardDescription>
              Buat template proses baru dengan cepat
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createTemplate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Template</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Standard Book Printing"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Kode Template</Label>
                  <Input
                    id="code"
                    name="code"
                    placeholder="BOOK_STD"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Kategori</Label>
                  <Select name="category_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {(categories || []).map((category: any) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Input
                    id="description"
                    name="description"
                    placeholder="Deskripsi singkat..."
                  />
                </div>
              </div>
              <Button type="submit">Buat Template</Button>
            </form>
          </CardContent>
        </Card>

        {/* Templates List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(templates || []).map((template: any) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <Badge variant={template.is_active ? 'default' : 'secondary'}>
                    {template.is_active ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </div>
                <CardDescription>
                  <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                    {template.code}
                  </span>
                  {' • '}
                  <span className="text-blue-600">{template.categories.name}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">
                  {template.description || 'Tidak ada deskripsi'}
                </p>
                
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/admin/templates/${template.id}/steps`}>
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Kelola Steps
                    </Link>
                  </Button>
                  <Button size="sm" variant="ghost">
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {(!templates || templates.length === 0) && (
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Belum Ada Template
              </h3>
              <p className="text-slate-600 mb-4">
                Mulai dengan membuat template proses pertama Anda
              </p>
              <Button asChild>
                <Link href="/admin/templates/new">
                  Buat Template Pertama
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}