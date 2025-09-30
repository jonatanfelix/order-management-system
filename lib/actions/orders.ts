'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { type ApiResponse, type OrderFormData, type AdjustmentFormData, type ApprovalFormData } from '@/lib/types'

export async function createOrder(formData: FormData): Promise<void> {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  try {
    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        title: formData.get('title') as string,
        client_name: formData.get('client_name') as string,
        value_idr: parseFloat(formData.get('value_idr') as string),
        category_id: formData.get('category_id') as string,
        template_id: formData.get('template_id') as string,
        created_by: user.id
      })
      .select()
      .single()

    if (orderError) {
      throw new Error(orderError.message)
    }

    // Build order steps from template
    const { error: stepsError } = await supabase
      .rpc('fn_build_order_steps', { input_order_id: order.id })

    if (stepsError) {
      throw new Error(stepsError.message)
    }

    // Update quantities for RATE steps if provided
    const stepsData = formData.get('steps_data') as string
    if (stepsData) {
      const steps = JSON.parse(stepsData)
      for (const step of steps) {
        if (step.qty) {
          await supabase
            .from('order_steps')
            .update({ qty: parseFloat(step.qty) })
            .eq('order_id', order.id)
            .eq('template_step_id', step.id)
        }
      }
    }

    revalidatePath('/orders')
    redirect(`/orders/${order.id}`)
    
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to create order')
  }
}

export async function updateOrder(orderId: string, formData: FormData): Promise<ApiResponse> {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('orders')
      .update({
        title: formData.get('title') as string,
        client_name: formData.get('client_name') as string,
        value_idr: parseFloat(formData.get('value_idr') as string),
        category_id: formData.get('category_id') as string,
        template_id: formData.get('template_id') as string,
      })
      .eq('id', orderId)

    if (error) {
      return { error: error.message }
    }

    // Rebuild steps if template changed
    const templateChanged = formData.get('template_changed') === 'true'
    if (templateChanged) {
      const { error: stepsError } = await supabase
        .rpc('fn_build_order_steps', { input_order_id: orderId })

      if (stepsError) {
        return { error: stepsError.message }
      }
    }

    revalidatePath('/orders')
    revalidatePath(`/orders/${orderId}`)
    return { message: 'Order updated successfully' }
    
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to update order' }
  }
}

export async function submitForApproval(orderId: string): Promise<ApiResponse> {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .rpc('submit_order_for_approval', { order_uuid: orderId })

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/orders')
    revalidatePath(`/orders/${orderId}`)
    return { message: 'Order submitted for approval successfully' }
    
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to submit order' }
  }
}

export async function approveRejectOrder(
  orderId: string, 
  status: 'APPROVED' | 'REJECTED',
  note?: string
): Promise<ApiResponse> {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .rpc('approve_reject_order', { 
        order_uuid: orderId,
        new_status: status,
        approval_note: note || null
      })

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/orders')
    revalidatePath(`/orders/${orderId}`)
    return { message: `Order ${status.toLowerCase()} successfully` }
    
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to process approval' }
  }
}

export async function addAdjustment(orderId: string, formData: FormData): Promise<ApiResponse> {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  try {
    const { error } = await supabase
      .from('order_adjustments')
      .insert({
        order_id: orderId,
        reason_id: formData.get('reason_id') as string,
        minutes_delta: parseInt(formData.get('minutes_delta') as string),
        note: formData.get('note') as string || null,
        created_by: user.id
      })

    if (error) {
      return { error: error.message }
    }

    revalidatePath(`/orders/${orderId}`)
    return { message: 'Adjustment added successfully' }
    
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to add adjustment' }
  }
}

export async function createPublicShare(orderId: string): Promise<ApiResponse<string>> {
  const supabase = await createClient()

  try {
    const { data: shareCode, error } = await supabase
      .rpc('create_public_share', { order_uuid: orderId })

    if (error) {
      return { error: error.message }
    }

    revalidatePath(`/orders/${orderId}`)
    return { data: shareCode, message: 'Public share link created' }
    
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to create share link' }
  }
}

export async function deleteOrder(orderId: string): Promise<void> {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId)

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/dashboard')
    revalidatePath('/orders')
  } catch (error) {
    console.error('Error deleting order:', error)
    throw error
  }
  
  redirect('/dashboard')
}

export async function updateOrderStep(stepId: string, qty: number): Promise<ApiResponse> {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('order_steps')
      .update({ qty })
      .eq('id', stepId)

    if (error) {
      return { error: error.message }
    }

    // Get order_id to revalidate
    const { data: step } = await supabase
      .from('order_steps')
      .select('order_id')
      .eq('id', stepId)
      .single()

    if (step) {
      revalidatePath(`/orders/${step.order_id}`)
    }

    return { message: 'Step updated successfully' }
    
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to update step' }
  }
}

// Get templates by category
export async function getTemplatesByCategory(categoryId: string) {
  const supabase = await createClient()

  const { data: templates, error } = await supabase
    .from('templates')
    .select(`
      *,
      template_steps(*)
    `)
    .eq('category_id', categoryId)
    .eq('is_active', true)
    .order('name')

  if (error) {
    throw error
  }

  return templates
}

// Get order with full details
export async function getOrderDetails(orderId: string) {
  const supabase = await createClient()

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      category:categories(*),
      template:templates(*),
      created_by_profile:profiles!created_by(*),
      steps:order_steps(*),
      adjustments:order_adjustments(
        *,
        reason:adjustment_reasons(*),
        created_by_profile:profiles!created_by(*)
      ),
      approvals:approvals(
        *,
        approver:profiles!approver_id(*)
      ),
      public_shares(*)
    `)
    .eq('id', orderId)
    .single()

  if (error) {
    throw error
  }

  return order
}