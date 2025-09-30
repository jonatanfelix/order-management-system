import { redirect } from 'next/navigation'

// Redirect to unified dashboard - all roles (including guest) use /dashboard
export default async function GuestDashboardRedirect() {
  redirect('/dashboard')
}