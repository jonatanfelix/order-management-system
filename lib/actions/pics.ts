'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export interface PIC {
  id: string
  name: string
  email?: string
  phone?: string
  role?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function getPICs(): Promise<PIC[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('pics')
    .select('*')
    .eq('is_active', true)
    .order('name')
  
  if (error) {
    console.error('Error fetching PICs:', error)
    return []
  }
  
  return data || []
}

export async function getAllPICs(): Promise<PIC[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('pics')
    .select('*')
    .order('name')
  
  if (error) {
    console.error('Error fetching all PICs:', error)
    return []
  }
  
  return data || []
}

export async function createPIC(formData: FormData): Promise<void> {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  try {
    const { error } = await supabase
      .from('pics')
      .insert({
        name: formData.get('name') as string,
        email: formData.get('email') as string || null,
        phone: formData.get('phone') as string || null,
        role: formData.get('role') as string || null,
        is_active: true,
        created_by: user.id
      })
    
    if (error) {
      throw new Error(error.message)
    }
    
    revalidatePath('/settings')
  } catch (error) {
    console.error('Error creating PIC:', error)
    throw error
  }
  
  redirect('/settings')
}

export async function updatePIC(picId: string, formData: FormData): Promise<void> {
  const supabase = await createClient()
  
  try {
    const { error } = await supabase
      .from('pics')
      .update({
        name: formData.get('name') as string,
        email: formData.get('email') as string || null,
        phone: formData.get('phone') as string || null,
        role: formData.get('role') as string || null,
        is_active: formData.get('is_active') === 'true'
      })
      .eq('id', picId)
    
    if (error) {
      throw new Error(error.message)
    }
    
    revalidatePath('/settings')
  } catch (error) {
    console.error('Error updating PIC:', error)
    throw error
  }
  
  redirect('/settings')
}

export async function deletePIC(picId: string): Promise<void> {
  const supabase = await createClient()
  
  try {
    // Soft delete - just mark as inactive
    const { error } = await supabase
      .from('pics')
      .update({ is_active: false })
      .eq('id', picId)
    
    if (error) {
      throw new Error(error.message)
    }
    
    revalidatePath('/settings')
  } catch (error) {
    console.error('Error deleting PIC:', error)
    throw error
  }
  
  redirect('/settings')
}