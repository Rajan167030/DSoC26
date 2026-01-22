import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore?.get?.('github_session')?.value

  if (!sessionToken) {
    return NextResponse.json({ user: null, expires: null })
  }

  try {
    // Decode session data
    const sessionData = JSON.parse(Buffer.from(sessionToken, 'base64').toString('utf-8'))

    // Check if session is expired
    if (new Date(sessionData.expires) < new Date()) {
      return NextResponse.json({ user: null, expires: null })
    }

    return NextResponse.json(sessionData)
  } catch (error) {
    return NextResponse.json({ user: null, expires: null })
  }
}
