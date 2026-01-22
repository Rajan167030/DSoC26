import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';

// Add points and activity to a user
export async function POST(request) {
  try {
    await connectDB();
    
    const { 
      email, 
      points, 
      activityType, 
      activityDescription,
      prMerged = false,
      prOpened = false,
      issueResolved = false,
      commits = 0
    } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update points
    if (points) {
      user.stats.totalPoints += points;
    }

    // Update PR stats
    if (prMerged) {
      user.stats.pullRequests.total += 1;
      user.stats.pullRequests.merged += 1;
      user.stats.totalPoints += 50;
    }
    if (prOpened) {
      user.stats.pullRequests.total += 1;
      user.stats.pullRequests.open += 1;
      user.stats.totalPoints += 10;
    }

    // Update issue stats
    if (issueResolved) {
      user.stats.issues.total += 1;
      user.stats.issues.resolved += 1;
      user.stats.totalPoints += 30;
    }

    // Update commits
    if (commits > 0) {
      user.stats.commits += commits;
      user.stats.totalPoints += commits * 5;
    }

    // Add activity to timeline
    if (activityDescription) {
      const activity = {
        type: activityType || 'manual',
        description: activityDescription,
        points: points || (prMerged ? 50 : prOpened ? 10 : issueResolved ? 30 : commits * 5),
        date: new Date()
      };
      
      user.activities.unshift(activity);
      
      // Keep only last 50 activities
      if (user.activities.length > 50) {
        user.activities = user.activities.slice(0, 50);
      }
    }

    // Check and award badges
    await checkAndAwardBadges(user);

    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Points added successfully',
      user: {
        username: user.username,
        stats: user.stats,
        badges: user.badges,
        recentActivities: user.activities.slice(0, 5)
      }
    });
  } catch (error) {
    console.error('Error adding points:', error);
    return NextResponse.json(
      { error: 'Failed to add points' },
      { status: 500 }
    );
  }
}

// Helper function to check and award badges
async function checkAndAwardBadges(user) {
  const badges = [];

  // Check if badges already exist
  const hasBadge = (name) => user.badges.some(b => b.name === name);

  // First PR badge
  if (user.stats.pullRequests.total >= 1 && !hasBadge('First PR')) {
    badges.push({
      name: 'First PR',
      description: 'Submitted first pull request',
      icon: '🎯',
      earnedAt: new Date()
    });
  }

  // PR Master badge
  if (user.stats.pullRequests.merged >= 10 && !hasBadge('PR Master')) {
    badges.push({
      name: 'PR Master',
      description: 'Merged 10+ pull requests',
      icon: '🏆',
      earnedAt: new Date()
    });
  }

  // Code Warrior badge
  if (user.stats.commits >= 100 && !hasBadge('Code Warrior')) {
    badges.push({
      name: 'Code Warrior',
      description: 'Made 100+ commits',
      icon: '⚔️',
      earnedAt: new Date()
    });
  }

  // Century badge
  if (user.stats.totalPoints >= 100 && !hasBadge('Century')) {
    badges.push({
      name: 'Century',
      description: 'Earned 100+ points',
      icon: '💯',
      earnedAt: new Date()
    });
  }

  // Legend badge
  if (user.stats.totalPoints >= 500 && !hasBadge('Legend')) {
    badges.push({
      name: 'Legend',
      description: 'Earned 500+ points',
      icon: '👑',
      earnedAt: new Date()
    });
  }

  // Add all new badges
  if (badges.length > 0) {
    user.badges.push(...badges);
  }
}
