'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function submitForApproval(orderId: string) {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // Update order status to PENDING_APPROVAL
  const { error } = await supabase
    .from('orders')
    .update({
      status: 'PENDING_APPROVAL',
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .eq('created_by', user.id) // Only allow creator to submit

  if (error) {
    console.error('Error submitting for approval:', error)
    redirect(`/orders/${orderId}?error=submit_failed`)
  }

  redirect(`/orders/${orderId}?success=submitted`)
}

export async function approveRejectOrder(orderId: string, status: 'APPROVED' | 'REJECTED', note?: string) {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // Get user profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'ADMIN' && profile.role !== 'APPROVER')) {
    redirect(`/orders/${orderId}?error=no_permission`)
  }

  // Update order status
  const updateData: any = {
    status,
    updated_at: new Date().toISOString()
  }

  if (status === 'APPROVED') {
    updateData.approved_at = new Date().toISOString()
  } else {
    updateData.rejected_at = new Date().toISOString()
  }

  const { error: updateError } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId)

  if (updateError) {
    console.error('Error updating order status:', updateError)
    redirect(`/orders/${orderId}?error=update_failed`)
  }

  // Create approval record
  const { error: approvalError } = await supabase
    .from('approvals')
    .insert({
      order_id: orderId,
      approver_id: user.id,
      status,
      note,
      decided_at: new Date().toISOString()
    })

  if (approvalError) {
    console.error('Error creating approval record:', approvalError)
  }

  const successMessage = status === 'APPROVED' ? 'approved' : 'rejected'
  redirect(`/orders/${orderId}?success=${successMessage}`)
}