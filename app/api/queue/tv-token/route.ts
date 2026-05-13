import { NextRequest, NextResponse } from 'next/server'
import { signTvToken } from '@/lib/auth'
import prisma from '@/lib/db'

export async function GET(req: NextRequest) {
  const token = await signTvToken()
  const share = new URL(req.url).searchParams.get('share')

  if (share === '1') {
    // Link de compartilhamento único — salva em active_share_token
    await prisma.queueConfig.upsert({
      where: { key: 'active_share_token' },
      update: { value: token },
      create: { key: 'active_share_token', value: token },
    })
  } else {
    // Token da TV — salva em tv_display_token (não interfere no link de compartilhamento)
    await prisma.queueConfig.upsert({
      where: { key: 'tv_display_token' },
      update: { value: token },
      create: { key: 'tv_display_token', value: token },
    })
  }

  return NextResponse.json({ token })
}
