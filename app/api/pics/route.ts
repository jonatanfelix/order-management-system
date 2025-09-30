import { NextResponse } from 'next/server'
import { getPICs } from '@/lib/actions/pics'

export async function GET() {
  try {
    const pics = await getPICs()
    return NextResponse.json(pics)
  } catch (error) {
    console.error('Error fetching PICs:', error)
    return NextResponse.json({ error: 'Failed to fetch PICs' }, { status: 500 })
  }
}