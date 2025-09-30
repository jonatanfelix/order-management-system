import { redirect } from 'next/navigation'

// Redirect /orders to /dashboard - consolidated to single dashboard
export default async function OrdersPage() {
  redirect('/dashboard')
}