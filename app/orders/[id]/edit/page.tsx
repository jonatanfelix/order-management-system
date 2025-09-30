import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import OrderEditForm from '@/components/order-edit-form'

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

  // Get order tasks if this is a task-based order
  const { data: tasks = [] } = await supabase
    .from('order_tasks')
    .select('*')
    .eq('order_id', id)
    .order('task_order')

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

  return (
    <OrderEditForm 
      order={order}
      tasks={tasks || []}
      categories={categories || []}
      templates={templates || []}
    />
  )
}
