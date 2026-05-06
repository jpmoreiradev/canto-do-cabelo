import { NextResponse } from 'next/server'
import { signTvToken } from '@/lib/auth'

export async function GET() {
  const token = await signTvToken()
  return NextResponse.json({ token })
}
