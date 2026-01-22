import { NextResponse } from 'next/server'
import crypto from 'crypto'
import connectDB from '@/lib/db'
import User from '@/models/User'

// Verify GitHub webhook signature
function verifySignature(payload, signature) {
  if (!process.env.GITHUB_WEBHOOK_SECRET) {
    console.warn('GITHUB_WEBHOOK_SECRET not set - skipping signature verification')
    return true // Allow in development
  }

  const hmac = crypto.createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET)
  const digest = 'sha256=' + hmac.update(payload).digest('hex')
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  )
}

// Calculate points based on PR size and complexity
function calculatePoints(pr) {
  let points = 10 // Base points for any merged PR
  
  // Additional points based on changes
  const additions = pr.additions || 0
  const deletions = pr.deletions || 0
  const filesChanged = pr.changed_files || 0
  
  // Points for code volume
  if (additions + deletions > 500) {
    points += 20 // Large PR
  } else if (additions + deletions > 200) {
    points += 15 // Medium PR
  } else if (additions + deletions > 50) {
    points += 10 // Small PR
  } else {
    points += 5 // Tiny PR
  }
  
  // Bonus for multiple files (shows broader changes)
  if (filesChanged > 10) {
    points += 10
  } else if (filesChanged > 5) {
    points += 5
  }
  
  // Bonus for reviews (if PR was reviewed before merge)
  if (pr.requested_reviewers?.length > 0 || pr.reviews_count > 0) {
    points += 5
  }
  
  return points
}

export async function POST(request) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text()
    const signature = request.headers.get('x-hub-signature-256')
    const event = request.headers.get('x-github-event')
    
    // Verify webhook signature
    if (signature && !verifySignature(rawBody, signature)) {
      console.error('Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }
    
    const payload = JSON.parse(rawBody)
    
    console.log(`Received GitHub webhook: ${event}`)
    
    // Only process pull_request events
    if (event !== 'pull_request') {
      return NextResponse.json({ 
        message: `Event ${event} ignored`,
        received: true 
      })
    }
    
    // Only process merged PRs
    if (payload.action !== 'closed' || !payload.pull_request?.merged) {
      return NextResponse.json({ 
        message: 'Not a merged PR, ignoring',
        received: true 
      })
    }
    
    const pr = payload.pull_request
    const repository = payload.repository
    
    console.log(`Processing merged PR #${pr.number} in ${repository.full_name}`)
    
    // Get PR author username
    const githubUsername = pr.user.login
    const prUrl = pr.html_url
    const prTitle = pr.title
    
    // Calculate points
    const points = calculatePoints(pr)
    
    console.log(`Awarding ${points} points to ${githubUsername}`)
    
    // Connect to database
    await connectDB()
    
    // Find user by GitHub username (stored in username field or name)
    // First try to find by exact username match
    let user = await User.findOne({ 
      username: new RegExp(`^${githubUsername}$`, 'i')
    })
    
    // If not found, try to find by GitHub profile link or name
    if (!user) {
      user = await User.findOne({
        $or: [
          { name: new RegExp(githubUsername, 'i') },
          { github: new RegExp(githubUsername, 'i') }
        ]
      })
    }
    
    if (!user) {
      console.warn(`User not found for GitHub username: ${githubUsername}`)
      return NextResponse.json({
        success: false,
        message: `User ${githubUsername} not found in ECWoC database`,
        received: true,
        suggestion: 'User needs to register on ECWoC platform first'
      })
    }
    
    // Update user points
    const previousPoints = user.points || 0
    user.points = (user.points || 0) + points
    
    // Add PR to contributions if field exists
    if (!user.contributions) {
      user.contributions = []
    }
    
    user.contributions.push({
      type: 'pull_request',
      title: prTitle,
      url: prUrl,
      points: points,
      repository: repository.full_name,
      mergedAt: new Date(),
      prNumber: pr.number,
      additions: pr.additions,
      deletions: pr.deletions,
      filesChanged: pr.changed_files
    })
    
    await user.save()
    
    console.log(`✅ Points updated: ${previousPoints} → ${user.points} (+${points})`)
    
    // Send success notification email (optional)
    try {
      await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: user.email,
          subject: `🎉 PR Merged! +${points} Points Earned`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4F46E5;">Congratulations ${user.name}! 🎊</h2>
              <p>Your pull request has been merged!</p>
              <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">${prTitle}</h3>
                <p><strong>Repository:</strong> ${repository.full_name}</p>
                <p><strong>PR #${pr.number}</strong></p>
                <p><strong>Points Earned:</strong> <span style="color: #10B981; font-size: 24px; font-weight: bold;">+${points}</span></p>
                <p><strong>Total Points:</strong> ${user.points}</p>
              </div>
              <p>
                <a href="${prUrl}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  View Pull Request
                </a>
              </p>
              <p style="color: #6B7280; font-size: 14px;">
                Keep up the great work! Check your rank on the <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/leaderboard">leaderboard</a>.
              </p>
            </div>
          `
        })
      })
    } catch (emailError) {
      console.error('Failed to send notification email:', emailError)
      // Don't fail the webhook if email fails
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully awarded ${points} points to ${user.name}`,
      data: {
        username: user.username,
        previousPoints,
        newPoints: user.points,
        pointsAdded: points,
        prNumber: pr.number,
        repository: repository.full_name
      }
    })
    
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message,
        received: true
      },
      { status: 500 }
    )
  }
}

// Handle GET requests (for webhook verification/testing)
export async function GET() {
  return NextResponse.json({ 
    status: 'active',
    message: 'DSoC GitHub Webhook Endpoint',
    events: ['pull_request'],
    actions: ['closed (merged)']
  })
}
