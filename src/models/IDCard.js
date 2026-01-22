import mongoose from 'mongoose';

const IDCardSchema = new mongoose.Schema({
  idNumber: {
    type: String,
    required: true,
    unique: true
  },
  
  // Link to application
  applicationId: {
    type: String,
    required: true
  },
  
  // User Information
  name: {
    type: String,
    required: true
  },
  username: {
    type: String
  },
  email: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true,
    enum: ['contributor', 'mentor', 'project-admin']
  },
  
  // Photo and Links
  photo: {
    type: String, // Base64 or URL
    required: true
  },
  githubUsername: String,
  linkedinUrl: String,
  profileUrl: {
    type: String,
    required: true
  },
  
  // QR Code
  qrCodeDataUrl: String,
  
  // Image
  imageUrl: String, // Base64 of the generated ID card
  
  // Metadata
  useGithubPhoto: {
    type: Boolean,
    default: true
  },
  
  // Download tracking
  downloadCount: {
    type: Number,
    default: 0
  },
  lastDownloadedAt: Date,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
IDCardSchema.index({ email: 1 });
IDCardSchema.index({ applicationId: 1 });
IDCardSchema.index({ username: 1 });
IDCardSchema.index({ createdAt: -1 });

// Method to increment download count
IDCardSchema.methods.recordDownload = function() {
  this.downloadCount += 1;
  this.lastDownloadedAt = new Date();
  return this.save();
};

export default mongoose.models.IDCard || mongoose.model('IDCard', IDCardSchema);
