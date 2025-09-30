import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get request body
    const body = await request.json()
    const { title, client_name, value_idr, category_id, template_id, tasks } = body

    // Update order
    const { error: orderError } = await supabase
      .from('orders')
      .update({
        title,
        client_name,
        value_idr,
        category_id,
        template_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 })
    }

    // Update tasks if provided
    if (tasks && Array.isArray(tasks)) {
      // Delete removed tasks (tasks that have IDs but are not in the new list)
      const existingTaskIds = tasks.filter(t => t.id).map(t => t.id)
      if (existingTaskIds.length > 0) {
        await supabase
          .from('order_tasks')
          .delete()
          .eq('order_id', id)
          .not('id', 'in', `(${existingTaskIds.join(',')})`)
      }

      // Update or insert tasks
      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i]
        const taskData = {
          order_id: id,
          name: task.name,
          pic: task.pic || null,
          duration_days: task.duration_days || 1,
          progress: task.progress || 0,
          notes: task.notes || null,
          task_order: i,
          start_date: task.start_date || new Date().toISOString(),
          end_date: task.end_date || new Date().toISOString()
        }

        if (task.id) {
          // Update existing task
          await supabase
            .from('order_tasks')
            .update(taskData)
            .eq('id', task.id)
        } else {
          // Insert new task
          await supabase
            .from('order_tasks')
            .insert(taskData)
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Order updated successfully' })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}