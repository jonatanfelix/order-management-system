import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to check permissions
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check if user has permission to create orders
    if (profile.role === 'APPROVER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { title, client, category, priority, tasks } = body

    // Validate required fields
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json({ error: 'At least one task is required' }, { status: 400 })
    }

    // Get category_id if category is a string (category name)
    let categoryId = category
    if (typeof category === 'string') {
      const { data: categoryData } = await supabase
        .from('categories')
        .select('id')
        .eq('name', category)
        .single()
      
      if (categoryData) {
        categoryId = categoryData.id
      }
    }

    // Transform tasks for database storage
    const transformedTasks = tasks.map((task: any, index: number) => ({
      name: task.name,
      pic: task.pic || '',
      quantity: task.quantity || 1,
      unit: task.unit || 'pcs',
      startDate: task.startDate,
      endDate: task.endDate,
      duration: task.duration || 1,
      progress: task.progress || 0,
      isMilestone: task.isMilestone || false,
      dependsOn: task.dependsOn || [],
      notes: task.notes || ''
    }))

    // Create order directly without RPC function
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        title,
        client_name: client || '',
        category_id: categoryId,
        status: 'DRAFT',
        value_idr: 0,
        is_task_based: true,
        created_by: user.id
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Error creating order:', orderError)
      return NextResponse.json({ error: orderError?.message || 'Failed to create order' }, { status: 500 })
    }

    // Insert tasks
    const tasksToInsert = transformedTasks.map((task: any, index: number) => ({
      order_id: order.id,
      name: task.name,
      pic: task.pic,
      quantity: task.quantity,
      unit: task.unit,
      start_date: task.startDate,
      end_date: task.endDate,
      duration_days: task.duration,
      progress: task.progress,
      is_milestone: task.isMilestone,
      task_order: index + 1,
      depends_on_tasks: task.dependsOn || [],
      notes: task.notes
    }))

    const { error: tasksError } = await supabase
      .from('order_tasks')
      .insert(tasksToInsert)

    if (tasksError) {
      console.error('Error creating tasks:', tasksError)
      // Rollback: delete the order
      await supabase.from('orders').delete().eq('id', order.id)
      return NextResponse.json({ error: tasksError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      orderId: order.id,
      message: 'Task-based order created successfully' 
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}