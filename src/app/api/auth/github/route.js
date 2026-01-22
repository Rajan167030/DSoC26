import { NextResponse } from 'next/server'

export async function GET(request) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  
  // Get the base URL from the request and remove any trailing slash
  let baseUrl = process.env.NEXTAUTH_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`
  baseUrl = baseUrl.replace(/\/$/, '') // Remove trailing slash if present
  
  // Step 1: User clicks "Sign in with GitHub" - redirect to GitHub
  if (!code) {
    const githubAuthUrl = new URL('https://github.com/login/oauth/authorize')
    githubAuthUrl.searchParams.set('client_id', process.env.GITHUB_ID || '')
    githubAuthUrl.searchParams.set('redirect_uri', `${baseUrl}/api/auth/github`)
    githubAuthUrl.searchParams.set('scope', 'read:user user:email')
    
    return NextResponse.redirect(githubAuthUrl.toString())
  }
  
  // Step 2: GitHub redirects back with code - exchange for access token
  try {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_ID,
        client_secret: process.env.GITHUB_SECRET,
        code,
      }),
    })
    
    const tokenData = await tokenResponse.json()
    
    if (!tokenData.access_token) {
      throw new Error('Failed to get access token')
    }
    
    // Step 3: Get user data from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    })
    
    const userData = await userResponse.json()
    
    // Step 4: Get user email if not public
    let email = userData.email
    if (!email) {
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      })
      const emails = await emailResponse.json()
      email = emails.find(e => e.primary)?.email || emails[0]?.email
    }
    
    // Step 5: Create session token (simple JWT-like approach)
    const sessionData = {
      user: {
        id: userData.id.toString(),
        name: userData.name || userData.login,
        email: email,
        image: userData.avatar_url,
        username: userData.login,
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    }
    
    // Encode session data as base64
    const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString('base64')
    
    // Step 6: Redirect to application form with user data
    const redirectUrl = new URL('/apply/contributor', process.env.NEXTAUTH_URL || 'http://localhost:3000')
    redirectUrl.searchParams.set('name', sessionData.user.name)
    redirectUrl.searchParams.set('email', sessionData.user.email)
    redirectUrl.searchParams.set('prefill', 'true')
    
    const response = NextResponse.redirect(redirectUrl.toString())
    
    // Set session cookie
    response.cookies.set('github_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    })
    
    return response
    
  } catch (error) {
    console.error('GitHub OAuth error:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login?error=oauth_failed`)
  }
}
