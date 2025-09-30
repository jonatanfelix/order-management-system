import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { updateOrder } from '@/lib/actions/orders'

interface EditOrderPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditOrderPage({ params }: EditOrderPageProps) {
  const { id } = await params
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

  // Only ADMIN and INPUTER can edit orders
  if (profile.role !== 'ADMIN' && profile.role !== 'INPUTER') {
    redirect('/dashboard?error=no_permission')
  }

  // Get order details
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      *,
      categories (id, name),
      templates (id, name, code)
    `)
    .eq('id', id)
    .single()

  if (orderError || !order) {
    redirect('/dashboard?error=not_found')
  }

  // Can't edit approved orders
  if (order.status === 'APPROVED') {
    redirect(`/orders/${id}?error=already_approved`)
  }

  // Get categories for dropdown
  const { data: categories = [] } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  // Get templates for dropdown
  const { data: templates = [] } = await supabase
    .from('templates')
    .select('*')
    .order('name')

  async function handleSubmit(formData: FormData) {
    'use server'
    
    const result = await updateOrder(id, formData)
    
    if (result.error) {
      redirect(`/orders/${id}/edit?error=${encodeURIComponent(result.error)}`)
    }
    
    redirect(`/orders/${id}?success=updated`)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Button variant="ghost" size="sm" asChild className="mr-4">
              <Link href={`/orders/${id}`}>
                <ArrowLeftIcon className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Edit Order</h1>
              <p className="text-slate-600">Update order details</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
            <CardDescription>
              Update the order information below. Changes to the template will rebuild all order steps.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Order Title *</Label>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  required
                  defaultValue={order.title}
                  placeholder="e.g., Project Alpha - Website Redesign"
                />
              </div>

              {/* Client Name */}
              <div className="space-y-2">
                <Label htmlFor="client_name">Client Name *</Label>
                <Input
                  id="client_name"
                  name="client_name"
                  type="text"
                  required
                  defaultValue={order.client_name}
                  placeholder="e.g., PT ABC Corporation"
                />
              </div>

              {/* Value IDR */}
              <div className="space-y-2">
                <Label htmlFor="value_idr">Order Value (IDR) *</Label>
                <Input
                  id="value_idr"
                  name="value_idr"
                  type="number"
                  step="1000"
                  required
                  defaultValue={order.value_idr}
                  placeholder="e.g., 10000000"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category_id">Category *</Label>
                <Select name="category_id" defaultValue={order.category_id} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
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

              {/* Template */}
              <div className="space-y-2">
                <Label htmlFor="template_id">Template *</Label>
                <Select name="template_id" defaultValue={order.template_id} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {(templates || []).map((template: any) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} ({template.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  ⚠️ Changing the template will rebuild all order steps
                </p>
              </div>

              {/* Hidden field to track template change */}
              <input 
                type="hidden" 
                name="template_changed" 
                value={String(false)} 
              />

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  Save Changes
                </Button>
                <Button type="button" variant="outline" asChild className="flex-1">
                  <Link href={`/orders/${id}`}>
                    Cancel
                  </Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}