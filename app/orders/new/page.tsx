import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import TaskBuilder from '@/components/task-builder'

export default async function NewOrderPage() {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/login')
  }

  // Get user profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  // Check if user has permission to create orders
  if (profile.role === 'APPROVER') {
    redirect('/orders?error=no_permission')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TaskBuilder />
    </div>
  )
}
