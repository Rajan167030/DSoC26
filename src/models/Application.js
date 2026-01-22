import mongoose from 'mongoose';

const ApplicationSchema = new mongoose.Schema({
  applicationId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  // Personal Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  role: {
    type: String,
    required: true,
    enum: ['contributor', 'mentor', 'project-admin'],
    index: true
  },
  
  // Social Links
  githubUsername: {
    type: String,
    trim: true
  },
  github: {
    type: String,
    trim: true
  },
  linkedinUrl: {
    type: String,
    trim: true
  },
  linkedin: {
    type: String,
    trim: true
  },
  
  // Contributor Specific
  college: String,
  graduationYear: String,
  techStack: [String],
  experienceLevel: String,
  whyContribute: String,
  
  // Mentor Specific
  organization: String,
  yearsOfExperience: String,
  expertise: [String],
  mentorshipExperience: String,
  availability: String,
  
  // Project Admin Specific
  projectName: String,
  projectDescription: String,
  projectUrl: String,
  techStackUsed: [String],
  lookingFor: String,
  projectGoals: String,
  
  // Application Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  
  // Timestamps
  submittedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Admin Notes
  adminNotes: String,
  reviewedBy: String,
  reviewedAt: Date
}, {
  timestamps: true
});

// Indexes for faster queries
ApplicationSchema.index({ email: 1, status: 1 });
ApplicationSchema.index({ role: 1, status: 1 });
ApplicationSchema.index({ createdAt: -1 });

// Pre-save middleware to update timestamps (Mongoose 8.x async style)
ApplicationSchema.pre('save', async function() {
  this.updatedAt = new Date();
});

export default mongoose.models.Application || mongoose.model('Application', ApplicationSchema);
