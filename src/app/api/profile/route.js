import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';

// Create or Update User Profile
export async function POST(request) {
  try {
    await connectDB();
    
    const data = await request.json();
    const { email, name, githubUsername, linkedinUrl, bio, techStack, expertise, role } = data;

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    // Find existing user or create new
    let user = await User.findOne({ email });

    if (user) {
      // Update existing user
      user.name = name;
      user.githubUsername = githubUsername || user.githubUsername;
      user.linkedinUrl = linkedinUrl || user.linkedinUrl;
      user.bio = bio || user.bio;
      user.techStack = techStack || user.techStack;
      user.expertise = expertise || user.expertise;
      user.role = role || user.role;
      
      await user.save();
    } else {
      // Create new user
      user = new User({
        email,
        name,
        githubUsername,
        linkedinUrl,
        bio,
        techStack,
        expertise,
        role
      });
      
      await user.save();
    }

    return NextResponse.json({
      message: 'Profile saved successfully',
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        username: user.username,
        githubUsername: user.githubUsername,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error saving user profile:', error);
    return NextResponse.json(
      { error: 'Failed to save user profile' },
      { status: 500 }
    );
  }
}

// Get user profile by email
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email })
      .select('-password -__v')
      .populate('applicationId')
      .lean();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

// Update user stats (for contribution tracking)
export async function PATCH(request) {
  try {
    await connectDB();
    
    const data = await request.json();
    const { email, stats, activity } = data;

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

    // Update stats if provided
    if (stats) {
      Object.keys(stats).forEach(key => {
        if (stats[key] !== undefined) {
          if (typeof stats[key] === 'object' && !Array.isArray(stats[key])) {
            user.stats[key] = { ...user.stats[key], ...stats[key] };
          } else {
            user.stats[key] = stats[key];
          }
        }
      });
    }

    // Add activity to timeline
    if (activity) {
      user.activities.unshift(activity);
      // Keep only last 50 activities
      if (user.activities.length > 50) {
        user.activities = user.activities.slice(0, 50);
      }
    }

    await user.save();

    return NextResponse.json({
      message: 'Stats updated successfully',
      user: {
        username: user.username,
        stats: user.stats
      }
    });
  } catch (error) {
    console.error('Error updating user stats:', error);
    return NextResponse.json(
      { error: 'Failed to update user stats' },
      { status: 500 }
    );
  }
}
