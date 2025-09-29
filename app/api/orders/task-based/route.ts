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

    // Use RPC function to create task-based order
    const { data: orderId, error: createError } = await supabase
      .rpc('create_task_based_order', {
        p_title: title,
        p_client_name: client || '',
        p_category_id: categoryId,
        p_priority: priority || 'normal',
        p_tasks: JSON.stringify(transformedTasks),
        p_created_by: user.id
      })

    if (createError) {
      console.error('Error creating task-based order:', createError)
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      orderId,
      message: 'Task-based order created successfully' 
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}