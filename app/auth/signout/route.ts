import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

async function handleSignOut(request: NextRequest) {
  const supabase = await createClient()

  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    await supabase.auth.signOut()
  }

  return NextResponse.redirect(new URL('/login', request.url))
}

export async function POST(request: NextRequest) {
  return handleSignOut(request)
}

export async function GET(request: NextRequest) {
  return handleSignOut(request)
}
