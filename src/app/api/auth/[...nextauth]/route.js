// NextAuth OAuth temporarily disabled due to Next.js 14 App Router compatibility issues
// For GitHub authentication, we recommend:
// 1. Deploy the app first with Application ID login (working)
// 2. After deployment, implement direct GitHub OAuth using GitHub Apps API
// 3. Or upgrade to NextAuth v5 (beta) which has better App Router support

export async function GET(req) {
  return new Response(JSON.stringify({ error: 'OAuth not configured' }), {
    status: 501,
    headers: { 'Content-Type': 'application/json' }
  })
}

export async function POST(req) {
  return new Response(JSON.stringify({ error: 'OAuth not configured' }), {
    status: 501,
    headers: { 'Content-Type': 'application/json' }
  })
}
