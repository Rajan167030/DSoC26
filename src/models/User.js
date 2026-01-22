import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  // Unique Profile Identifier
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true
  },
  
  // Authentication (for future use)
  password: String,
  
  // Profile
  githubUsername: String,
  linkedinUrl: String,
  bio: String,
  avatar: String,
  college: String,
  graduationYear: String,
  organization: String,
  
  role: {
    type: String,
    enum: ['contributor', 'mentor', 'project-admin', 'admin'],
    default: 'contributor',
    index: true
  },
  
  // Selection Status
  isSelected: {
    type: Boolean,
    default: false
  },
  selectionDate: Date,
  
  // Contribution Stats for Contributors
  stats: {
    totalPoints: {
      type: Number,
      default: 0
    },
    pullRequests: {
      total: { type: Number, default: 0 },
      merged: { type: Number, default: 0 },
      open: { type: Number, default: 0 },
      closed: { type: Number, default: 0 }
    },
    issues: {
      total: { type: Number, default: 0 },
      resolved: { type: Number, default: 0 },
      open: { type: Number, default: 0 }
    },
    commits: {
      type: Number,
      default: 0
    },
    projectsContributed: {
      type: Number,
      default: 0
    },
    rank: String,
    streak: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 }
    }
  },
  
  // Mentor Stats
  mentorStats: {
    studentsGuided: { type: Number, default: 0 },
    sessionsCompleted: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    contributorsMentored: { type: Number, default: 0 },
    sessionsConducted: { type: Number, default: 0 },
    prsReviewed: { type: Number, default: 0 },
    contributorsList: [{
      name: String,
      username: String,
      email: String
    }]
  },
  
  // Project Admin Stats
  projectStats: {
    projectsManaged: { type: Number, default: 0 },
    contributorsOnboarded: { type: Number, default: 0 },
    totalContributions: { type: Number, default: 0 },
    totalContributors: { type: Number, default: 0 },
    prsMerged: { type: Number, default: 0 },
    issuesResolved: { type: Number, default: 0 },
    projectsList: [{
      name: String,
      description: String,
      repoUrl: String,
      contributors: Number,
      prs: Number,
      issues: Number,
      techStack: [String]
    }]
  },
  
  // Achievements & Badges
  badges: [{
    name: String,
    description: String,
    icon: String,
    earnedAt: Date
  }],
  
  // Activity Timeline
  activities: [{
    type: String,
    description: String,
    points: Number,
    date: { type: Date, default: Date.now }
  }],
  
  // Contributions (for webhook tracking)
  contributions: [{
    type: {
      type: String,
      enum: ['pull_request', 'issue', 'commit', 'review'],
      required: true
    },
    title: String,
    url: String,
    points: Number,
    repository: String,
    prNumber: Number,
    additions: Number,
    deletions: Number,
    filesChanged: Number,
    mergedAt: Date,
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Points (simplified for leaderboard)
  points: {
    type: Number,
    default: 0,
    index: true
  },
  
  // Tech Stack
  techStack: [String],
  expertise: [String],
  
  // References
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application'
  },
  idCardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IDCard'
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Admin
  isAdmin: {
    type: Boolean,
    default: false
  },
  
  // Activity tracking
  lastLoginAt: Date,
  loginCount: {
    type: Number,
    default: 0
  },
  
  // Profile Views
  profileViews: {
    type: Number,
    default: 0
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
UserSchema.index({ githubUsername: 1 });
UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ 'stats.totalPoints': -1 });
UserSchema.index({ points: -1 });
UserSchema.index({ isSelected: 1 });

// Generate username from email if not provided
UserSchema.pre('save', async function() {
  if (!this.username && this.email) {
    const baseUsername = this.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    let username = baseUsername;
    let counter = 1;
    
    // Ensure unique username
    while (await mongoose.models.User.findOne({ username, _id: { $ne: this._id } })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }
    
    this.username = username;
  }
  this.updatedAt = new Date();
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
